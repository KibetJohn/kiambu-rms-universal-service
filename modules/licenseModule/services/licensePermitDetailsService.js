const knex = require("../../../lib/knex");
const {
  toSentenceCase,
  convertKeysToSnakeCase,
} = require("../../../lib/helper");
const appConstants = require("../../../constant/appConstants");
const { updatePermit } = require("./permitService");
const errors = require("../../../lib/errors");
const promisify = require("../../../lib/async");
const { updateApplication, getApplicationById, assignSubCountyToNewApplication } = require("../../../lib/api");
const {
  findOneServiceData,
} = require("../../masterDataModule/dbServices/licenseAndPermitsDbServices");
const { errorConstants } = require("../../../constant/errorConstants");
const { fetchPermitDetails } = require("../dbServices/permitDbService");
const { updateLicensePermitService, getUpdatedLicenseDetails } = require("./licenseApplicationService");
const { updateLicenseBill } = require("../dbServices/billDbService");
const {
  fetchMedicalStaffDetails,
  updateStaffPermit,
  fetchMedicalStaffPermitRecords,
} = require("../dbServices/medicalStaffDbService");
const { getFromRedis } = require("../../../lib/redis");
const { redisKeys } = require("../../../constant/redisKeys");
const logger = require("../../../lib/logger");

const licenseListFromIds = async (body) => {
  let { licenseIds, search, serviceType } = body;

  const serviceIds = [];

  if (serviceType?.length) {
    const servicePromises = serviceType.map((item) =>
      findOneServiceData({ name: item })
    );
    const serviceDataArray = await Promise.all(servicePromises);

    serviceDataArray.forEach((serviceData) => {
      if (serviceData?.id) {
        serviceIds.push(serviceData.id);
      }
    });
  }

  const query = knex("license_permits as lp")
    .select(
      "lp.id as entity_id",
      "permit_master_data.category_id as categoryId",
      "category.name as category",
      "lp.plot_number as plotNumber",
      "lp.service_id as serviceId",
      "services.name as serviceName",
      "lp.no_of_months as noOfMonths",
      "permit_master_data.amount_payment_type as duration",
      "lp.business_name",
      "lp.business_registration_no",
      "sub_category.name as subCategory",
      "lp.sub_county_id as subCountyId",
      "lp.ward_id as wardId",
    )
    .leftJoin(
      "permit_master_data",
      "permit_master_data.id",
      "lp.permit_master_id"
    )
    .leftJoin("category", "category.id", "permit_master_data.category_id")
    .leftJoin("sub_category", "sub_category.id", "permit_master_data.sub_category_id")
    .leftJoin("services", "services.id", "lp.service_id");

  if (search) {
    query.andWhere((builder) => {
      builder
        .orWhereRaw("LOWER(category.name) ILIKE ?", `%${search}%`)
        .orWhereRaw("LOWER(lp.plot_number) ILIKE ?", `%${search}%`);
    });
  } else {
    query.whereIn("lp.id", licenseIds);
  }

  if (serviceIds?.length) {
    query.whereIn("lp.service_id", serviceIds);
  }

  const list = await query;
  const wards = await getFromRedis(redisKeys.wards);
    if (Array.isArray(list) && wards) {
      for (const row of list) {
        const ward = wards[row.wardId];
        row.ward = ward ? toSentenceCase(ward.name) : null;
      }
    }
    const subCounties = await getFromRedis(redisKeys.subCounties);
    if (Array.isArray(list) && subCounties) {
      for (const row of list) {
        const subCounty = subCounties[row.subCountyId];
        row.subCounty = subCounty ? toSentenceCase(subCounty.name) : null;
      }
    }

  return list || [];
};

const cancelLicenseService = async (permitId, reason, headers) => {
  const transaction = await promisify(knex.transaction.bind(knex));
  try {
    const permitDetails = await fetchPermitDetails({ id: permitId }, null, {
      permit_status: appConstants.PERMIT_STATUS.IN_ACTIVE,
    });

    if (!permitDetails || Object.keys(permitDetails).length === 0) {
      throw errors.NOT_FOUND("Permit does not exists or cancelled.");
    }

    const condition = {
      permit_status: appConstants.PERMIT_STATUS.IN_ACTIVE,
    };

    if (
      permitDetails &&
      !(
        permitDetails?.applicationStatus ==
        appConstants.APPLICATION_STATUS.APPROVED
      )
    ) {
      condition.application_status = appConstants.APPLICATION_STATUS.REJECTED;
      await updateApplication(
        { applicationId: permitDetails?.applicationId },
        headers
      );
    }

    condition.cancellation_reason = reason;

    const [result] = await updatePermit(
      condition,
      { id: permitId },
      [
        "id as permitId",
        "application_id as applicationId",
        "user_id as userId",
        "service_id as serviceId",
      ],
      transaction
    );

    const { data: applicationDetails } = await getApplicationById(
      result.applicationId,
      headers
    );

    if (!applicationDetails)
      throw errors.NOT_FOUND("Application does not exists.");

    const [serviceData] = await findOneServiceData({
      id: result?.serviceId,
    });

    if (!serviceData) throw errors.NOT_FOUND(errorConstants.SERVICE_NOT_FOUND);

    await transaction.commit();
    return {
      ...result,
      serviceName: toSentenceCase(serviceData?.name),
      applicationRefNumber: applicationDetails.reference_no,
    };
  } catch (error) {
    await transaction.rollback();
    console.log("Error in Cancel bill", error);
    throw error;
  }
};

const updateLicensePaymentStatus = async (body, permitId, headers = {}) => {
  const transaction = await promisify(knex.transaction.bind(knex));
  try {
    body = convertKeysToSnakeCase(body);
    let permitDetails = await fetchPermitDetails(
      { "license_permits.id": permitId },
      [`license_permits.*`, `services.name as service`],
      null,
      [["services", "services.id", "license_permits.service_id"]]
    );

    if (!permitDetails || Object.keys(permitDetails).length === 0) {
      const [staffPermitDetails] = await fetchMedicalStaffDetails(
        {
          "medical_staff_permits.id": permitId,
        },
        [
          "medical_staff_permits.id as staffPermitId",
          "license_permits.id as permitId",
          "license_permits.service_id as serviceId",
          "services.name as serviceName",
          "license_permits.application_for_staff as applicationForStaff",
          "medical_staff_permits.permit_payment_id as permitPaymentId",
        ],
        [["services", "services.id", "license_permits.service_id"]]
      );
      permitDetails = staffPermitDetails;
    }

    if (body.bill_no) {
      await updateLicenseBill(
        { status: body.payment_status },
        { permit_id: permitId, bill_reference: body.bill_no }
      );
    }

    if (
      body?.payment_id &&
      body?.payment_id == permitDetails?.permitPaymentId
    ) {
      if (permitDetails?.applicationForStaff) {
        await updateStaffPermit(
          {
            permit_payment_status: body.payment_status,
            permit_status:
              body?.payment_status === appConstants.PAYMENT_STATUS.PAID
                ? appConstants.PERMIT_STATUS.ACTIVE
                : appConstants.PERMIT_STATUS.PENDING,
          },
          {
            id: permitId,
          },
          ["id"],
          transaction
        );
        const allStaff = await fetchMedicalStaffPermitRecords(
          { permit_id: permitDetails.permitId },
          ["*"], 
          transaction
        );
        const allStaffActive = allStaff.every(
          (permit) => permit.permit_status == appConstants.PERMIT_STATUS.ACTIVE
        );

        if (allStaffActive) {
          await updateLicensePermitService(
            {
              permit_status: appConstants.PERMIT_STATUS.ACTIVE,
            },
            {
              id: permitDetails?.permitId,
            },
            transaction
          );
        }
      } else {
        await updateLicensePermitService(
          {
            permit_payment_status: body.payment_status,
            permit_status:
              body?.payment_status === appConstants.PAYMENT_STATUS.PAID
                ? appConstants.PERMIT_STATUS.ACTIVE
                : appConstants.PERMIT_STATUS.PENDING,
          },
          {
            id: permitId,
          },
          transaction
        );
      }
    }

    if (body.payment_id && body.payment_id == permitDetails?.paymentId) {
      let updateBody = {
        payment_status: body.payment_status,
      };

      if (permitDetails.service === appConstants.SERVICES.LAND_RENT_AND_RATES) {
        updateBody.permit_status =
          body?.payment_status === appConstants.PAYMENT_STATUS.PAID
            ? appConstants.PERMIT_STATUS.ACTIVE
            : appConstants.PERMIT_STATUS.PENDING;
      }

      await updateLicensePermitService(
        updateBody,
        {
          id: permitId,
        },
        transaction
      );
    }

    let updatedPermits;

    if (permitDetails?.applicationForStaff) {
      updatedPermits = await knex('medical_staff_permits as msp')
        .transacting(transaction)
        .select('msp.application_id', 'lp.payment_status', 'lp.sub_county_id')
        .join('license_permits as lp', 'msp.permit_id', 'lp.id')
        .where('lp.payment_id', body.payment_id);
    } else {
      updatedPermits = await knex('license_permits')
        .transacting(transaction)
        .select('application_id', 'payment_status', 'sub_county_id')
        .where('payment_id', body.payment_id);
    }

    await transaction.commit();

    if (!updatedPermits || updatedPermits.length === 0) {
      logger.error(`No updated permit found for payment_id: ${body.payment_id}`);
    } else {
      for (const updatedPermit of updatedPermits) {
        await assignSubCountyToNewApplication(
          {
            application_id: updatedPermit.application_id,
            sub_county_id: updatedPermit.sub_county_id,
            payment_status: updatedPermit.payment_status,
          },
          headers
        );
      }
    }

  } catch (error) {
    await transaction.rollback();
    console.error("Error in updated the permit payment status", error);
    throw error;
  }
};

module.exports = {
  licenseListFromIds,
  cancelLicenseService,
  updateLicensePaymentStatus,
};

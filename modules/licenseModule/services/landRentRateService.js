const {
  fetchPricingData,
} = require("../../masterDataModule/services/pricingService");
const promisify = require("../../../lib/async");
const knex = require("../../../lib/knex");
const errors = require("../../../lib/errors");
const {
  fetchLicenseApplicationStatus,
  getExpiryDate,
  licensePermitService,
  updateLicensePermit,
} = require("../dbServices/permitDbService");
const appConstants = require("../../../constant/appConstants");
const {
  getPaymentIntent,
  getPartialPaymentIntent,
  submitLandRatesApplication,
  assignSubCountyToNewApplication,
} = require("../../../lib/api");
const {
  convertKeysToCamelCase,
  toSentenceCase,
} = require("../../../lib/helper");
const { enums } = require("../../../constant/enumConstants");
const { isEmpty, filter } = require("lodash");
const {
  findExistingCategory,
  findExistingSubCategory,
} = require("../../masterDataModule/dbServices/licenseAndPermitsDbServices");
const {
  getLandRentRateDetails,
} = require("../dbServices/landRentRateDbService");
const { fetchDetailsFromRedis } = require("../../../lib/redis");
const { redisKeys } = require("../../../constant/redisKeys");
const { getFromRedis } = require("../../../lib/redis");
const _ = require("lodash");

const plotDetailsService = async (query) => {
  try {
    const plotDetails = await fetchPricingData({
      search: query.plotNumber,
      leftJoinConditions: [
        [
          "permit_master_data",
          "pricing_data.permit_master_id",
          "permit_master_data.id",
        ],
        ["services", "services.id", "pricing_data.service_id"],
        ["category", "category.id", "permit_master_data.category_id"],
        [
          "sub_category",
          "sub_category.id",
          "permit_master_data.sub_category_id",
        ],
      ],
      select: [
        "pricing_data.id",
        "pricing_data.amount",
        "pricing_data.plot_no as plotNumber",
        "category.name as categoryName",
        "sub_category.name as subCategoryName",
        "services.name as servicesName",
        "permit_master_data.is_partial_payment_allowed as partialPaymentAllowed",
        "permit_master_data.amount_payment_type as duration",
      ],
    });

    return plotDetails;
  } catch (error) {
    console.error("Error in getting plot details", error);
    throw error;
  }
};

const payLandRentRateService = async (body, query, createdById, headers, isAdmin) => {
  const transaction = await promisify(knex.transaction.bind(knex));
  try {
    let pricingDetails = await landRentRatePricingService({
      "pricing_data.is_active": true,
      "permit_master_data.is_active": true,
      "pricing_data.id": body?.pricingId,
    });

    if (isEmpty(pricingDetails))
      throw errors.NOT_FOUND("Pricing for this plot number does not exists.");

    if (pricingDetails.duration === enums.PAYMENT_TYPES[0]) {
      pricingDetails.amount = body.numberOfMonths
        ? parseInt(body.numberOfMonths) * pricingDetails.amount
        : pricingDetails.amount;
    }
    let fetchPayload = {
      service_id: pricingDetails?.serviceId,
      permit_master_id: pricingDetails?.permitMasterId,
      plot_number: pricingDetails?.plotNo,
    };

    if (body?.isRenew) {
      fetchPayload.is_renew = body?.isRenew;
    }
    const submittedApplications = await fetchLicenseApplicationStatus(
      fetchPayload
    );

    const activePermit = submittedApplications.find((application) => {
      return application?.permit_status === appConstants.PERMIT_STATUS.ACTIVE;
    });

    if (activePermit) {
      throw errors.INVALID_INPUT(
        "A permit is already active on this plot number."
      );
    }

    let payload = {
      user_id: body?.userId,
      county_id: body?.countyId,
      service_id: pricingDetails?.serviceId,
      permit_master_id: pricingDetails?.permitMasterId,
      phone_number: body?.phoneNumber,
      email: body?.email,
      plot_number: pricingDetails?.plotNo,
      amount: pricingDetails?.amount,
      created_by: createdById,
      permit_status: appConstants.PERMIT_STATUS.PENDING,
      valid_till: getExpiryDate(pricingDetails?.duration, body.numberOfMonths),
      no_of_months: body.numberOfMonths || null,
      is_renew: body?.isRenew ? body.isRenew : false,
      sub_county_id: pricingDetails?.subCountyId,
      ward_id: pricingDetails?.wardId,
    };

    const [insertPermit] = await licensePermitService(payload, transaction);

    if (pricingDetails.partialPaymentAllowed && body?.partialAmount) {
      if (parseInt(body?.partialAmount) > parseInt(pricingDetails.amount))
        throw errors.NOT_ALLOWED(
          "Partial amount can't exceeds the actual permit amount."
        );
    }

    let sub_county_id = pricingDetails?.subCountyId;
    let subCounty = _.get(await getFromRedis(redisKeys.subCounties), sub_county_id, '');
    subCounty = toSentenceCase(_.get(subCounty, 'name', ''));

    const applicationBody = {
      user_id: body?.userId,
      county_id: body?.countyId,
      type: pricingDetails?.serviceName,
      application: JSON.stringify({
        category: pricingDetails?.categoryName,
        sub_category: pricingDetails?.subCategoryName,
        stream: body.stream,
        description: body.description,
        phone_number: body?.phoneNumber,
        email: body?.email,
        plot_number: pricingDetails?.plotNo,
        amount: pricingDetails?.amount,
        service_id: pricingDetails?.serviceId,
        service_name: pricingDetails?.serviceName,
        sub_county_id: pricingDetails?.subCountyId,
        sub_county: subCounty,
        businessInfo: {
          business_detail: {
            sub_county_id: pricingDetails?.subCountyId,
            ward_id: pricingDetails?.wardId,
          },
        },
      }),
      is_admin: isAdmin,
    };
    
    const application = await submitLandRatesApplication(applicationBody, headers);

    let paymentDetails;
    if (pricingDetails.partialPaymentAllowed && body?.partialAmount) {
      const partialPaymentPayload = {
        phoneNumber: body?.phoneNumber,
        partialPaymentId: body?.partialPaymentId,
        userId: body?.userId,
        entityId: insertPermit,
        amount: body?.partialAmount.toString(),
        paymentByEnforcer: body?.isEnforcerCall ? body?.isEnforcerCall : false,
        email: body?.email,
      };

      if (query?.payment_mode === appConstants.PAYMENT_MODES.MPESSA_EXPRESS) {
        paymentDetails = await getPartialPaymentIntent(
          partialPaymentPayload,
          query,
          headers
        );
        if (
          !paymentDetails &&
          !paymentDetails.paymentIntent &&
          !paymentDetails?.paymentIntent?.id
        )
          throw errors.NOT_FOUND("Payment Failed.");
      } else if (query?.payment_mode === appConstants.PAYMENT_MODES.KCB) {
        paymentDetails = await getPartialPaymentIntent(
          partialPaymentPayload,
          query,
          headers
        );
      }
    } else {
      const paymentPayload = {
        user_id: body.userId,
        entity_id: insertPermit,
        email: body?.email,
        payment_type: appConstants.AUDIT_CONSTANTS.UNIVERSAL,
        created_by: createdById,
        county_id: body?.countyId,
        payment_by_enforcer: body?.isEnforcerCall
          ? body?.isEnforcerCall
          : false,
        amount: pricingDetails?.amount.toString(),
        phone_number: body?.phoneNumber,
        sub_service_type: pricingDetails?.serviceName,
        payment_id: body?.paymentId,
      };

      if (query?.payment_mode === appConstants.PAYMENT_MODES.MPESSA_EXPRESS) {
        paymentDetails = await getPaymentIntent(paymentPayload, query, headers);
        if (
          !paymentDetails &&
          !paymentDetails.paymentIntent &&
          !paymentDetails?.paymentIntent?.id
        )
          throw errors.NOT_FOUND("Payment Failed.");
      } else if (query?.payment_mode === appConstants.PAYMENT_MODES.KCB) {
        paymentDetails = await getPaymentIntent(paymentPayload, query, headers);
      }
    }

    await updateLicensePermit(
      {
        payment_id: body?.paymentId,
        payment_status: appConstants.PAYMENT_STATUS.NOT_PAID,
        application_id: application?.data?.applicationId,
        application_status: appConstants.APPLICATION_STATUS.SUBMITTED,
      },
      insertPermit,
      transaction
    );

    const [updatedPermit] = await transaction('license_permits')
    .select('application_id', 'payment_status', 'sub_county_id')
    .where({ id: insertPermit });

    await transaction.commit();

    await assignSubCountyToNewApplication(
      {
        application_id: updatedPermit.application_id,
        sub_county_id: updatedPermit.sub_county_id,
        payment_status: updatedPermit.payment_status,
      },
      headers
    );

    return {
      licenseDetails: {
        plotNumber: pricingDetails?.plotNumber,
        categoryName: pricingDetails?.categoryName,
        subCategoryName: pricingDetails?.subCategoryName,
        serviceName: pricingDetails?.serviceName,
        amount: pricingDetails?.amount,
      },
      paymentIntent: convertKeysToCamelCase(paymentDetails?.paymentIntent),
    };
  } catch (error) {
    await transaction.rollback();
    console.error("Error in paying the land rent rate service", error);
    throw error;
  }
};

const getRenewLicensePermitList = async (body, query) => {
  let permitList = await knex("license_permits as lp")
    .select(
      "lp.valid_till as expiry_date",
      "lp.id as permitId",
      "permit_master_data.category_id as categoryId",
      "category.name as category",
      "lp.plot_number as plotNumber",
      "lp.amount",
      "lp.user_id as userId",
      "lp.no_of_months as noOfMonths",
      knex.raw("extract(epoch from lp.valid_till) * 1000 as valid_till"),
      "lp.service_id as serviceId",
      "services.name as serviceName",
      "permit_master_data.amount_payment_type as duration"
    )
    .leftJoin(
      "permit_master_data",
      "permit_master_data.id",
      "lp.permit_master_id"
    )
    .leftJoin("category", "category.id", "permit_master_data.category_id")
    .leftJoin("services", "services.id", "lp.service_id")
    .where({ "lp.user_id": body.user_id, "lp.county_id": body.county_id })
    .whereIn("lp.permit_status", [
      appConstants.PERMIT_STATUS.ACTIVE,
      appConstants.PERMIT_STATUS.EXPIRED,
    ])
    .orderBy("lp.valid_till");

  let filteredList = [];

  if (!isEmpty(permitList)) {
    // filter out total list on basis of permit available for renew
    permitList = filter(permitList, (list) => {
      // check if avalilable for renew and add the key
      if (checkIfPermitIsAvailableForRenew(list)) list.is_renew = true;

      // filter out on basis of is_renew
      if (list.is_renew) return list;
    });

    let { page, limit } = query;

    page = parseInt(page);
    limit = parseInt(limit);
    if (limit > 20) limit = 20;

    const skip = limit * (page - 1);

    filteredList = filter(permitList, (list, index) => {
      if (skip <= index && index < skip + limit) {
        return list;
      }
    });
  }

  return {
    success: true,
    totalCount: permitList.length || 0,
    list: filteredList || [],
  };
};

const checkIfPermitIsAvailableForRenew = (permit) => {
  const { expiry_date } = permit;
  let isAvailableForRenew = false;

  // permit type or valid till is not present
  if (!expiry_date || expiry_date == "") return isAvailableForRenew;

  // date
  const date = new Date();

  // valid till date
  let validTillDate = new Date(expiry_date);

  // set one week renewal before date from valid till
  validTillDate.setDate(validTillDate.getDate() - 7);

  if (validTillDate < date) isAvailableForRenew = true;

  return isAvailableForRenew;
};

const getOrderSummaryService = async (body) => {
  try {
    const [categoryDetails, subCategoryDetails] = await Promise.all([
      findExistingCategory({ id: body?.categoryId }).then(([data]) => data),
      findExistingSubCategory({ id: body?.subCategoryId }).then(
        ([data]) => data
      ),
    ]);

    if (!categoryDetails || !subCategoryDetails) {
      throw errors.NOT_FOUND(`Category or Subcategory data not found.`);
    }

    const [result] = await getLandRentRateDetails(body);
    if (!result) {
      throw errors.NOT_FOUND(`Order details not found.`);
    }
    return {
      categoryId: categoryDetails?.id,
      categoryName: toSentenceCase(categoryDetails?.name) || "-",
      subCategoryId: subCategoryDetails?.id,
      subCategoryName: toSentenceCase(subCategoryDetails?.name) || "-",
      ...result,
    };
  } catch (error) {
    console.error("Error in get order summary:", error);
    throw error;
  }
};

const landRentRatePricingService = async (condition) => {
  const pricingQuery = knex("pricing_data")
    .leftJoin(
      "permit_master_data",
      "permit_master_data.id",
      "pricing_data.permit_master_id"
    )
    .leftJoin("category", "permit_master_data.category_id", "category.id")
    .leftJoin(
      "sub_category",
      "permit_master_data.sub_category_id",
      "sub_category.id"
    )
    .leftJoin("services", "services.id", "permit_master_data.service_id")
    .select(
      "pricing_data.id as pricingDataId",
      "pricing_data.amount",
      "category.name as categoryName",
      "sub_category.name as subCategoryName",
      "pricing_data.sub_county_id as subCountyId",
      "pricing_data.ward_id as wardId",
      "permit_master_data.sub_category_id as subCategoryId",
      "permit_master_data.category_id as categoryId",
      "pricing_data.plot_no as plotNo",
      "services.name as serviceName",
      "permit_master_data.amount_payment_type as duration",
      "permit_master_data.is_partial_payment_allowed as partialPaymentAllowed",
      "permit_master_data.id as permitMasterId",
      "services.id as serviceId"
    );

  if (condition) {
    pricingQuery.where(condition);
  }
  const [pricingData] = await pricingQuery;
  if (!isEmpty(pricingData)) {
    const [subCounty, ward] = await Promise.all([
      fetchDetailsFromRedis(redisKeys.subCounties, pricingData.subCountyId),
      fetchDetailsFromRedis(redisKeys.wards, pricingData.wardId),
    ]);
    pricingData.subCountyName = toSentenceCase(subCounty?.name) || "-";
    pricingData.wardName = toSentenceCase(ward?.name) || "-";
    pricingData.categoryName = toSentenceCase(pricingData?.categoryName) || "-";
    pricingData.subCategoryName =
      toSentenceCase(pricingData?.subCategoryName) || "-";
  }
  return pricingData || {};
};

module.exports = {
  plotDetailsService,
  payLandRentRateService,
  getRenewLicensePermitList,
  getOrderSummaryService,
  landRentRatePricingService,
};

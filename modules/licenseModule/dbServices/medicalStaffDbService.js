const appConstants = require("../../../constant/appConstants");
const { getUserInformation } = require("../../../lib/api");
const { toSentenceCase } = require("../../../lib/helper");
const knex = require("../../../lib/knex");
const logger = require("../../../lib/logger");
const { updatePaymentData } = require("./paymentDbService");
const { getFromRedis } = require("../../../lib/redis");
const { redisKeys } = require("../../../constant/redisKeys");
const { get } = require("lodash");

const fetchMedicalStaffDetails = async (
  condition,
  select = ["*"],
  leftJoinConditions = []
) => {
  try {
    const query = knex("license_permits")
      .select(select)
      .leftJoin(
        "medical_staff_permits",
        "medical_staff_permits.permit_id",
        "license_permits.id"
      )
      .where(condition);

    if (Array.isArray(leftJoinConditions) && leftJoinConditions.length > 0) {
      leftJoinConditions.forEach((join) => {
        if (Array.isArray(join) && join.length === 3) {
          query.leftJoin(join[0], join[1], join[2]);
        }
      });
    }
    return await query;
  } catch (error) {
    console.error(
      "Error in checking existing medical staff application service:",
      error
    );
    throw error;
  }
};

const fetchMedicalStaffPermitRecords = async (
  condition,
  select,
  transaction
) => {
  let query;
  if (transaction) {
    query = transaction("medical_staff_permits")
      .select(select)
      .where(condition);
  } else {
    query = knex("medical_staff_permits").select(select).where(condition);
  }
  return await query;
};

const insertStaffMembersDetails = async (body, select, transaction) => {
  try {
    if (transaction) {
      return await transaction("medical_staff_permits")
        .insert(body)
        .returning(select);
    } else
      return await knex("medical_staff_permits").insert(body).returning(select);
  } catch (error) {
    logger.error("Error while adding medical staff application", error);
    throw error;
  }
};

const updateStaffPermitDetails = async (
  applicationResponse,
  staffPermitIds,
  select = ["*"],
  transaction
) => {
  try {
    const updatePromises = applicationResponse.map((app, index) => {
      const staffPermitId = staffPermitIds[index];

      if (staffPermitId) {
        const updateBody = {
          application_status: app.applicationStatus,
          application_id: app.applicationId,
        };

        let query;
        if (transaction) {
          query = transaction("medical_staff_permits")
            .where({ id: staffPermitId })
            .update(updateBody)
            .returning(select);
        } else {
          query = knex("medical_staff_permits")
            .where({ id: staffPermitId })
            .update(updateBody)
            .returning(select);
        }

        return query;
      }
    });
    const updatedRecords = await Promise.all(updatePromises);

    return updatedRecords.flat();
  } catch (error) {
    console.error("Error updating staff permit details", error);
    throw error;
  }
};

const medicalPermitDetailService = async (
  condition,
  headers,
  isInternal = false
) => {
  try {
    let selectFields = [
      "lp.id as permitId",
      "msp.id as staffPermitId",
      "lp.user_id as userId",
      knex.raw(
        'COALESCE(msp.permit_status,lp.permit_status) as "permitStatus"'
      ),
      "lp.created_at as createdAt",
      "lp.service_id as serviceId",
      "lp.application_for_staff as applicationForStaff",
      "category.name as category",
      "sub_category.name as subCategory",
      "permit_master_data.is_certificate_apply as isCertificateApply",
      "permit_master_data.application_fee as applicationFee",
      "msp.staff_name as staffName",
      "msp.document_number as documentNumber",
      "msp.reference_number as staffReferenceNumber",
      "lp.reference_number as referenceNumber",
      knex.raw("COALESCE(msp.description,lp.description) as description"),
      knex.raw("COALESCE(msp.email,lp.email) as email"),
      "msp.amount as staffPermitAmount",
      "lp.payment_id as applicationPaymentId",
      "lp.payment_status as applicationPaymentStatus",
      "lp.amount as totalAmount",
      knex.raw(
        'COALESCE(lp.permit_payment_id, msp.permit_payment_id) as "permitPaymentId"'
      ),
      knex.raw('COALESCE(lp.valid_till, msp.valid_till) as "validTill"'),
      knex.raw("COALESCE(lp.location, msp.location) as location"),
      knex.raw('COALESCE(lp.phone_number, msp.phone_number) as "phoneNumber"'),
      knex.raw(
        'COALESCE(lp.application_id, msp.application_id) as "applicationId"'
      ),
      "permit_master_data.permit_fee as permitFee",
      "services.name as serviceName",
      "lp.county_id as countyId",
      knex.raw(
        'COALESCE(lp.application_status, msp.application_status) as "applicationStatus"'
      ),
      "permit_master_data.amount_payment_type as duration",
      "lp.sub_county_id as subCountyId",
      "lp.ward_id as wardId",
      "lp.business_name as businessName",
      "lp.business_registration_no as businessRegNo",
      "lp.street",
      "lp.plot_number as plotNumber",
      "lp.floor_number as floorNumber",
      "lp.stall_number as stallNumber",
      "lp.building_name as buildingName",
      "lp.po_box as poBox",
      "lp.postal_code as postalCode"
    ];
    if (!isInternal) {
      selectFields.push(
        knex.raw(
          'document_data.additionalDocumentRequest as "additionalDocumentRequest"'
        ),
        knex.raw(
          'document_data.reuploadDocumentRequest as "reuploadDocumentRequest"'
        ),
        knex.raw(
          `COALESCE(uploaded_docs.documents, '[]')::json AS "uploadDocuments"`
        )
      );
    }

    let query = knex("license_permits as lp")
      .select(selectFields)
      .leftJoin("medical_staff_permits AS msp", "msp.permit_id", "lp.id")
      .leftJoin(
        "permit_master_data",
        "permit_master_data.id",
        knex.raw("COALESCE(msp.permit_master_id, lp.permit_master_id)")
      )
      .leftJoin("category", "category.id", "permit_master_data.category_id")
      .leftJoin(
        "sub_category",
        "sub_category.id",
        "permit_master_data.sub_category_id"
      )
      .leftJoin("services", "services.id", "lp.service_id");

    if (!isInternal) {
      query
        .leftJoin(
          knex.raw(`
            (
              SELECT
                permit_id,
                MAX(CASE WHEN reupload_document_request THEN 1 ELSE 0 END) AS reuploadDocumentRequest,
                MAX(CASE WHEN additional_document_request THEN 1 ELSE 0 END) AS additionalDocumentRequest
              FROM documents
              GROUP BY permit_id
            ) AS document_data
          `),
          "document_data.permit_id",
          knex.raw("COALESCE(msp.permit_id::UUID, lp.id::UUID)")
        )
        .leftJoin(
          knex.raw(`
            (
              SELECT permit_id, JSONB_AGG(flattened.documents) AS documents
              FROM (
                SELECT permit_id, jsonb_array_elements(d.documents) AS documents
                FROM documents d
              ) AS flattened
              GROUP BY permit_id
            ) AS uploaded_docs
          `),
          "uploaded_docs.permit_id",
          knex.raw("COALESCE(msp.id, lp.id)")
        );
    }

    if (condition && !isInternal) {
      query.where(condition);
    }

    if (isInternal) {
      query.where(function () {
        this.where("msp.id", condition).orWhere(function () {
          this.where("lp.id", condition);
        });
      });
    }
    const data = await query;
    
    if (data[0]?.userId && !data[0]?.applicationForStaff) {
      const userInfo = await getUserInformation(data[0].userId, headers);
      if (userInfo?.data) {
        userName = `${toSentenceCase(
          userInfo.data.first_name
        )} ${toSentenceCase(userInfo.data.last_name)}`;
        data[0].documentNumber = userInfo.data.document_number;
      }
    }

    if(data?.length) {
      await Promise.all(
        data.map(async (record) => {
          const subCounty = get(
            await getFromRedis(redisKeys.subCounties),
            record.subCountyId,
            ''
          );
          const ward = get(
            await getFromRedis(redisKeys.wards),
            record.wardId,
            ''
          );
          record.subCounty = toSentenceCase(get(subCounty, 'name', ''));
          record.ward = toSentenceCase(get(ward, 'name', ''));
        })
      );      
    }
    if (!isInternal) {
      const applicationPaymentRecords = data
        .filter((permit) => permit.applicationPaymentId)
        .map((permit) =>
          updatePaymentData(permit.applicationPaymentId, headers)
        );

      const permitPaymentRecords = data
        .filter((permit) => permit.permitPaymentId)
        .map((permit) => updatePaymentData(permit.permitPaymentId, headers));

      const [[paymentResults], permitPaymentResults] = await Promise.all([
        Promise.all(applicationPaymentRecords),
        Promise.all(permitPaymentRecords),
      ]);

      data.forEach((permit) => {
        if (permit?.permitPaymentId) {
          const matchingPayment = permitPaymentResults.find((payment) =>
            payment.paymentList.some((p) => p.id === permit.permitPaymentId)
          );

          permit.permitPaymentDetails = matchingPayment
            ? matchingPayment.paymentList
            : [];
        } else {
          permit.permitPaymentDetails = [];
        }
      });

      const totalRecords = data.length || 0;
      data.forEach((item) => delete item.totalrecords);
      return {
        data,
        applicationPaymentDetails: paymentResults,
        totalCount: totalRecords,
      };
    } else {
      return {
        data,
      };
    }
  } catch (error) {
    console.error(
      `Error in fetch medical service permit details: ${error?.message}`,
      {
        error,
      }
    );
    throw error;
  }
};

const updateStaffPermit = async (
  updateBody,
  condition,
  selectFields = ["id"],
  transaction
) => {
  if (transaction) {
    return await transaction("medical_staff_permits")
      .update(updateBody)
      .where(condition)
      .returning(selectFields);
  } else {
    return await knex("medical_staff_permits")
      .update(updateBody)
      .where(condition)
      .returning(selectFields);
  }
};

const staffPermitStatusUpdateService = async () => {
  try {
    const permits = await knex("medical_staff_permits")
      .select("permit_status", "id", "valid_till")
      .where(function () {
        this.where({
          permit_status: appConstants.PERMIT_STATUS.ACTIVE,
        }).orWhere({ permit_status: appConstants.PERMIT_STATUS.PENDING });
      });

    const permitIdsToBeExpired = [];

    forEach(permits, (permit) => {
      if (permit.valid_till && new Date(permit.valid_till) < new Date())
        permitIdsToBeExpired.push(permit.id);
    });

    if (permitIdsToBeExpired && permitIdsToBeExpired.length > 0) {
      await knex("medical_staff_permits")
        .update({ permit_status: appConstants.PERMIT_STATUS.EXPIRED })
        .whereIn("id", permitIdsToBeExpired);
    }
  } catch (error) {
    console.error("Error in medical staff permit ", error);
  }
};

module.exports = {
  fetchMedicalStaffDetails,
  fetchMedicalStaffPermitRecords,
  insertStaffMembersDetails,
  updateStaffPermitDetails,
  medicalPermitDetailService,
  updateStaffPermit,
  staffPermitStatusUpdateService,
};

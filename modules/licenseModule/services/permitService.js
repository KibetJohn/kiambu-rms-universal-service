const logger = require("../../../lib/logger");
const knex = require("../../../lib/knex");
const appConstants = require("../../../constant/appConstants");
const {
  getPaymentRecords,
  getUserInformation,
  getPaymentIntent,
} = require("../../../lib/api");
const {
  toSentenceCase,
  convertKeysToCamelCase,
} = require("../../../lib/helper");
const { uniq, map, forEach } = require("lodash");
const promisify = require("../../../lib/async");
const { fetchMasterData } = require("./categoryService");
const { fetchServices } = require("../../masterDataModule/services/service");
const errors = require("../../../lib/errors");
const { updateLicensePermitService } = require("./licenseApplicationService");
const { fetchPermitDetails } = require("../dbServices/permitDbService");
const { getFromRedis } = require("../../../lib/redis");
const { redisKeys } = require("../../../constant/redisKeys");
const {
  fetchMedicalStaffPermitRecords,
  updateStaffPermit,
} = require("../dbServices/medicalStaffDbService");
const { updatePaymentData } = require("../dbServices/paymentDbService");

const getPermitList = async (req) => {
  try {
    let { limit, page } = req.query;
    const { countyId, userId, serviceId } = req.body;
    const [service] = await fetchServices({ id: serviceId }, ["id", "name"]);
    limit = parseInt(limit);
    page = parseInt(page);

    limit = limit > appConstants.PAGE.LIMIT ? appConstants.PAGE.LIMIT : limit;
    page = limit * (page - 1);

    let selectFields = [
      "lp.id as permitId",
      "lp.county_id as countyId",
      "lp.permit_status as permitStatus",
      "lp.reference_number as referenceNumber",
      "lp.created_at as createdAt",
      "lp.service_id as serviceId",
      "services.name as servicesName",
      "category.name as category",
      "sub_category.name as subCategory",
      "permit_master_data.is_certificate_apply as isCertificateApply",
      "permit_master_data.application_fee as applicationFee",
      knex.raw("document_data.additionalDocumentRequest"),
      knex.raw("document_data.reuploadDocumentRequest"),
      knex.raw("COUNT(*) OVER() as totalRecords"),
      "lp.email",
      "lp.phone_number as phoneNumber"
    ];
    if (service.name !== appConstants.SERVICES.MEDICAL_CERTIFICATE) {
      selectFields.push(
        "lp.payment_id as paymentId",
        "lp.valid_till as validTill",
        "lp.amount",
        "permit_master_data.category_id as categoryId",
        "permit_master_data.sub_category_id as subCategoryId",
        "lp.payment_status as paymentStatus",
        "lp.application_status as applicationStatus",
        "lp.uploaded_documents_id as documentId",
        "lp.cancellation_reason as cancellationReason",
        "lp.permit_payment_status as permitPaymentStatus",
        "permit_master_data.permit_fee as permitFee",
        "lp.permit_payment_id as permitPaymentId"
      );
    } else {
      selectFields.push(
        "lp.application_for_staff as applicationForStaff",
        "lp.amount as applicationAmount",
        "lp.payment_id as applicationFeePaymentId",
        "lp.payment_status as applicationFeePaymentStatus"
      );
    }

    const dbQuery = knex("license_permits as lp")
      .select(selectFields)
      .leftJoin(
        "permit_master_data",
        "permit_master_data.id",
        "lp.permit_master_id"
      )
      .leftJoin("category", "category.id", "permit_master_data.category_id")
      .leftJoin(
        "sub_category",
        "sub_category.id",
        "permit_master_data.sub_category_id"
      )
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
        "lp.id"
      )
      .leftJoin("services", "services.id", "lp.service_id")
      .where({ "lp.county_id": countyId, "lp.service_id": serviceId });

    if (userId) {
      dbQuery.andWhere({ "lp.user_id": userId });
    }

    dbQuery.limit(limit).offset(page).orderBy("lp.created_at", "DESC");

    const data = await dbQuery;

    if (data?.length) {
      const paymentIds = data
        .filter((item) => item.paymentId)
        .map((payment) => payment.paymentId);

      const permitPaymentIds = data
        .filter((item) => item.permitPaymentId)
        .map((payment) => payment.permitPaymentId);

      const permitIds = data.map((permit) => permit.permitId);

      const [applicationPaymentRecords, permitPaymentRecords, billDetails] =
        await Promise.all([
          paymentIds.length
            ? getPaymentRecords({ payment_ids: paymentIds }, req.headers)
            : null,
          permitPaymentIds.length
            ? getPaymentRecords({ payment_ids: permitPaymentIds }, req.headers)
            : null,
          permitIds.length
            ? fetchLicenseBillDetails({ whereInCondition: permitIds })
            : null,
        ]);

      if (applicationPaymentRecords?.list?.length) {
        const paymentRecordMap = new Map(
          applicationPaymentRecords.list.map((record) => [
            record.payment_id,
            record,
          ])
        );

        data.forEach((item) => {
          const payRecord = paymentRecordMap.get(item.paymentId);
          if (payRecord) {
            item.trasactionStatus = payRecord.transaction_status;
            item.dateOfPurchase = payRecord.date_of_purchase;
            item.payementMethod = toSentenceCase(payRecord.payment_method_name);
            item.transactionId = payRecord.order_id;
            item.transactionRef = payRecord.reference_no;
            item.invoiceKey = payRecord.invoice_key;
          }
        });
      }

      if (permitPaymentRecords?.list?.length) {
        const permitPaymentRecordMap = new Map(
          permitPaymentRecords.list.map((record) => [record.payment_id, record])
        );

        data.forEach((item) => {
          const payRecord = permitPaymentRecordMap.get(item.permitPaymentId);
          if (payRecord) {
            item.invoiceKey = payRecord.invoice_key;
          }
        });
      }

      if (billDetails?.data?.length) {
        const billRecordMap = new Map(
          billDetails.data.map((record) => [record.permit_id, record])
        );

        data.forEach((item) => {
          item.isBillGenerated = billRecordMap.has(item.permitId);
        });
      }
    }

    const totalRecords = data[0]?.totalrecords || 0;
    data.forEach((item) => delete item.totalrecords);

    return {
      data,
      totalPages: Math.ceil(totalRecords / limit),
      totalCount: totalRecords,
    };
  } catch (error) {
    logger.error(`Error in getPermitList service: ${error?.message}`, {
      error,
    });
    throw error;
  }
};

const getPermitDetails = async (id, headers, isInternal) => {
  try {
    const [data] = await knex("license_permits as lp")
      .select(
        "lp.id as permitId",
        "lp.user_id as userId",
        "lp.county_id as countyId",
        "lp.permit_status as permitStatus",
        "lp.amount",
        "lp.payment_id as paymentId",
        "lp.valid_till as validTill",
        "lp.created_at as createdAt",
        "permit_master_data.category_id as categoryId",
        "permit_master_data.sub_category_id as subCategoryId",
        "category.name as category",
        "sub_category.name as subCategory",
        "lp.application_status as applicationStatus",
        "lp.location",
        "lp.reference_number as permitReferenceNumber",
        "lp.stream",
        "lp.description",
        "lp.email",
        "lp.phone_number as phoneNumber",
        "d.documents as uploadDocuments",
        "d.reupload_document_request as reuploadDocumentRequest",
        "d.additional_document_request as additionalDocumentRequest",
        "lp.application_id as applicationId",
        "lp.service_id as serviceId",
        "services.name as serviceName",
        "permit_master_data.permit_fee as permitFee",
        "lp.plot_number as plotNumber",
        "lp.cancellation_reason as cancellationReason",
        "lp.business_name as businessName",
        "lp.business_registration_no as businessRegNo",
        "lp.permit_payment_id as permitPaymentId",
        "lp.permit_payment_status as permitPaymentStatus",
        "lp.no_of_months as noOfMonths",
        "permit_master_data.amount_payment_type as duration",
        "lp.sub_county_id as subCountyId",
        "lp.ward_id as wardId",
        "lp.street as street",
        "lp.floor_number as floorNumber",
        "lp.stall_number as stallNumber",
        "lp.building_name as buildingName",
        "lp.po_box as poBox",
        "lp.postal_code as postalCode",
        "lp.period",
        "lp.license_data",
        "permit_master_data.is_partial_payment_allowed as partialPaymentAllowed",
        knex.raw('COALESCE(pricing_data.id, NULL) AS "pricingDataId"'),
        "lp.license_data as licenseData",
      )
      .leftJoin(
        "permit_master_data",
        "permit_master_data.id",
        "lp.permit_master_id"
      )
      .leftJoin("category", "category.id", "permit_master_data.category_id")
      .leftJoin(
        "sub_category",
        "sub_category.id",
        "permit_master_data.sub_category_id"
      )
      .leftJoin("services", "services.id", "lp.service_id")
      .leftJoin("documents as d", "d.permit_id", "lp.id")
      .leftJoin("pricing_data", function () {
        this.on(
          "pricing_data.permit_master_id",
          "=",
          "permit_master_data.id"
        ).andOn(knex.raw("services.name = ?", ["LAND_RENT_AND_RATES"]));
      })
      .where({ "lp.id": id });

    if (data) {
      if (data.paymentId && !isInternal) {
        const { balanceAmount, paymentList } = await updatePaymentData(
          data.paymentId,
          headers
        );

        data.applicationPaymentDetails = paymentList;
        data.balanceAmount = balanceAmount ? parseInt(balanceAmount) : 0;
      }

      if (data.permitPaymentId && !isInternal) {
        const permitPaymentDetails = await updatePaymentData(
          data.permitPaymentId,
          headers
        );
        data.permitPaymentDetails = permitPaymentDetails;
      }

      // fetch user detail
      if (data.userId) {
        const userInfo = await getUserInformation(data.userId, headers);
        if (userInfo) {
          data["userName"] = `${toSentenceCase(
            userInfo.data?.first_name
          )} ${toSentenceCase(userInfo.data?.last_name)}`;
        }
      }
      const subCounties = await getFromRedis(redisKeys.subCounties);
      const wards = await getFromRedis(redisKeys.wards);

      if (data.subCountyId && subCounties) {
        const subCounty = subCounties[data.subCountyId];
        data.subCounty = subCounty ? toSentenceCase(subCounty.name) : null;
      }
      if (data.wardId && wards) {
        const ward = wards[data.wardId];
        data.ward = ward ? toSentenceCase(ward.name) : null;
      }
    }

    return data;
  } catch (error) {
    logger.error(`Error in getPermitDetails service: ${error?.message}`, {
      error,
    });
    throw error;
  }
};

const fetchLicenseBillDetails = async (queryParams) => {
  const { whereCondition, whereInCondition, order, limit, page } = queryParams;

  const query = knex("license_bill_requests")
    .select("*")
    .modify((query) => {
      if (whereCondition) {
        query.where(whereCondition);
      }

      if (whereInCondition) {
        query.whereIn("permit_id", whereInCondition);
      }
    })
    .orderBy("created_at", order ?? "DESC");

  if (limit && page) {
    const offset = (page - 1) * limit;
    query.limit(limit).offset(offset);
  }

  const countQuery = knex("license_bill_requests")
    .modify((query) => {
      if (whereCondition) {
        query.where(whereCondition);
      }

      if (whereInCondition) {
        query.whereIn("permit_id", whereInCondition);
      }
    })
    .count({ total: "*" });

  const [data, countResult] = await Promise.all([query, countQuery]);

  const total = parseInt(countResult[0].total, 10);

  return { data, total };
};

const updatePermit = async (
  updateBody,
  condition,
  select = ["*"],
  transaction
) => {
  if (transaction) {
    return await transaction("license_permits")
      .update(updateBody)
      .where(condition)
      .returning(select);
  } else {
    return await knex("license_permits")
      .update(updateBody)
      .where(condition)
      .returning(select);
  }
};

const licenseDetailsService = async (body) => {
  let licenseDetails = await knex("license_permits as lp")
    .select(
      "lp.id",
      "lp.permit_status",
      knex.raw(
        "COALESCE(lp.application_id, msp.application_id) as application_id"
      ),
      knex.raw(
        "COALESCE(lp.application_status, msp.application_status) as application_status"
      ),
      knex.raw(
        "COALESCE(lp.uploaded_documents_id, msp.uploaded_documents_id) as uploaded_documents_id"
      ),
      knex.raw(
        "COALESCE(lp.reference_number, msp.reference_number) as reference_number"
      ),
      "lp.payment_status",
      "d.reupload_document_request",
      "d.additional_document_request",
      "lp.application_for_staff",
      "msp.permit_status as staff_permit_status"
    )
    .leftJoin("medical_staff_permits as msp", "msp.permit_id", "lp.id")
    .leftJoin(
      "documents as d",
      "d.id",
      knex.raw("COALESCE(lp.uploaded_documents_id, msp.uploaded_documents_id)")
    )
    .whereIn(
      knex.raw("COALESCE(lp.application_id, msp.application_id)"),
      body.applicationIds
    );

  const permitIds = uniq(
    map(licenseDetails, (detail) => detail.id).filter((id) => id !== null)
  );

  const { data } = await fetchLicenseBillDetails({
    whereInCondition: permitIds,
  });
  const billStatus = {};

  permitIds.forEach((permitId) => {
    const relatedBills = data.filter((bill) => bill.permit_id === permitId);
    const allBillsPaid = relatedBills.every(
      (bill) => bill.status === appConstants.PAYMENT_STATUS.PAID
    );
    billStatus[permitId] = allBillsPaid;
  });
  licenseDetails = licenseDetails.map((detail) => {
    return {
      ...detail,
      bill_status: billStatus[detail.id],
    };
  });

  return licenseDetails;
};

const payPermitFeeService = async (body, query, createdById, headers) => {
  const transaction = await promisify(knex.transaction.bind(knex));
  try {
    let permitDetails;
    permitDetails = await fetchPermitDetails({ id: body?.permitId });
    if (permitDetails && permitDetails.applicationForStaff) {
      const [staffPermitDetails] = await fetchMedicalStaffPermitRecords(
        {
          id: body?.staffPermitId,
        },
        ["*"],
        transaction
      );

      const renameKeys = {
        id: "permitId",
        createdAt: "permitCreatedAt",
        updatedAt: "permitUpdatedAt",
        permitStatus: "status",
        referenceNumber: "permitRefNo",
      };
      const permit = Object.fromEntries(
        Object.entries(permitDetails)
          .filter(([key, value]) => value !== null)
          .map(([key, value]) => {
            const renameKey = renameKeys[key] || key;
            return [renameKey, value];
          })
      );
      permitDetails = {
        ...permit,
        ...convertKeysToCamelCase(staffPermitDetails),
      };
    }
    if (!permitDetails) {
      throw errors.NOT_FOUND("Application does not exists.");
    }
    const [masterDetails] = await fetchMasterData({
      id: permitDetails.permitMasterId,
    });
    const [serviceDetails] = await fetchServices({
      id: permitDetails.serviceId,
    });

    if (
      !permitDetails?.permitStatus === appConstants.PERMIT_STATUS.ACTIVE &&
      !permitDetails.applicationStatus ===
        appConstants.APPLICATION_STATUS.APPROVED
    ) {
      throw errors.NOT_ALLOWED("Application is not approved yet.");
    }

    let paymentDetails;
    const payloadForPayment = {
      user_id: permitDetails.userId,
      entity_id: permitDetails.id,
      email: body.email,
      payment_type: appConstants.AUDIT_CONSTANTS.UNIVERSAL,
      created_by: createdById,
      county_id: permitDetails.countyId,
      amount: masterDetails.permit_fee.toString(),
      phone_number: body.phoneNumber,
      sub_service_type: serviceDetails?.name || "-",
      payment_id: permitDetails.permitPaymentId,
    };

    if (query?.payment_mode === appConstants.PAYMENT_MODES.MPESSA_EXPRESS) {
      paymentDetails = await getPaymentIntent(
        payloadForPayment,
        query,
        headers
      );
      if (
        !paymentDetails &&
        !paymentDetails.paymentIntent &&
        !paymentDetails?.paymentIntent?.id
      )
        throw errors.NOT_FOUND("Payment Failed.");

      await updateLicensePermitService(
        {
          permit_payment_status: appConstants.PAYMENT_STATUS.NOT_PAID,
        },
        {
          id: body?.permitId,
          permit_payment_id: paymentDetails?.paymentIntent?.id,
        },
        transaction
      );
      if (permitDetails?.applicationForStaff) {
        await updateStaffPermit(
          {
            permit_payment_status: appConstants.PAYMENT_STATUS.NOT_PAID,
          },
          {
            id: body?.staffPermitId,
            permit_payment_id: paymentDetails?.paymentIntent?.id,
          },
          ["id as staffPermitId", "permit_id as permitId"],
          transaction
        );
      }
    } else if (query?.payment_mode === appConstants.PAYMENT_MODES.KCB) {
      paymentDetails = await getPaymentIntent(
        payloadForPayment,
        query,
        headers
      );
    }
    await transaction.commit();
    return {
      paymentIntent: {
        id: paymentDetails?.paymentIntent.id,
        transactionRef: paymentDetails?.paymentIntent.transaction_ref,
        status: paymentDetails?.paymentIntent?.status,
        uniqueReferenceNo: paymentDetails?.paymentIntent?.unique_reference_no,
        enforcerPayment: paymentDetails?.paymentIntent.payment_by_enforcer,
        permitStatus: permitDetails.permitStatus,
        referenceNumber: permitDetails.referenceNumber,
        paymentStatus: permitDetails.paymentStatus,
        applicationStatus: permitDetails.applicationStatus,
        plotNumber: permitDetails.plotNumber,
        permitPaymentStatus: permitDetails.permitPaymentStatus,
      },
    };
  } catch (error) {
    logger.error("Error while paying the permit payment", error);
    throw error;
  }
};

const licenseStatusChangeUpdate = async () => {
  try {
    const permits = await knex("license_permits")
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
      await knex("license_permits")
        .update({ permit_status: appConstants.PERMIT_STATUS.EXPIRED })
        .whereIn("id", permitIdsToBeExpired);
    }
  } catch (error) {
    console.error("Error in licenseStatusChangeUpdate scheduler", error);
  }
};

const issuedPermitCountService = async (req, userIds) => {
  try {
    const { start_date, end_date } = req.query;

    const query = knex("license_permits")
      .select("services.name")
      .count("license_permits.id as count")
      .join("services", "license_permits.service_id", "services.id")
      .where("license_permits.permit_status", appConstants.PERMIT_STATUS.ACTIVE)
      .groupBy("license_permits.service_id", "services.name");

    if (start_date) {
      query.andWhere(
        knex.raw("DATE(license_permits.created_at)"),
        ">=",
        new Date(start_date)
      );
    }

    if (end_date) {
      query.andWhere(
        knex.raw("DATE(license_permits.created_at)"),
        "<=",
        new Date(end_date)
      );
    }

    if (userIds?.length) {
      query.andWhere(function () {
        this.whereIn("created_by", userIds);
      });
    }

    const permits = await query;
    return permits || [];
  } catch (error) {
    console.error("Database query failed issuedPermitCountService:", error);
    throw new Error("Failed to retrieve Ecess issuedPermitCountService");
  }
};

module.exports = {
  getPermitList,
  getPermitDetails,
  fetchLicenseBillDetails,
  updatePermit,
  licenseDetailsService,
  payPermitFeeService,
  licenseStatusChangeUpdate,
  issuedPermitCountService
};

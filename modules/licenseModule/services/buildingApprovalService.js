const promisify = require("../../../lib/async");
const appConstants = require("../../../constant/appConstants");
const { errorConstants } = require("../../../constant/errorConstants");
const {
  getUserInfo,
  getPaymentIntent,
  submitApplication,
  getUserInformation,
  getApplication,
  assignSubCountyToNewApplication,
  getLandRateInvoiceInfo
} = require("../../../lib/api");
const errors = require("../../../lib/errors");
const knex = require("../../../lib/knex");
const {
  findExistingCategory,
  findExistingSubCategory,
} = require("../../masterDataModule/dbServices/licenseAndPermitsDbServices");
const { fetchServices } = require("../../masterDataModule/services/service");
const {
  fetchLicenseApplicationStatus,
  fetchLicensePermitDetails,
  getExpiryDate,
  licensePermitService,
  updateLicensePermit,
} = require("../dbServices/permitDbService");
const logger = require("../../../lib/logger");
const {
  convertKeysToSnakeCase,
  toSentenceCase,
  convertKeysToCamelCase,
  convertAllKeysToCamelCase,
} = require("../../../lib/helper");
const {
  insertDocuments,
  updateDocuments,
} = require("../dbServices/documentDbService");
const { isEmpty, get } = require("lodash");
const { updatePaymentData } = require("../dbServices/paymentDbService");
const { getFromRedis } = require("../../../lib/redis");
const { redisKeys } = require("../../../constant/redisKeys");

const submitBuildingPermitApplicationService = async (req) => {
  const transaction = await promisify(knex.transaction.bind(knex));
  try {
    req.body = convertKeysToSnakeCase(req.body);

    const {
      service_id,
      county_id,
      land_details,
      personal_details,
      professional_details,
      documents,
      payment_phone_number,
      is_admin,
      draft_id,
      revision_id,
    } = req.body;

    let existingDraft;

    if (draft_id) {
      [existingDraft] = await transaction('license_permits')
        .select('id')
        .where({
          id: draft_id,
          user_id: req.user.id,
          application_status: appConstants.APPLICATION_STATUS.DRAFT,
        });

      if (!existingDraft) {
        throw errors.NOT_FOUND("Draft not found");
      }
    }

    let existingRevision;

    if (revision_id) {
      [existingRevision] = await transaction('license_permits')
        .select('id', 'application_id')
        .where({
          id: revision_id,
          user_id: req.user.id,
        });

      if (!existingRevision) {
        throw errors.NOT_FOUND("Returned application not found.");
      }
    }

    const { plotNo } = land_details;

    const [service] = await fetchServices({ id: service_id }, ["id", "name"]);
    let created_by_id = req.user?.id;

    if (!service) {
      throw errors.NOT_FOUND(errorConstants.SERVICE_NOT_FOUND);
    }

    const { category_id, sub_category_id, type, sub_county_id } = land_details;

    const [checkCategory] = await findExistingCategory({
      county_id,
      id: category_id,
    });

    if (!checkCategory)
      throw errors.NOT_FOUND(errorConstants.INCORRECT_CATEGORY);

    const [checkSubCategory] = await findExistingSubCategory({
      category_id,
      id: sub_category_id,
    });

    if (!checkSubCategory)
      throw errors.NOT_FOUND(errorConstants.INCORRECT_SUB_CATEGORY);

    const masterDataDetails = await fetchLicensePermitDetails({
      category_id,
      sub_category_id,
      service_id,
      is_active: true,
    });

    const { identification_number } = personal_details;
    let applicant_user_details;

    if (identification_number) {
      const { data } = await getUserInfo({
        document_number: identification_number,
      });

      if (isEmpty(data)) {
        throw errors.NOT_FOUND(
          `No user found with document number ${identification_number}.`
        );
      }

      if (type === appConstants.TYPE.SELF && data.id !== req.user.id) {
        throw errors.NOT_ALLOWED(
          `Document number ${identification_number} is linked to another user.`
        );
      }

      applicant_user_details = data;
    }

    let payload = {
      user_id: applicant_user_details?.id,
      permit_master_id: masterDataDetails?.id,
      county_id,
      service_id,
    };

    const submittedApplications = await fetchLicenseApplicationStatus(payload);

    const applicationsToCheck = (draft_id || revision_id)
      ? submittedApplications.filter((app) => app.id !== (draft_id || revision_id))
      : submittedApplications;

    if (
      applicationsToCheck.some(
        (app) =>
          app.permit_status === appConstants.PERMIT_STATUS.PENDING &&
          [
            appConstants.APPLICATION_STATUS.IN_PROCESS,
            appConstants.APPLICATION_STATUS.SUBMITTED,
          ].includes(app.application_status)
      )
    ) {
      throw errors.ALREADY_EXISTS(`A similar application already exists.`);
    }

    if (
      applicationsToCheck.some(
        (app) => app.permit_status === appConstants.PERMIT_STATUS.ACTIVE
      )
    ) {
      throw errors.INVALID_INPUT("An active permit already exists.");
    }

    let invoiceData;
    try {
      invoiceData = await getLandRateInvoiceInfo(
        {
          lr_number: plotNo,
          year: String(new Date().getFullYear()),
        },
        req.headers
      );
    } catch (error) {
      throw errors.NOT_FOUND("No invoice found for the specified land number and year");
    }

    if (invoiceData.status !== appConstants.PAYMENT_STATUS.PAID) {
      throw errors.CONFLICT("Land rate for this land number has not been paid");
    }

    const { uploaded_documents } = documents;
    delete documents.uploaded_documents;

    const docQuery = `INSERT INTO documents (documents, user_id) VALUES (?::jsonb, ?) RETURNING id`;
    const documentParams = [
      JSON.stringify(uploaded_documents),
      applicant_user_details?.id,
    ];

    const [uploadDocuments] = await insertDocuments(
      transaction,
      docQuery,
      documentParams
    );

    let subCounty = get(await getFromRedis(redisKeys.subCounties), sub_county_id, '');
    subCounty = toSentenceCase(get(subCounty, 'name', ''));

    const formatBuildingData = {
      landDetails: {
        ...convertAllKeysToCamelCase(land_details),
        category: checkCategory?.name,
        subCategory: checkSubCategory?.name,
        amount: masterDataDetails?.amount.ACTIVE,
        subCounty
      },
      personalDetails: convertAllKeysToCamelCase(personal_details),
      professionalDetails: convertAllKeysToCamelCase(professional_details),
      documentNumbers: convertAllKeysToCamelCase(documents),
    };

    const body = {
      permit_status: appConstants.PERMIT_STATUS.PENDING,
      created_by: created_by_id,
      permit_master_id: masterDataDetails?.id,
      uploaded_documents_id: uploadDocuments?.id,
      county_id,
      valid_till: getExpiryDate(
        masterDataDetails?.amountPaymentType || appConstants.DURATION.ANNUAL
      ),
      amount: masterDataDetails?.amount,
      user_id: applicant_user_details?.id,
      email: personal_details?.email,
      phone_number: personal_details?.phone_number,
      service_id,
      id_number: identification_number,
      application_owner: personal_details?.application_owner,
      stream: personal_details?.occupation,
      sub_county_id,
      license_data: {
        ...formatBuildingData,
      },
    };

    let insertPermit;

    if (draft_id && existingDraft) {
      const [updatedDraft] = await transaction('license_permits')
        .where({ id: draft_id, user_id: req.user.id })
        .update({
          ...body,
          updated_at: knex.fn.now(),
        })
        .returning('id');

      insertPermit = updatedDraft?.id;
    } else if (revision_id && existingRevision) {
      const [updatedRevision] = await transaction('license_permits')
        .where({ id: revision_id, user_id: req.user.id })
        .update({
          ...body,
          application_status: appConstants.APPLICATION_STATUS.SUBMITTED,
          updated_at: knex.fn.now(),
        })
        .returning('id');

      insertPermit = updatedRevision?.id;
    } else {
      [insertPermit] = await licensePermitService(body, transaction);
    }

    let paymentDetails;

    if (masterDataDetails?.applicationFee && !revision_id) {
      paymentDetails = await getPaymentIntent(
        {
          user_id: applicant_user_details?.id,
          entity_id: insertPermit,
          email: personal_details?.email,
          payment_type: appConstants.AUDIT_CONSTANTS.UNIVERSAL,
          created_by: created_by_id,
          county_id,
          amount: body.amount.toString(),
          phone_number: payment_phone_number,
          sub_service_type: service.name,
        },
        req.query,
        req.headers
      );

      if (
        !paymentDetails &&
        !paymentDetails.paymentIntent &&
        !paymentDetails?.paymentIntent?.id
      )
        throw errors.NOT_FOUND("Payment Failed.");
    }

    const applicationBody = {
      user_id: body.user_id,
      county_id: body.county_id,
      documents: uploaded_documents,
      type: service.name,
      application: JSON.stringify({
        paymentPhoneNumber: body?.paymentPhoneNumber,
        ...formatBuildingData,
      }),
      is_admin,
    };

    let application;

    if (!(revision_id && existingRevision)) {
      application = await submitApplication(applicationBody, req.headers);
    }

    await updateLicensePermit(
      {
        payment_id: paymentDetails?.paymentIntent?.id,
        application_status: appConstants.APPLICATION_STATUS.SUBMITTED,
        application_id: revision_id
          ? existingRevision.application_id
          : application?.data?.applicationId,
        payment_status: masterDataDetails?.applicationFee
          ? appConstants.PAYMENT_STATUS.NOT_PAID
          : appConstants.PAYMENT_STATUS.PAID,
      },
      insertPermit,
      transaction
    );

    await updateDocuments(
      { permit_id: insertPermit },
      { id: uploadDocuments.id },
      transaction,
      ["id"]
    );

    const [updatedPermit] = await transaction('license_permits')
      .select('application_id', 'payment_status', 'sub_county_id')
      .where({ id: insertPermit });

    await transaction.commit();

    if (!revision_id) {
      await assignSubCountyToNewApplication(
        {
          application_id: updatedPermit.application_id,
          sub_county_id: updatedPermit.sub_county_id,
          payment_status: updatedPermit.payment_status,
        },
        req.headers
      );
    }

    return {
      paymentIntent: convertKeysToCamelCase(paymentDetails?.paymentIntent),
      permitId: insertPermit,
      applicationStatus: appConstants.APPLICATION_STATUS.SUBMITTED,
      applicationId: revision_id
        ? existingRevision.application_id
        : application?.data?.applicationId,
      serviceId: service_id,
    };
  } catch (error) {
    logger.error(
      `Error in submitBuildingPermitApplicationService: ${error?.message}`,
      { error }
    );
    throw error;
  }
};

const buildingApprovalPermitDetails = async (id, headers, isInternal) => {
  try {

    let [data] = await knex("license_permits as lp")
      .select(
        "lp.id as permitId",
        "lp.permit_status",
        "lp.amount",
        "lp.payment_id as paymentId",
        "lp.valid_till",
        knex.raw("extract(epoch from lp.valid_till) as valid_till"),
        knex.raw("extract(epoch from lp.created_at) as created_at"),
        "lp.application_status",
        "lp.reference_number as permitReferenceNumber",
        "lp.stream as occupation",
        "lp.email",
        "lp.phone_number",
        "lp.application_id",
        "lp.service_id",
        "lp.permit_payment_id as permitPaymentId",
        "lp.permit_payment_status",
        "lp.id_number as identification_number",
        "lp.application_owner",
        "lp.license_data",
        "permit_master_data.amount_payment_type as duration",
        "permit_master_data.permit_fee",
        "services.name as serviceName",
        "d.documents as uploadDocuments",
        "lp.user_id as userId"
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
      .where({ "lp.id": id });

    if (!data) {
      [data] = await knex("license_permits as lp")
        .select(
          "lp.id as permitId",
          "lp.permit_status",
          "lp.amount",
          "lp.payment_id as paymentId",
          "lp.valid_till",
          knex.raw("extract(epoch from lp.valid_till) as valid_till"),
          knex.raw("extract(epoch from lp.created_at) as created_at"),
          "lp.application_status",
          "lp.reference_number as permitReferenceNumber",
          "lp.stream as occupation",
          "lp.email",
          "lp.phone_number",
          "lp.application_id",
          "lp.service_id",
          "lp.permit_payment_id as permitPaymentId",
          "lp.permit_payment_status",
          "lp.id_number as identification_number",
          "lp.application_owner",
          "lp.license_data",
          "permit_master_data.amount_payment_type as duration",
          "permit_master_data.permit_fee",
          "services.name as serviceName",
          "d.documents as uploadDocuments",
          "lp.user_id as userId"
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
        .where({ "lp.application_id": id });
    }

    if (data) {
      if (data.application_id) {
        const getApplicationRejectionReason = await getApplication(data.application_id, headers);
        if (getApplicationRejectionReason && getApplicationRejectionReason.data &&
          getApplicationRejectionReason.data.application &&
          getApplicationRejectionReason.data.application.approvals
        ) {
          data.approvals = getApplicationRejectionReason.data.application.approvals.
            map(({ role, status, assigned_id, assigned_to, reason = null }) => ({
              role,
              status,
              assignedId: assigned_id,
              assignedTo: assigned_to,
              reason
            }));
        }
      }

      if (data?.license_data?.documents) {
        data.license_data.documents["uploadDocuments"] = data.uploadDocuments;
        delete data.uploadDocuments;
      }
      return getPaymentDetails(data, isInternal, headers);
    }

    data = convertAllKeysToCamelCase(data);
    return data;
  } catch (error) {
    logger.error(
      `Error in buildingApprovalPermitDetails service: ${error?.message}`,
      {
        error,
      }
    );
    throw error;
  }
};

const getPaymentDetails = async (data, isInternal, headers) => {
  if (data.paymentId && !isInternal) {
    const { paymentList } = await updatePaymentData(data.paymentId, headers);

    data.applicationPaymentDetails = paymentList;
  }

  if (data.permitPaymentId && !isInternal) {
    const permitPaymentDetails = await updatePaymentData(
      data.permitPaymentId,
      headers
    );
    data.permitPaymentDetails = permitPaymentDetails;
  }

  if (data.userId) {
    const userInfo = await getUserInformation(data.userId, headers);
    if (userInfo) {
      data["userName"] = `${toSentenceCase(
        userInfo.data?.first_name
      )} ${toSentenceCase(userInfo.data?.last_name)}`;
    }
  }

  data = convertAllKeysToCamelCase(data);

  return data;
};

const buildingApprovalDuplicateCheckService = async (req) => {
  try {
    req.body = convertKeysToSnakeCase(req.body);
    const {
      service_id,
      category_id,
      sub_category_id,
    } = req.body;

    const user_id = req.user.id;
    const county_id = req.user.county_id;

    const masterDataDetails = await fetchLicensePermitDetails({
      category_id,
      sub_category_id,
      service_id,
      is_active: true,
    });

    const payload = {
      user_id,
      permit_master_id: masterDataDetails?.id,
      county_id,
      service_id,
    };

    const submittedApplications = await fetchLicenseApplicationStatus(payload);

    const duplicateInProgress = submittedApplications.some(
      (app) =>
        app.permit_status === appConstants.PERMIT_STATUS.PENDING &&
        [
          appConstants.APPLICATION_STATUS.SUBMITTED,
        ].includes(app.application_status) &&
        app.permit_payment_status !==
          appConstants.PAYMENT_STATUS.CANCELLED
    );

    if (duplicateInProgress) return true;

    const hasActivePermit = submittedApplications.some(
      (app) =>
        app.permit_status === appConstants.PERMIT_STATUS.ACTIVE &&
        app.permit_payment_status !==
          appConstants.PAYMENT_STATUS.CANCELLED
    );

    if (hasActivePermit) return true;

    return false;

  } catch (error) {
    logger.error(
      `Error in buildingApprovalDuplicateCheckService: ${error?.message}`,
      { error }
    );
    throw error;
  }
};

const saveDraftBuildingApplicationService = async (req) => {
  const transaction = await promisify(knex.transaction.bind(knex));
  try {
    req.body = convertKeysToSnakeCase(req.body);

    const userId = req.user.id;
    const {
      draft_id,
      service_id,
      county_id,
      personal_details,
      land_details,
      professional_details,
      documents,
      declarations,
    } = req.body;

    const { category_id, sub_category_id, type, sub_county_id } = land_details || {};

    let checkCategory, checkSubCategory, masterDataDetails;

    if (category_id) {
      [checkCategory] = await findExistingCategory({ county_id, id: category_id });
      if (!checkCategory) throw errors.NOT_FOUND(errorConstants.INCORRECT_CATEGORY);
    }

    if (category_id && sub_category_id) {
      [checkSubCategory] = await findExistingSubCategory({ category_id, id: sub_category_id });
      if (!checkSubCategory) throw errors.NOT_FOUND(errorConstants.INCORRECT_SUB_CATEGORY);
    }

    if (category_id && sub_category_id) {
      masterDataDetails = await fetchLicensePermitDetails({
        category_id,
        sub_category_id,
        service_id,
        is_active: true,
      });
    }

    const { identification_number } = personal_details || {};
    let applicant_user_details;

    if (identification_number) {
      const { data } = await getUserInfo({
        document_number: identification_number,
      });

      if (isEmpty(data)) {
        throw errors.NOT_FOUND(
          `No user found with document number ${identification_number}.`
        );
      }

      if (type === appConstants.TYPE.SELF && data.id !== req.user.id) {
        throw errors.NOT_ALLOWED(
          `Document number ${identification_number} is linked to another user.`
        );
      }

      applicant_user_details = data;
    }

    let subCounty = '';
    if (sub_county_id) {
      subCounty = get(await getFromRedis(redisKeys.subCounties), sub_county_id, '');
      subCounty = toSentenceCase(get(subCounty, 'name', ''));
    }

    const license_data = {
      landDetails: {
        ...convertAllKeysToCamelCase(land_details),
        category: checkCategory?.name,
        subCategory: checkSubCategory?.name,
        amount: masterDataDetails?.amount.ACTIVE,
        subCounty
      },
      personalDetails: convertAllKeysToCamelCase(personal_details),
      professionalDetails: convertAllKeysToCamelCase(professional_details),
      documentNumbers: convertAllKeysToCamelCase(documents),
      declarations: convertAllKeysToCamelCase(declarations),
    };

    let application;

    if (draft_id) {
      const [existingDraft] = await transaction('license_permits')
        .select('id')
        .where({
          id: draft_id,
          user_id: userId,
          application_status: appConstants.APPLICATION_STATUS.DRAFT,
        });

      if (!existingDraft) {
        throw errors.NOT_FOUND("Draft not found or does not belong to this user.");
      }

      const [updated] = await transaction('license_permits')
        .where({ id: draft_id, user_id: userId })
        .update({
          license_data,
          county_id,
          updated_at: knex.fn.now(),
        })
        .returning('*');

      application = updated;
    } else {
      const [insertDraft] = await transaction('license_permits')
        .insert({
          user_id: userId,
          service_id,
          county_id,
          application_status: appConstants.APPLICATION_STATUS.DRAFT,
          permit_status: appConstants.PERMIT_STATUS.PENDING,
          license_data,
        })
        .returning('*');

      application = insertDraft;
    }

    await transaction.commit();

    return {
      draftId: application.id,
      licenseData: application.license_data,
      status: application.application_status,
    };
  } catch (error) {
    await transaction.rollback();
    logger.error(
      `Error in saveDraftBuildingApplicationService: ${error?.message}`,
      { error }
    );
    throw error;
  }
};

module.exports = {
  submitBuildingPermitApplicationService,
  buildingApprovalPermitDetails,
  buildingApprovalDuplicateCheckService,
  saveDraftBuildingApplicationService
};

const { errorConstants } = require("../../../constant/errorConstants");
const errors = require("../../../lib/errors");
const {
  findExistingCategory,
  findExistingSubCategory,
} = require("../../masterDataModule/dbServices/licenseAndPermitsDbServices");
const promisify = require("../../../lib/async");
const knex = require("../../../lib/knex");
const appConstants = require("../../../constant/appConstants");
const { getPaymentIntent, submitApplication, assignSubCountyToNewApplication } = require("../../../lib/api");
const {
  toSentenceCase,
  convertKeysToCamelCase,
} = require("../../../lib/helper");

const {
  fetchLicensePermitDetails,
  fetchLicenseApplicationStatus,
  licensePermitService,
  getExpiryDate,
  updateLicensePermit,
} = require("../dbServices/permitDbService");
const {
  updateDocuments,
  insertDocuments,
} = require("../dbServices/documentDbService");
const { enums } = require("../../../constant/enumConstants");
const { getFromRedis } = require("../../../lib/redis");
const { redisKeys } = require("../../../constant/redisKeys");
const { get } = require("lodash");

const publicHealthApplicationService = async (
  body,
  headers,
  countyId,
  createdById,
  query,
  isEnforcerCall = false,
  serviceData
) => {
  const transaction = await promisify(knex.transaction.bind(knex));
  try {
    let paymentDetails;
    const {
      category_id,
      sub_category_id,
      uploaded_documents,
      payment_phone_number,
      is_admin = false,
      service_id,
      sub_county_id,
      ward_id,
      plot_number,
      street,
      floor_number,
      stall_number,
      po_box,
      postal_code,
      building_name,
    } = body;
    delete body.payment_phone_number;
    delete body.is_admin;

    const [checkCategory] = await findExistingCategory({
      county_id: countyId,
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

    const publicHealthMasterDataDetails = await fetchLicensePermitDetails({
      category_id,
      sub_category_id,
      service_id,
      is_active: true,
    });

    let payload = {
      user_id: body.user_id,
      permit_master_id: publicHealthMasterDataDetails?.id,
      county_id: countyId,
      service_id: body.service_id,
    };

    const submittedApplications = await fetchLicenseApplicationStatus(payload);

    const activePermit = submittedApplications.find((application) => {
      return application?.permit_status === appConstants.PERMIT_STATUS.ACTIVE;
    });

    if (activePermit) {
      throw errors.INVALID_INPUT(
        "An active permit already exists for this category and subcategory."
      );
    }

    if (publicHealthMasterDataDetails?.amount !== body.amount) {
      throw errors.INVALID_INPUT("Amount is not correct.");
    }
    if (!publicHealthMasterDataDetails?.applicationFee) body.amount = 0;

    const docQuery = `INSERT INTO documents (documents, user_id) VALUES (?::jsonb, ?) RETURNING id`;
    const documentParams = [
      JSON.stringify(body.uploaded_documents),
      body.user_id,
    ];

    const [uploadDocuments] = await insertDocuments(
      transaction,
      docQuery,
      documentParams
    );

    body.permit_status = appConstants.PERMIT_STATUS.PENDING;
    body.created_by = createdById;
    body.permit_master_id = publicHealthMasterDataDetails?.id;
    body.uploaded_documents_id = uploadDocuments.id;
    body.county_id = countyId;
    body.valid_till = getExpiryDate(publicHealthMasterDataDetails?.amountPaymentType || enums.PAYMENT_TYPES[3]);
    delete body.category_id;
    delete body.sub_category_id;
    delete body.uploaded_documents;

    const [insertPermit] = await licensePermitService(body, transaction);

    if (publicHealthMasterDataDetails?.applicationFee) {
      paymentDetails = await getPaymentIntent(
        {
          user_id: body.user_id,
          entity_id: insertPermit,
          email: body.email,
          payment_type: appConstants.AUDIT_CONSTANTS.UNIVERSAL,
          created_by: createdById,
          county_id: countyId,
          payment_by_enforcer: isEnforcerCall,
          amount: body.amount.toString(),
          phone_number: payment_phone_number,
          sub_service_type: serviceData.name,
        },
        query,
        headers
      );

      if (
        !paymentDetails &&
        !paymentDetails.paymentIntent &&
        !paymentDetails?.paymentIntent?.id
      )
        throw errors.NOT_FOUND("Payment Failed.");
    }

    let subCounty = get(await getFromRedis(redisKeys.subCounties), body.sub_county_id, '');
    subCounty = toSentenceCase(get(subCounty, 'name', ''));

    const applicationBody = {
      user_id: body.user_id,
      county_id: countyId,
      documents: uploaded_documents,
      type: serviceData.name,
      application: JSON.stringify({
        category: checkCategory?.name,
        sub_category: checkSubCategory?.name,
        board_approval: publicHealthMasterDataDetails?.boardApproval,
        public_participation:
          publicHealthMasterDataDetails?.publicParticipation,
        application_fee: publicHealthMasterDataDetails?.applicationFee,
        application_amount: publicHealthMasterDataDetails?.amount,
        description: body.description,
        email: body.email,
        phone_number: body.phone_number,
        location: body.location,
        payment_phone_number,
        service_id: serviceData.id,
        service_name: serviceData.name,
        sub_county_id: body.sub_county_id,
        sub_county: subCounty,
        businessInfo: {
          business_detail: {
            sub_county_id: sub_county_id,
            ward_id: ward_id,
          },
        },
        plot_number: plot_number,
        street: street,
        floor_number: floor_number,
        stall_number: stall_number,
        po_box: po_box,
        postal_code: postal_code,
        building_name: building_name,
      }),
      is_admin,
    };
    // submit application for approval
    const application = await submitApplication(applicationBody, headers);

    await updateLicensePermit(
      {
        payment_id: paymentDetails?.paymentIntent?.id,
        application_status: appConstants.APPLICATION_STATUS.SUBMITTED,
        application_id: application?.data?.applicationId,
        payment_status: publicHealthMasterDataDetails?.applicationFee
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

    await assignSubCountyToNewApplication(
      {
        application_id: updatedPermit.application_id,
        sub_county_id: updatedPermit.sub_county_id,
        payment_status: updatedPermit.payment_status,
      },
      headers
    );

    publicHealthMasterDataDetails.subCategoryName =
      checkSubCategory?.name || "";
    publicHealthMasterDataDetails.categoryName = checkCategory?.name || "";
    publicHealthMasterDataDetails.serviceName =
      toSentenceCase(serviceData?.name) || "";

    return {
      paymentIntent: convertKeysToCamelCase(paymentDetails?.paymentIntent),
      publicHealthMasterDataDetails,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const checkDuplicateLicensePermitService = async (body, countyId, userId) => {
  const masterData = await fetchLicensePermitDetails({
    category_id: body.category_id,
    sub_category_id: body.sub_category_id,
    service_id: body.service_id,
    is_active: true,
  });

  if (!masterData) return false;

  const payload = {
    user_id: userId,
    permit_master_id: masterData.id,
    county_id: countyId,
    service_id: body.service_id,
  };

  const submittedApplications = await fetchLicenseApplicationStatus(payload);
  if (!Array.isArray(submittedApplications)) return false;

  const validStatuses = [
    appConstants.PERMIT_STATUS.PENDING,
    appConstants.PERMIT_STATUS.ACTIVE,
    appConstants.PERMIT_STATUS.IN_ACTIVE,
  ];

  const hasPermit = submittedApplications.some((application) => {
    const statusValid = validStatuses.includes(application?.permit_status);
    const paymentValid =
      application?.permit_payment_status !==
      appConstants.PAYMENT_STATUS.CANCELLED;

    return statusValid && paymentValid;
  });

  return hasPermit;
};

module.exports = {
  publicHealthApplicationService,
  checkDuplicateLicensePermitService,
};

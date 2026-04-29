const promisify = require("../../../lib/async");
const knex = require("../../../lib/knex");
const {
  findExistingCategory,
  findExistingSubCategory,
} = require("../../masterDataModule/dbServices/licenseAndPermitsDbServices");
const {
  insertDocuments,
  updateDocuments,
  updateDocumentsForStaff,
} = require("../dbServices/documentDbService");
const errors = require("../../../lib/errors");
const { errorConstants } = require("../../../constant/errorConstants");
const appConstants = require("../../../constant/appConstants");
const {
  fetchLicensePermitDetails,
  getExpiryDate,
  licensePermitService,
  fetchLicenseApplicationStatus,
} = require("../dbServices/permitDbService");
const {
  convertKeysToSnakeCase,
  convertKeysToCamelCase,
  toSentenceCase,
} = require("../../../lib/helper");
const {
  getUserInfo,
  getPaymentIntent,
  submitMedicalApplication,
  assignSubCountyToNewApplication,
} = require("../../../lib/api");
const { updateLicensePermitService } = require("./licenseApplicationService");
const {
  fetchMedicalStaffDetails,
  insertStaffMembersDetails,
  updateStaffPermitDetails,
} = require("../dbServices/medicalStaffDbService");
const { getFromRedis } = require("../../../lib/redis");
const { redisKeys } = require("../../../constant/redisKeys");
const { get } = require("lodash");
const logger = require("../../../lib/logger");

const addMedicalCertificateService = async (
  req,
  applicationForStaff,
  service
) => {
  const transaction = await promisify(knex.transaction.bind(knex));
  try {
    const selectFields = [
      "id",
      "permit_status as permitStatus",
      "reference_number as referenceNo",
      "amount",
      "application_id as applicationId",
      "application_status as applicationStatus",
      "uploaded_documents_id as documentId",
    ];
    const countyId = req.user.county_id;
    const userId = req.user.id;

    let applications = [];
    let finalAmount = 0;
    let permitRecord;
    let applicationPayload;
    let masterData = [];
    let response = [];
    let documentIds = [];

    const {
      data: [userRecords],
    } = await getUserInfo({ ids: [userId], isInternalCall: true }, req.headers);
    if (!applicationForStaff) {
      if (!userRecords) {
        throw errors.NOT_FOUND(errorConstants.USER_NOT_FOUND);
      }

      if (
        userRecords.document_number !==
        req?.body?.medicalApplication[0].documentNumber
      )
        throw errors.NOT_ALLOWED(errorConstants.INVALID_DOCUMENT_NUMBER);
    } else {
      [permitRecord] = await licensePermitService(
        {
          user_id: userId,
          service_id: req?.body?.serviceId,
          county_id: countyId,
          created_by: userId,
          application_for_staff: req?.body?.applicationForStaff,
          sub_county_id: req?.body?.subCountyId,
          ward_id: req?.body?.wardId,
          business_name: req?.body?.businessName,
          business_registration_no: req?.body?.businessRegistrationNo,
          plot_number: req?.body?.plotNumber,
          street: req?.body?.street,
          floor_number: req?.body?.floorNumber,
          stall_number: req?.body?.stallNumber,
          po_box: req?.body?.poBox,
          postal_code: req?.body?.postalCode,
          building_name:req?.body?.buildingName,
        },
        transaction
      );
    }

    for (let application of req.body?.medicalApplication) {
      application = {
        ...application,
        serviceId: req.body?.serviceId,
        userId: userId,
        countyId: countyId,
      };

      const [categoryDetails] = await findExistingCategory({
        id: application?.categoryId,
      });
      const [subCategoryDetails] = await findExistingSubCategory({
        id: application?.subCategoryId,
      });

      if (!categoryDetails || !subCategoryDetails) {
        throw errors.NOT_FOUND(`Category or Subcategory data not found.`);
      }

      const licenseMasterDataDetails = await fetchLicensePermitDetails({
        category_id: categoryDetails?.id,
        sub_category_id: subCategoryDetails?.id,
        service_id: req.body?.serviceId,
        is_active: true,
      });
      masterData.push(licenseMasterDataDetails);

      if (!licenseMasterDataDetails)
        throw errors.NOT_FOUND(
          "Master configuration does not exists for this category and sub category."
        );

      let submittedApplications;
      if (!applicationForStaff) {
        submittedApplications = await fetchLicenseApplicationStatus({
          user_id: userId,
          county_id: countyId,
          service_id: req?.body?.serviceId,
          permit_master_id: licenseMasterDataDetails.id,
        });
      } else {
        submittedApplications = await fetchMedicalStaffDetails({
          "license_permits.user_id": userId,
          "license_permits.county_id": countyId,
          "license_permits.service_id": req?.body?.serviceId,
          "medical_staff_permits.permit_master_id":
            licenseMasterDataDetails?.id,
          "medical_staff_permits.document_number": application?.documentNumber,
        });
      }
      const existingApplication = submittedApplications.find((application) => {
        return (
          application?.permit_status === appConstants.PERMIT_STATUS.PENDING &&
          (application?.application_status ===
            appConstants.APPLICATION_STATUS.IN_PROCESS ||
            application?.application_status ===
              appConstants.APPLICATION_STATUS.SUBMITTED)
        );
      });
      if (existingApplication)
        throw errors.ALREADY_EXISTS(
          `Application already exists and is in ${toSentenceCase(
            existingApplication.application_status
          )} state.`
        );

      application.uploadedDocuments.forEach(
        (element) =>
          (element.files = element.files.map((file) =>
            convertKeysToSnakeCase(file)
          ))
      );
      const docQuery = `INSERT INTO documents (documents, user_id) VALUES (?::jsonb, ?) RETURNING id`;
      const documentParams = [
        JSON.stringify(application.uploadedDocuments),
        application.userId,
      ];

      const [uploadDocuments] = await insertDocuments(
        transaction,
        docQuery,
        documentParams
      );

      let payload;
      if (!applicationForStaff) {
        payload = {
          user_id: application.userId,
          county_id: application.countyId,
          service_id: application.serviceId,
          valid_till: getExpiryDate(licenseMasterDataDetails.amountPaymentType),
          permit_master_id: licenseMasterDataDetails.id,
          uploaded_documents_id: uploadDocuments.id,
          created_by: userId,
          payment_status: appConstants.PAYMENT_STATUS.NOT_PAID,
          email: application.email,
          phone_number: application.phoneNumber,
          location: application.location,
          description: application.description,
          amount: licenseMasterDataDetails?.amount
            ? licenseMasterDataDetails?.amount
            : 0,
          application_for_staff: req?.body?.applicationForStaff,
          sub_county_id: req?.body?.subCountyId,
          ward_id: req?.body?.wardId,
          business_name: req?.body?.businessName,
          business_registration_no: req?.body?.businessRegistrationNo,
          plot_number: req?.body?.plotNumber,
          street: req?.body?.street,
          floor_number: req?.body?.floorNumber,
          stall_number: req?.body?.stallNumber,
          po_box: req?.body?.poBox,
          postal_code: req?.body?.postalCode,
          building_name:req?.body?.buildingName,
        };
        [permitRecord] = await licensePermitService(payload, transaction);
        finalAmount += payload.amount;
      }
      
      let subCounty = get(await getFromRedis(redisKeys.subCounties), req?.body?.subCountyId, '');
      subCounty = toSentenceCase(get(subCounty, 'name', ''));

      applicationPayload = {
        user_id: application.userId,
        county_id: application.countyId,
        documents: application.uploadedDocuments,
        type: service?.name,
        application: {
          category_id: categoryDetails.id,
          category: categoryDetails.name,
          sub_category_id: subCategoryDetails.id,
          sub_category: subCategoryDetails.name,
          application_amount: application.amount,
          description: application.description,
          email: application.email,
          phone_number: application.phoneNumber,
          location: application.location,
          service_id: application.service_id,
          application_for_staff: applicationForStaff,
          permit_id: permitRecord,
          application_fee: licenseMasterDataDetails?.amount
            ? licenseMasterDataDetails?.amount
            : 0,
          permit_fee: licenseMasterDataDetails?.permit_fee
            ? licenseMasterDataDetails?.permit_fee
            : 0,
          sub_county_id: req?.body?.subCountyId,
          ward_id: req?.body?.wardId,
          business_name: req?.body?.businessName,
          business_registration_no: req?.body?.businessRegistrationNo,
          sub_county: subCounty,
          plot_number: req?.body?.plotNumber,
          street: req?.body?.street,
          floor_number: req?.body?.floorNumber,
          stall_number: req?.body?.stallNumber,
          po_box: req?.body?.poBox,
          postal_code: req?.body?.postalCode,
          building_name:req?.body?.buildingName,
        },
      };

      let staffPermit;
      if (applicationForStaff) {
        payload = {
          created_by: userId,
          permit_master_id: licenseMasterDataDetails.id,
          amount: licenseMasterDataDetails?.amount,
          document_number: application.documentNumber,
          staff_name: application.staffName,
          email: application.email,
          phone_number: application.phoneNumber,
          location: application.location,
          description: application.description,
          uploaded_documents_id: uploadDocuments.id,
          permit_id: permitRecord,
          valid_till: getExpiryDate(licenseMasterDataDetails.amountPaymentType),
          reference_number: Math.floor(Math.random() * 1e14)
            .toString()
            .padStart(14, "0"),
        };
        finalAmount += payload.amount;
        [staffPermit] = await insertStaffMembersDetails(
          payload,
          ["id"],
          transaction
        );
        applicationPayload.application.staff_permit_id = staffPermit?.id;
        applicationPayload.application.staff_name = payload.staff_name;
        applicationPayload.application.document_number =
          application.documentNumber;
        applicationPayload.application = JSON.stringify(
          applicationPayload.application
        );
        applications.push(applicationPayload);
      } else {
        applicationPayload.application.document_number =
          userRecords.document_number;
        applicationPayload.application = JSON.stringify(
          applicationPayload.application
        );
        applications.push(applicationPayload);
      }
    }
    const applicationFeePayment = masterData.some(
      (obj) => obj.applicationFee == true
    );

    if (applicationFeePayment) {
      let { paymentIntent } = await getPaymentIntent(
        {
          user_id: userId,
          entity_id: permitRecord,
          email: userRecords?.email,
          payment_type: appConstants.AUDIT_CONSTANTS.UNIVERSAL,
          created_by: userId,
          county_id: countyId,
          payment_by_enforcer: req?.body?.isEnforcerCall,
          amount: finalAmount.toString() || 0,
          phone_number: req?.body?.paymentPhoneNumber,
          sub_service_type: service.name,
        },
        req.query,
        req.headers
      );

      if (!paymentIntent && !paymentIntent?.id)
        throw errors.INTERNAL("Payment Failed.");
      paymentIntent = convertKeysToCamelCase(paymentIntent);
      response = {
        paymentIntent,
      };
    }

    const { data } = await submitMedicalApplication(applications, req.headers);

    if (!applicationForStaff) {
      const updatedLicenseData = await updateLicensePermitService(
        {
          application_id: data[0]?.applicationId,
          application_status: data[0]?.applicationStatus,
          payment_id: response?.paymentIntent?.id,
          payment_status: applicationFeePayment
            ? appConstants.PAYMENT_STATUS.NOT_PAID
            : appConstants.PAYMENT_STATUS.PAID,
        },
        { id: permitRecord },
        transaction,
        selectFields
      );
      await updateDocuments(
        { permit_id: permitRecord },
        { id: updatedLicenseData[0].documentId },
        transaction,
        ["*"]
      );
      response = {
        ...response,
        permitData: updatedLicenseData,
      };
    } else {
      const staffPermitIds = data.map((staff) => staff?.staffPermitId);

      await updateLicensePermitService(
        {
          payment_id: response?.paymentIntent?.id,
          payment_status: applicationFeePayment
            ? appConstants.PAYMENT_STATUS.NOT_PAID
            : appConstants.PAYMENT_STATUS.PAID,
          amount: response?.paymentIntent?.amount
            ? response?.paymentIntent?.amount
            : 0,
          application_id: data[0]?.applicationId,
        },
        { id: permitRecord },
        transaction,
        selectFields
      );

      const updateData = await updateStaffPermitDetails(
        data,
        staffPermitIds,
        selectFields,
        transaction
      );
      documentIds = updateData.map((doc) => doc.documentId);
      await updateDocumentsForStaff(
        updateData,
        documentIds,
        ["id as documentId", "permit_id as permitId"],
        transaction
      );
      response = {
        ...response,
        permitData: updateData,
      };
    }

    let updatedPermits;

    if (!applicationForStaff) {
      updatedPermits = await transaction('license_permits')
        .select('application_id', 'payment_status', 'sub_county_id')
        .where({ id: permitRecord });

    } else {
      updatedPermits = await transaction('medical_staff_permits as msp')
        .select('msp.application_id', 'lp.payment_status', 'lp.sub_county_id')
        .join('license_permits as lp', 'msp.permit_id', 'lp.id')
        .where('msp.permit_id', permitRecord);
    }

    await transaction.commit();

    for (const updatedPermit of updatedPermits) {
      await assignSubCountyToNewApplication(
        {
          application_id: updatedPermit.application_id,
          sub_county_id: updatedPermit.sub_county_id,
          payment_status: updatedPermit.payment_status,
        },
        req.headers
      );
    }

    return response;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const medicalPermitDuplicateCheckService = async (req) => {
  try {
    req.body = convertKeysToSnakeCase(req.body);

    const {
      service_id,
      category_id,
      sub_category_id,
      application_for_staff,
      document_number,
    } = req.body;

    const user_id = req.user.id;
    const county_id = req.user.county_id;

    const masterDataDetails = await fetchLicensePermitDetails({
      category_id,
      sub_category_id,
      service_id,
      is_active: true,
    });

    let submittedApplications;

    if (application_for_staff) {
      submittedApplications = await fetchMedicalStaffDetails({
        "license_permits.user_id": user_id,
        "license_permits.county_id": county_id,
        "license_permits.service_id": service_id,
        "medical_staff_permits.permit_master_id": masterDataDetails.id,
        "medical_staff_permits.document_number": document_number,
      });
    } else {
      submittedApplications = await fetchLicenseApplicationStatus({
        user_id,
        county_id,
        service_id,
        permit_master_id: masterDataDetails.id,
      });
    }

    const duplicateInProgress = submittedApplications.some(
      (app) =>
        app.permit_status === appConstants.PERMIT_STATUS.PENDING &&
        [
          appConstants.APPLICATION_STATUS.IN_PROCESS,
          appConstants.APPLICATION_STATUS.SUBMITTED,
        ].includes(app.application_status)
    );

    if (duplicateInProgress) return true;

    const hasActivePermit = submittedApplications.some(
      (app) => app.permit_status === appConstants.PERMIT_STATUS.ACTIVE
    );

    if (hasActivePermit) return true;

    return false;

  } catch (error) {
    logger.error(
      `Error in medicalPermitDuplicateCheckService: ${error?.message}`,
      { error }
    );
    throw error;
  }
};


module.exports = {
  addMedicalCertificateService,
  medicalPermitDuplicateCheckService
};

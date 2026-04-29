const { errorConstants } = require("../../../constant/errorConstants");
const errors = require("../../../lib/errors");
const {
  findExistingCategory,
  findExistingSubCategory,
  findOneServiceData,
} = require("../../masterDataModule/dbServices/licenseAndPermitsDbServices");
const promisify = require("../../../lib/async");
const knex = require("../../../lib/knex");
const logger = require("../../../lib/logger");
const appConstants = require("../../../constant/appConstants");
const {
  getPaymentIntent,
  submitApplication,
  getPaymentRecords,
  getUserListingByIds,
  getUserInfo,
  generatePaymentInvoice,
  assignSubCountyToNewApplication,
} = require("../../../lib/api");
const {
  toSentenceCase,
  convertKeysToSnakeCase,
  convertKeysToCamelCase,
} = require("../../../lib/helper");
const {
  createNotification,
  updateNotification,
  findOneNotification,
  updateUserNotification,
} = require("./notificationService");
const _ = require("lodash");
const {
  fetchLicensePermitDetails,
  fetchLicenseApplicationStatus,
  licensePermitService,
  getExpiryDate,
  fetchPermitDetails,
  updateLicensePermit,
  getExpiryDateForLiquor,
} = require("../dbServices/permitDbService");
const {
  updateDocuments,
  insertDocuments,
} = require("../dbServices/documentDbService");
const {
  updateStaffPermit,
} = require("../dbServices/medicalStaffDbService");
const { getFromRedis } = require("../../../lib/redis");
const { redisKeys } = require("../../../constant/redisKeys");

const licenseApplicationService = async (
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
      period,
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

    const licenseMasterDataDetails = await fetchLicensePermitDetails({
      category_id,
      sub_category_id,
      service_id,
      is_active: true,
    });

    let payload = {
      user_id: body.user_id,
      permit_master_id: licenseMasterDataDetails?.id,
      county_id: countyId,
      service_id: body.service_id,
    };

    if (body?.business_name || body?.business_registration_no) {
      if (body?.business_name && body?.business_registration_no) {
        payload = {
          ...payload,
          business_name: body.business_name,
          business_registration_no: body.business_registration_no,
        };
      } else {
        payload = {
          ...payload,
          ...(body?.business_name && {
            business_name: body.business_name,
            business_registration_no: null,
          }),
          ...(body?.business_registration_no && {
            business_registration_no: body.business_registration_no,
            business_name: null,
          }),
        };
      }
    }

    const submittedApplications = await fetchLicenseApplicationStatus(payload);

    const existingApplication = submittedApplications.find((application) => {
      return (
        application?.permit_status === appConstants.PERMIT_STATUS.PENDING &&
        (application?.application_status ===
          appConstants.APPLICATION_STATUS.IN_PROCESS ||
          application?.application_status ===
            appConstants.APPLICATION_STATUS.SUBMITTED)
      );
    });

    if (
      existingApplication &&
      !body.is_detail_exists &&
      body?.business_name &&
      body?.business_registration_no
    ) {
      throw errors.ALREADY_EXISTS(
        "A similar application for this business is already exists. Are you sure you want to proceed?"
      );
    }

    if (existingApplication && !body.is_detail_exists) {
      const businessDetails = body?.business_registration_no
        ? `with business registration number ${body.business_registration_no}`
        : body?.business_name
        ? `with business name ${body.business_name}`
        : "";

      throw errors.ALREADY_EXISTS(
        `A similar application for this category and sub-category ${businessDetails} already exists.`
      );
    }

    const activePermit = submittedApplications.find((application) => {
      return application?.permit_status === appConstants.PERMIT_STATUS.ACTIVE;
    });

    if (
      activePermit &&
      serviceData?.name !== appConstants.SERVICES.ADVERTISEMENT
    ) {
      throw errors.INVALID_INPUT(
        "An active permit already exists for this business in the same category and subcategory."
      );
    }

    if (licenseMasterDataDetails?.amount !== body.amount) {
      throw errors.INVALID_INPUT("Amount is not correct.");
    }
    if (!licenseMasterDataDetails?.applicationFee) body.amount = 0;

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
    body.permit_master_id = licenseMasterDataDetails?.id;
    body.uploaded_documents_id = uploadDocuments.id;
    body.county_id = countyId;
    if (serviceData.name === appConstants.SERVICES.LIQUOR) {
      body.valid_till = getExpiryDateForLiquor(body.period);
    } else {
      body.valid_till = getExpiryDate(
        licenseMasterDataDetails?.amountPaymentType || appConstants.DURATION.ANNUAL
      );
    }
    delete body.category_id;
    delete body.sub_category_id;
    delete body.uploaded_documents;
    delete body.is_detail_exists;
    delete body.medical_application;
    const [insertPermit] = await licensePermitService(body, transaction);

    if (licenseMasterDataDetails?.applicationFee) {
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

    let subCounty = _.get(await getFromRedis(redisKeys.subCounties), body.sub_county_id, '');
    subCounty = toSentenceCase(_.get(subCounty, 'name', ''));
  
    const applicationBody = {
      user_id: body.user_id,
      county_id: countyId,
      documents: uploaded_documents,
      type: serviceData.name,
      application: JSON.stringify({
        category: checkCategory?.name,
        sub_category: checkSubCategory?.name,
        board_approval: licenseMasterDataDetails?.boardApproval,
        public_participation: licenseMasterDataDetails?.publicParticipation,
        application_fee: licenseMasterDataDetails?.applicationFee,
        application_amount: licenseMasterDataDetails?.amount,
        stream: body.stream,
        description: body.description,
        email: body.email,
        phone_number: body.phone_number,
        location: body.location,
        payment_phone_number,
        service_id: serviceData.id,
        service_name: serviceData.name,
        business_name: body.business_name,
        business_registration_no: body.business_registration_no,
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
        period: period,
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
        payment_status: licenseMasterDataDetails?.applicationFee
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
    
    licenseMasterDataDetails.subCategoryName = checkSubCategory?.name || "";
    licenseMasterDataDetails.categoryName = checkCategory?.name || "";
    licenseMasterDataDetails.serviceName =
      toSentenceCase(serviceData?.name) || "";

    return {
      paymentIntent: convertKeysToCamelCase(paymentDetails?.paymentIntent),
      licenseMasterDataDetails,
    };
  } catch (error) {
    await transaction.rollback();
    logger.error("Error license application service", error);
    throw error;
  }
};

const updateLicensePermitService = async (
  body,
  condition,
  transaction,
  select = ["id"]
) => {
  try {
    if (transaction) {
      return await transaction("license_permits")
        .update(body)
        .where(condition)
        .returning(select);
    } else {
      return await knex("license_permits")
        .update(body)
        .where(condition)
        .returning(select);
    }
  } catch (error) {
    logger.error("Error license update service", error);
    throw error;
  }
};

const requestInspectionService = async (req) => {
  const transaction = await promisify(knex.transaction.bind(knex));
  try {
    const { license_id } = req.params;

    const userName = toSentenceCase(
      `${req.user.first_name} ${req.user.last_name}`
    );

    const existingPermit = await fetchPermitDetails({ id: license_id }, [
      "service_id",
    ]);

    if (!existingPermit) {
      throw errors.NOT_FOUND(errorConstants.PERMIT_NOT_EXIST);
    }

    const notificationBody = {
      county_id: req.user.county_id,
      permit_id: license_id,
      assigned_by: req.user.id,
      message: `${userName} moved the application to premise visit.`,
      service_id: existingPermit.serviceId,
    };

    await updateLicensePermitService(
      {
        inspection_request: true,
        inspection_requested_by: req.user.id,
        accepted_by: null,
      },
      { id: license_id },
      transaction
    );

    const [existingNotification] = await findOneNotification({
      permit_id: license_id,
    });

    if (existingNotification) {
      await updateNotification(
        { ...notificationBody, created_at: new Date() },
        { id: existingNotification.id },
        transaction
      );
      await updateUserNotification(
        { is_rejected: false, is_read: false, updated_at: new Date() },
        { notification_id: existingNotification.id },
        transaction
      );
    } else await createNotification(notificationBody, transaction);

    await transaction.commit();
    return;
  } catch (error) {
    await transaction.rollback();
    logger.error("Error requestInspectionService service", error);
    throw error;
  }
};

const getApplicationPaymentHistory = async (req) => {
  try {
    const { permitId } = req.params;
    let { limit, page } = req.query;

    limit = parseInt(limit);
    page = parseInt(page);

    limit = limit > appConstants.PAGE.LIMIT ? appConstants.PAGE.LIMIT : limit;
    page = limit * (page - 1);

    const dbQuery = knex("license_bill_requests as lb")
      .select(
        "lb.id as billId",
        "lb.bill_type as billType",
        "lb.bill_amount as billAmount",
        "lb.created_at as createdAt",
        "lb.payment_id as paymentId",
        "lb.submitted_by as submittedById",
        knex.raw("COUNT(*) OVER() as totalRecords"),
        "license_permits.service_id as serviceId",
        "services.name as serviceName"
      )
      .leftJoin("license_permits", "license_permits.id", "lb.permit_id")
      .leftJoin("services", "services.id", "license_permits.service_id")
      .where({ "license_permits.id": permitId });

    dbQuery.limit(limit).offset(page).orderBy("lb.created_at", "DESC");

    const data = await dbQuery;

    if (data?.length) {
      const paymentIds = data
        .filter((payment) => payment.paymentId)
        .map((payment) => payment.paymentId);

      // get payment details
      if (paymentIds?.length) {
        const paymentRecords = await getPaymentRecords(
          { payment_ids: paymentIds },
          req.headers
        );
        if (paymentRecords?.list?.length) {
          const paymentRecordMap = new Map(
            paymentRecords.list.map((record) => [record.payment_id, record])
          );

          data.forEach((item) => {
            const payRecord = paymentRecordMap.get(item.paymentId);
            if (payRecord) {
              item.trasactionStatus = payRecord.transaction_status;
              item.payementMethod = toSentenceCase(
                payRecord.payment_method_name
              );
              item.transactionId = payRecord.order_id;
              item.transactionRef = payRecord.reference_no;
              item.totalPayAmount = payRecord.amount;
            }
          });
        }
      }

      // get submitted by user details
      const userIds = _.uniq(
        data.map((user) => user.submittedById).filter(Boolean)
      );
      const userRecords = await getUserListingByIds(
        { user_ids: userIds },
        req.headers
      );

      if (userRecords?.list?.length) {
        const userRecordMap = new Map(
          userRecords.list.map((record) => [record.user_id, record])
        );

        data.forEach((item) => {
          const userRecord = userRecordMap.get(item.submittedById);
          if (userRecord) {
            item.submittedBy = toSentenceCase(userRecord.user_name);
          }
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
    logger.error(
      `Error in getApplicationPaymentHistory service: ${error?.message}`,
      {
        error,
      }
    );
    throw error;
  }
};

const updateInspectionRequestStatusService = async (req) => {
  const transaction = await promisify(knex.transaction.bind(knex));
  try {
    const { notificationId, permitId, isAccepted } = req.body;
    const userId = req.user.id;

    if (isAccepted) {
      const existingPermit = await fetchPermitDetails({ id: permitId });
      if (existingPermit?.acceptedBy) {
        throw errors.ALREADY_EXISTS(errorConstants.PERMIT_INSPECTION_ACCEPTED);
      }
      await updateLicensePermitService(
        { accepted_by: userId },
        { id: permitId },
        transaction
      );
    } else {
      await updateUserNotification(
        { is_rejected: true, updated_at: new Date() },
        { notification_id: notificationId, user_id: userId },
        transaction
      );
    }

    await transaction.commit();
    return;
  } catch (error) {
    await transaction.rollback();
    logger.error("Error updateInspectionRequestStatusService service", error);
    throw error;
  }
};

const submitApplicationInspectionReport = async (req) => {
  const transaction = await promisify(knex.transaction.bind(knex));
  try {
    const { permitId } = req.params;
    const { body } = req;

    const existingPermit = await fetchPermitDetails({ id: permitId });

    if (!existingPermit) {
      throw errors.NOT_FOUND(errorConstants.PERMIT_NOT_EXIST);
    }

    const query = `INSERT INTO documents (documents, permit_id, inspection_documents) VALUES (?::jsonb, ?, ?) RETURNING id`;
    const documentParams = [
      JSON.stringify(body.uploadedDocuments),
      permitId,
      true,
    ];

    const [document] = await insertDocuments(
      transaction,
      query,
      documentParams
    );

    delete body.uploadedDocuments;
    body.document_id = document.id;
    const [inspectionId] = await insertInspectionHistory(
      convertKeysToSnakeCase({ ...body, permitId, userId: req.user.id })
    );

    await transaction.commit();
    return {
      ...existingPermit,
      inspectionId,
    };
  } catch (error) {
    await transaction.rollback();
    logger.error("Error submitApplicationInspectionReport service", error);
    throw error;
  }
};

const insertInspectionHistory = async (body, transaction) => {
  try {
    if (transaction)
      return await transaction("inspection_history")
        .insert(body)
        .returning("id");
    else return await knex("inspection_history").insert(body).returning("id");
  } catch (error) {
    logger.error("Error insertInspectionHistory service", error);
    throw error;
  }
};

const getInspectionHistoryListing = async (req) => {
  try {
    const userId = req.user.id;
    const { status, service_id } = req.query;
    let data = [];
    let notificationData = [];

    // Inspection History Query to get all permitIds associated with inspections
    if (
      status === appConstants.INSPECTION_STATUS.APPROVED ||
      status === appConstants.INSPECTION_STATUS.REJECTED ||
      status === appConstants.INSPECTION_STATUS.ALL
    ) {
      const compliance =
        status === appConstants.INSPECTION_STATUS.APPROVED
          ? true
          : status === appConstants.INSPECTION_STATUS.REJECTED
          ? false
          : undefined;

      const dbQuery = knex("inspection_history as ins")
        .select(
          "ins.id as inspectionId",
          "lp.id as permitId",
          "ins.compliance",
          "permit_master_data.category_id as categoryId",
          "category.name as category",
          "lp.user_id as userId"
        )
        .leftJoin("license_permits as lp", "lp.id", "ins.permit_id")
        .leftJoin(
          "permit_master_data",
          "permit_master_data.id",
          "lp.permit_master_id"
        )
        .leftJoin("category", "category.id", "permit_master_data.category_id")
        .where({ "ins.user_id": userId, "lp.service_id": service_id })
        .orderBy("lp.created_at", "DESC");

      if (compliance !== undefined) {
        dbQuery.where({ "ins.compliance": compliance });
      }

      data = await dbQuery;
    }

    // Notification Query with whereNotIn to exclude existing permitIds
    if (
      status === appConstants.INSPECTION_STATUS.ACTIVE ||
      status === appConstants.INSPECTION_STATUS.ALL
    ) {
      const existingPermitIds = [...new Set(data.map((row) => row.permitId))];

      const activeInspectionQuery = knex("license_permits as lp")
        .select(
          "lp.id as permitId",
          "permit_master_data.category_id as categoryId",
          "category.name as category",
          "lp.user_id as userId"
        )
        .leftJoin(
          "permit_master_data",
          "permit_master_data.id",
          "lp.permit_master_id"
        )
        .leftJoin("category", "category.id", "permit_master_data.category_id")
        .where({ "lp.accepted_by": userId, "lp.service_id": service_id })
        .whereNotIn("lp.id", existingPermitIds);

      notificationData = await activeInspectionQuery;
    }

    // Combine the filtered notificationData and inspection history data
    const allData = [...notificationData, ...data];

    if (allData) {
      const userIds = _.uniq(
        allData.map((user) => user.userId).filter(Boolean)
      );
      const userRecords = await getUserInfo(
        { ids: userIds, isInternalCall: true },
        req.headers
      );
      if (userRecords?.data?.length) {
        const userRecordMap = new Map(
          userRecords.data.map((record) => [record.id, record])
        );

        allData.forEach((item) => {
          const userRecord = userRecordMap.get(item.userId);
          if (userRecord) {
            item.userName = toSentenceCase(
              `${userRecord.first_name} ${userRecord.last_name}`
            );
            item.email = toSentenceCase(userRecord.email);
            item.phoneNumber = userRecord.mobile_no;
          }
        });
      }
    }

    return allData;
  } catch (error) {
    logger.error(
      `Error in getInspectionHistoryListing service: ${error?.message}`,
      {
        error,
      }
    );
    throw error;
  }
};

const appplicationUpdateService = async (req) => {
  const transaction = await promisify(knex.transaction.bind(knex));
  try {
    const { application_status } = req.body;
    let permitId;

    if (application_status === appConstants.APPLICATION_STATUS.REJECTED) {
      [permitId] = await updateLicenseApplicationService(
        {
          application_status,
          permit_status: appConstants.PERMIT_STATUS.IN_ACTIVE,
        },
        knex.raw(
          "(license_permits.application_id = ? OR msp.application_id = ?)",
          [req.params.id, req.params.id]
        ),
        transaction
      );
    } else if (
      application_status === appConstants.APPLICATION_STATUS.APPROVED
    ) {
      const [existingPermit] = await fetchLicenseApplicationStatus(null, {
        whereRawCondition: knex.raw(
          "(license_permits.application_id = ? OR msp.application_id = ?)",
          [req.params.id, req.params.id]
        ),
        medicalStaffJoin: true,
        masterDataJoin: true,
      });
      permitId = existingPermit?.id;

      const [serviceData] = await findOneServiceData({
        id: existingPermit?.service_id,
      });

      const body = {
        user_id: existingPermit.user_id,
        county_id: existingPermit.county_id,
        payment_type: serviceData?.name,
        permit_id: existingPermit.application_for_staff
          ? existingPermit.staff_permit_id
          : existingPermit.id,
      };

      if (existingPermit?.permit_fee != 0) {
        const paymentData = await generatePaymentInvoice(body, req.headers);

        if (paymentData) {
          const licenseBody = {
            application_status,
            permit_payment_status: paymentData.data?.paymentIntent?.status,
            permit_payment_id: paymentData.data?.paymentIntent?.id,
            permit_status: appConstants.PERMIT_STATUS.IN_ACTIVE,
          };

          if (existingPermit.application_for_staff) {
            await updateStaffPermit(
              licenseBody,
              {
                id: existingPermit.staff_permit_id,
              },
              ["id"],
              transaction
            );
          } else {
            await updateLicensePermitService(
              licenseBody,
              {
                id: permitId,
              },
              transaction
            );
          }
        }
      } else {
        await updateLicensePermitService(
          {
            application_status,
            permit_status: appConstants.PERMIT_STATUS.ACTIVE,
          },
          {
            id: permitId,
          },
          transaction
        );
      }

      const [landPermit] = await fetchLicenseApplicationStatus(null, {
        whereRawCondition: knex.raw(
          "license_permits.application_id = ?",
          [req.params.id]
        ),
        medicalStaffJoin: false,
        masterDataJoin: false,
      });
      
      if (landPermit?.sub_type === appConstants.LAND_SUB_TYPE.LAND_SUBDIVISION) {
        const proposedPlots = landPermit.license_data?.proposed_plots || [];

        if (!proposedPlots.length)
          throw errors.INVALID_INPUT("No proposed plots found for subdivision.");

        const [parentParcel] = await transaction("land_parcels")
          .where({ id: landPermit.land_parcel_id });

        if (!parentParcel)
          throw errors.NOT_FOUND("Parent land parcel not found.");

        await transaction("land_parcels")
          .update({ land_status: appConstants.LAND_STATUS.SUBDIVIDED })
          .where({ id: landPermit.land_parcel_id });

      }else if (landPermit?.sub_type === appConstants.LAND_SUB_TYPE.LAND_USE_CHANGE) {
        const newUseId = landPermit.license_data?.new_use_id;

        if (!newUseId)
          throw errors.INVALID_INPUT("New land use type not found.");

        const parentParcel = await transaction("land_parcels")
          .where({ id: landPermit.land_parcel_id })
          .first();

        if (!parentParcel)
          throw errors.NOT_FOUND("Parent land parcel not found.");

        await transaction("land_parcels")
          .update({ land_use_id: newUseId })
          .where({ id: landPermit.land_parcel_id });
      }
    } else {
      const [existingPermit] = await fetchLicenseApplicationStatus(null, {
        whereRawCondition: knex.raw(
          "(license_permits.application_id = ? OR msp.application_id = ?)",
          [req.params.id, req.params.id]
        ),
        medicalStaffJoin: true,
        masterDataJoin: true,
      });

      if (existingPermit.application_for_staff) {
        await updateStaffPermit(
          { application_status },
          {
            id: existingPermit.staff_permit_id,
          },
          ["id"],
          transaction
        );
      } else {
        await updateLicensePermitService(
          { application_status },
          {
            id: existingPermit?.id,
          },
          transaction
        );
      }
    }

    // update document request to false on approval or rejection of the application
    if (
      [
        appConstants.APPLICATION_STATUS.REJECTED,
        appConstants.APPLICATION_STATUS.APPROVED,
      ].includes(application_status) &&
      permitId
    ) {
      await updateDocuments(
        {
          reupload_document_request: false,
          additional_document_request: false,
        },
        { permit_id: permitId },
        transaction,
        ["id"]
      );
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error("Error in update application status", error);
    throw error;
  }
};

const checkLicenseApplicationService = async (body) => {
  try {
    const [serviceData] = await findOneServiceData({ id: body.serviceId });
    if (!serviceData) throw errors.NOT_FOUND("Service not found.");

    const licenseMasterDataDetails = await fetchLicensePermitDetails({
      category_id: body.categoryId,
      sub_category_id: body.subCategoryId,
      service_id: body.serviceId,
      is_active: true,
    });

    const payload = {
      user_id: body.userId,
      permit_master_id: licenseMasterDataDetails?.id,
      county_id: body.countyId,
      service_id: body.serviceId,
    };

    if (body?.businessName && body?.businessRegistrationNo) {
      payload.business_name = body?.businessName;
      payload.business_registration_no = body?.businessRegistrationNo;
    }

    const submittedApplications = await fetchLicenseApplicationStatus(payload);

    const existingApplication = submittedApplications.find((application) => {
      return (
        application?.permit_status === appConstants.PERMIT_STATUS.PENDING &&
        (application?.application_status ===
          appConstants.APPLICATION_STATUS.IN_PROCESS ||
          application?.application_status ===
            appConstants.APPLICATION_STATUS.SUBMITTED)
      );
    });

    if (
      existingApplication &&
      body?.businessName &&
      body?.businessRegistrationNo
    ) {
      throw errors.NOT_ALLOWED(
        "A similar application for this business is already exists. Are you sure you want to proceed?"
      );
    }

    if (
      existingApplication &&
      !body?.businessName &&
      !body?.businessRegistrationNo
    ) {
      throw errors.ALREADY_EXISTS(
        "A similar application for this category and subcategory is already exists."
      );
    }

    const activePermit = submittedApplications.find((application) => {
      return application?.permit_status === appConstants.PERMIT_STATUS.ACTIVE;
    });

    if (
      activePermit &&
      serviceData?.name !== appConstants.SERVICES.ADVERTISEMENT
    ) {
      throw errors.INVALID_INPUT(
        "An active permit already exists for this business in the same category and subcategory."
      );
    }
  } catch (error) {
    console.error("Error in checking license status", error);
    throw error;
  }
};

const updateLicenseApplicationService = async (
  body,
  condition,
  transaction
) => {
  try {
    let query;
    [query] = await knex("license_permits as lp")
      .leftJoin("medical_staff_permits as msp", "msp.permit_id", "lp.id")
      .select(
        "lp.id as permit_id",
        "lp.application_for_staff",
        "msp.id as staff_permit_id",
        knex.raw(
          "COALESCE(lp.application_id, msp.application_id) as application_id"
        ),
        knex.raw(
          "COALESCE(lp.application_status, msp.application_status) as application_status"
        )
      )
      .where(condition);

    if (transaction) {
      if (query.application_for_staff) {
        return await transaction("medical_staff_permits as msp")
          .update(body)
          .where({
            application_id: query.application_id,
          })
          .returning("id");
      } else {
        return await transaction("license_permits as lp")
          .update(body)
          .where({
            application_id: query.application_id,
          })
          .returning("id");
      }
    } else {
      if (query.application_for_staff) {
        return await knex("medical_staff_permits as msp")
          .update(body)
          .where({
            application_id: query.application_id,
          })
          .returning("id");
      } else {
        return await knex("license_permits as lp")
          .update(body)
          .where({
            application_id: query.application_id,
          })
          .returning("id");
      }
    }
  } catch (error) {
    logger.error("Error license update service", error);
    throw error;
  }
};

const licenceDuplicateCheckService = async (body) => {
  const {
    category_id,
    sub_category_id,
    service_id,
    user_id,
    county_id,
    sub_county_id,
  } = body;

  const licenseMasterDataDetails = await fetchLicensePermitDetails({
    category_id,
    sub_category_id,
    service_id,
    is_active: true,
  });

  const payload = {
    user_id,
    permit_master_id: licenseMasterDataDetails?.id,
    county_id,
    service_id,
    sub_county_id,
  };

const duplicatePermit = await knex("license_permits")
  .select(
    "id",
    "user_id",
    "permit_master_id",
    "county_id",
    "permit_status",
    "application_status",
    "sub_county_id",
    "service_id"
  )
  .where( payload )
  .whereIn("permit_status", [appConstants.PERMIT_STATUS.ACTIVE, appConstants.PERMIT_STATUS.PENDING])
  .whereNot("permit_payment_status", appConstants.PAYMENT_STATUS.CANCELLED)
  .first();

  return !!duplicatePermit;
};

const publicPermitDataService = async (referenceNumber) => {
  try {
    const permit = await knex("license_permits as lp")
      .select(
        "lp.id",
        "lp.service_id",
        "lp.valid_till as lp_valid_till",
        "lp.reference_number",
        "lp.permit_status as lp_status",
        "msp.permit_status as msp_status",
        "msp.valid_till as msp_valid_till",
        "s.name as service_name",
        "msp.id as msp_id"
      )
      .leftJoin("medical_staff_permits as msp", "msp.permit_id", "lp.id")
      .leftJoin("services as s", "lp.service_id", "s.id")
      .where("lp.reference_number", referenceNumber)
      .orWhere("msp.reference_number", referenceNumber)
      .first();

    if (!permit) return null;

    const status = permit.msp_id ? permit.msp_status : permit.lp_status;
    const validTillRaw = permit.msp_id ? permit.msp_valid_till : permit.lp_valid_till;

    if (!validTillRaw) {
      return {
        id: permit.id,
        serviceName: permit.service_name,
        status: appConstants.LICENSE_PERMIT_STATUS.IN_VALID,
      };
    }

    const now = new Date();
    const validTill = new Date(validTillRaw);

    const isValid =
      status === appConstants.PERMIT_STATUS.ACTIVE && validTill > now;

    return {
      id: permit.id,
      serviceName: permit.service_name,
      validTill: validTillRaw,
      status: isValid
        ? appConstants.LICENSE_PERMIT_STATUS.VALID
        : appConstants.LICENSE_PERMIT_STATUS.IN_VALID,
    };
  } catch (err) {
    console.error("Error in publicPermitDataService:", err);
    throw err;
  }
};

const licensePermitDataService = async (referenceNumber) => {
  try {
    const permit = await knex("license_permits as lp")
      .select(
        "lp.id",
        "lp.user_id",
        "lp.service_id",
        "lp.valid_till as lp_valid_till",
        "lp.reference_number as lp_reference_number",
        "lp.permit_master_id",
        "lp.permit_status as lp_permit_status",
        "s.name as service_name",
        "lp.email",
        "lp.location",
        "lp.id_number as lp_id_number",
        "lp.street",
        "lp.building_name",
        "lp.po_box",
        "lp.postal_code",
        "lp.description",
        "lp.period",
        "lp.business_name",
        "lp.sub_county_id",
        "lp.ward_id",
        "lp.business_registration_no",
        "lp.plot_number",
        "lp.stall_number",
        "lp.floor_number",
        "pm.category_id",
        "pm.sub_category_id",
        "c.name as category_name",
        "sc.name as sub_category_name",
        "msp.id as msp_id",
        "msp.valid_till as msp_valid_till",
        "msp.permit_status as msp_permit_status",
        "msp.permit_master_id as msp_permit_master_id",
        "msp.document_number",
        "msp.staff_name",
        "msp.email as msp_email",
        "msp.reference_number as msp_reference_number",
      )
      .leftJoin("medical_staff_permits as msp", "msp.permit_id", "lp.id")
      .leftJoin("services as s", "lp.service_id", "s.id")
      .leftJoin(
        "permit_master_data as pm",
        knex.raw("pm.id = COALESCE(msp.permit_master_id, lp.permit_master_id)")
      )
      .leftJoin("category as c", "pm.category_id", "c.id")
      .leftJoin("sub_category as sc", "pm.sub_category_id", "sc.id")
      .where("lp.reference_number", referenceNumber)
      .orWhere("msp.reference_number", referenceNumber)
      .first();

    if (!permit) return null;

    const subCounties = await getFromRedis(redisKeys.subCounties);
    const wards = await getFromRedis(redisKeys.wards);

    if (permit.sub_county_id && subCounties) {
      const subCounty = subCounties[permit.sub_county_id];
      permit.subCounty = subCounty ? toSentenceCase(subCounty.name) : null;
    }

    if (permit.ward_id && wards) {
      const ward = wards[permit.ward_id];
      permit.ward = ward ? toSentenceCase(ward.name) : null;
    }

    const now = new Date();

    const isFromMSP = !!permit.msp_id;

    const effectiveStatus = isFromMSP
      ? permit.msp_permit_status
      : permit.lp_permit_status;

    const effectiveValidTill = isFromMSP
      ? permit.msp_valid_till
      : permit.lp_valid_till;

    const effectivePermitMasterId = isFromMSP
      ? permit.msp_permit_master_id
      : permit.lp_permit_master_id;

    permit.id_number = isFromMSP
      ? permit.document_number || permit.lp_id_number
      : permit.lp_id_number;

    permit.email = isFromMSP 
      ? permit.msp_email || permit.lp_email 
      : permit.lp_email;

    permit.reference_number = isFromMSP 
      ? permit.msp_reference_number || permit.lp_reference_number
      : permit.lp_reference_number;

    permit.staff_name = isFromMSP ? permit.staff_name : null;

    const isStillValid =
      effectiveStatus === appConstants.PERMIT_STATUS.ACTIVE &&
      new Date(effectiveValidTill) > now;

    permit.status = isStillValid
      ? appConstants.LICENSE_PERMIT_STATUS.VALID
      : appConstants.LICENSE_PERMIT_STATUS.IN_VALID;

    permit.validTill = effectiveValidTill;
    permit.permit_master_id = effectivePermitMasterId;

    return permit;
  } catch (error) {
    console.error("Error in licensePermitDataService:", error);
    throw error;
  }
};

const landParcelUpdateService = async (req) => {
  const transaction = await promisify(knex.transaction.bind(knex));
  try {
    const { application_status } = req.body;
    const { id } = req.params;

    const existingParcel = await knex("land_parcels")
      .where({ application_id: id })
      .first();

    if (!existingParcel) {
      throw errors.NOT_FOUND("Land parcel not found for this application.");
    }

    const updateBody = { application_status };

    if (application_status === appConstants.APPLICATION_STATUS.APPROVED) {
      updateBody.land_status = appConstants.LAND_STATUS.ACTIVE;
    }

    await transaction("land_parcels")
      .update(updateBody)
      .where({ application_id: id });

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    console.error("Error in land parcel update service", error);
    throw error;
  }
};

module.exports = {
  licenseApplicationService,
  updateLicensePermitService,
  requestInspectionService,
  getApplicationPaymentHistory,
  updateInspectionRequestStatusService,
  submitApplicationInspectionReport,
  getInspectionHistoryListing,
  appplicationUpdateService,
  checkLicenseApplicationService,
  updateLicenseApplicationService,
  licenceDuplicateCheckService,
  publicPermitDataService,
  licensePermitDataService,
  landParcelUpdateService
};

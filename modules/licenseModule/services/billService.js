const errors = require("../../../lib/errors");
const knex = require("../../../lib/knex");
const logger = require("../../../lib/logger");
const {
  fetchLicenseBillDetails,
} = require("./permitService");
const promisify = require("../../../lib/async");
const {
  convertKeysToSnakeCase,
  convertKeysToCamelCase,
  toSentenceCase,
} = require("../../../lib/helper");
const {
  generateBill,
  fetchBillDetails,
  getUserListingByIds,
  getPaymentIntent,
  getApplication,
  getPaymentRecords,
} = require("../../../lib/api");
const appConstants = require("../../../constant/appConstants");

const {
  findOneLicenseAndPermit,
} = require("../../masterDataModule/services/uploadLicenseAndPermit");
const { isEmpty, map, uniq } = require("lodash");
const {
  findOneServiceData,
} = require("../../masterDataModule/dbServices/licenseAndPermitsDbServices");
const { errorConstants } = require("../../../constant/errorConstants");
const { fetchPermitDetails, getExpiryDate } = require("../dbServices/permitDbService");

const licenseBillRequestService = async (body, headers) => {
  const transaction = await promisify(knex.transaction.bind(knex));
  try {
    const permit = await fetchPermitDetails({ id: body.permitId }, [
      "id",
      "application_id",
      "application_status",
      "user_id",
      "permit_status",
      "payment_id",
      "permit_master_id",
      "service_id",
      "county_id",
    ]);

    if (!permit) throw errors.NOT_FOUND("Permit not found.");

    if (
      permit &&
      [
        appConstants.APPLICATION_STATUS.SUBMITTED,
        appConstants.APPLICATION_STATUS.APPROVED,
      ].includes(permit.application_status)
    )
      throw errors.NOT_ALLOWED(
        "The application has either been submitted or approved and is currently not in the review state."
      );

    const permitMasterDetails = await findOneLicenseAndPermit(
      {
        "permit_master_data.id": permit?.permitMasterId,
        "permit_master_data.service_id": permit?.serviceId,
      },
      [
        "permit_master_data.id",
        "permit_master_data.category_id as categoryId",
        "category.name as categoryName",
      ],
      true
    );

    if (!permitMasterDetails)
      throw errors.NOT_FOUND("License master does not exists.");

    const [serviceData] = await findOneServiceData({
      id: permit?.serviceId,
    });

    if (!serviceData) throw errors.NOT_FOUND(errorConstants.SERVICE_NOT_FOUND);

    const { data: applicationDetails } = await getApplication(
      permit?.applicationId,
      headers
    );

    if (!applicationDetails)
      throw errors.NOT_FOUND("Application does not exists.");

    const { data } = await fetchLicenseBillDetails({
      whereCondition: { bill_type: body.billType, permit_id: body.permitId },
    });
    const [billDetails] = data;

    if (billDetails)
      throw errors.ALREADY_EXISTS(
        "This bill type is already generated on this application."
      );

    body.status = appConstants.PAYMENT_STATUS.NOT_PAID;
    delete body.userId;

    const billData = convertKeysToSnakeCase(body);     

    const [bill] = await insertBillRequest(billData, transaction);

    const generatedBill = await generateBill(
      {
        service: appConstants.AUDIT_CONSTANTS.LICENSE_PERMIT,
        service_id: permit?.id,
        reference_id: permit?.permitMasterId,
        total_amount: body?.billAmount,
        user_id: permit?.userId,
        county_id: body?.countyId,
        valid_till: getExpiryDate(),
      },
      headers
    );

    if (!generatedBill || !generatedBill?.data)
      throw errors.INTERNAL("Error in generating bill.");

    await updateBill(
      {
        bill_reference: generatedBill?.data.bill_no,
      },
      { permit_id: permit?.id, id: bill?.id },
      transaction
    );

    await transaction.commit();
    return {
      ...permit,
      serviceName: toSentenceCase(serviceData?.name),
      categoryName: toSentenceCase(permitMasterDetails?.categoryName),
      ...convertKeysToCamelCase(generatedBill?.data),
      applicationRefNumber: applicationDetails.reference_no,
    };
  } catch (error) {
    await transaction.rollback();
    logger.error("Error in generating bill request", error);
    throw error;
  }
};

const insertBillRequest = async (body, transaction) => {
  if (transaction)
    return await transaction("license_bill_requests")
      .insert(body)
      .returning("*");
  else return await knex("license_bill_request").insert(body).returning("*");
};

const updateBill = async (body, condition, transaction) => {
  if (transaction)
    return await transaction("license_bill_requests")
      .update(body)
      .where(condition)
      .returning("id");
  else
    return await knex("license_bill_request")
      .update(body)
      .where(condition)
      .returning("id");
};

const payBillService = async (body, headers, userId, query) => {
  const transaction = await promisify(knex.transaction.bind(knex));
  try {
    const billDetails = await fetchLicenseBillDetails({
      whereCondition: { bill_reference: body.billReference },
    });

    if (!billDetails.data.length)
      throw errors.NOT_FOUND("Bill does not exists.");

    const [permitId] = uniq(
      map(billDetails?.data, (detail) => detail.permit_id).filter(
        (userId) => userId !== null
      )
    );

    const permitDetails = await fetchPermitDetails({
      id: permitId,
    });

    if (!permitDetails) throw errors.NOT_FOUND("Permit does not exists");

    const { data: bill = {} } = await fetchBillDetails(
      { bill_no: body?.billReference },
      headers
    );

    if (isEmpty(bill) || (bill && bill.is_paid))
      throw errors.INVALID_INPUT("Invalid bill.");

    let payloadForPayment = {
      user_id: body.userId,
      county_id: body.countyId,
      amount: billDetails?.data[0].bill_amount.toString(),
      phone_number: body.phoneNumber,
      email: body.email,
      entity_id: permitDetails?.id,
      created_by: userId,
      card_details: body.card_details,
      payment_type: appConstants.AUDIT_CONSTANTS.UNIVERSAL,
      sub_service_type: `${appConstants.AUDIT_CONSTANTS.LICENSE_PERMIT}_BILL`,
      bill_no: body.billReference,
      payment_id: body.paymentId,
    };

    const { paymentIntent } = await getPaymentIntent(
      payloadForPayment,
      query,
      headers
    );

    if (!paymentIntent) throw errors.INTERNAL("Payment Failed.");

    await updateBill(
      { payment_id: paymentIntent?.id, updated_at: new Date() },
      { bill_reference: paymentIntent?.bill_no, id: billDetails?.data[0]?.id },
      transaction
    );

    await transaction.commit();
    return {
      billNo: paymentIntent?.bill_no,
      userId: paymentIntent?.user_id,
      countyId: paymentIntent?.county_id,
      phoneNumber: paymentIntent?.phone_number,
      licensePermitId: paymentIntent?.entity_id,
      paymentType: toSentenceCase(paymentIntent?.payment_type),
      subServiceType: toSentenceCase(paymentIntent?.sub_service_type),
      status: paymentIntent?.status,
      currency: paymentIntent?.currency,
      uniqueReferenceNo: paymentIntent?.unique_reference_no,
      amount: paymentIntent?.amount,
      paymentId: paymentIntent?.id,
      transactionReference: paymentIntent?.transaction_ref,
    };
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    throw error;
  }
};

const billListService = async (permitId, query, headers) => {
  const { data, total } = await fetchLicenseBillDetails({
    whereCondition: { permit_id: permitId },
    limit: query.limit,
    page: query.page,
  });

  const userIds = uniq(
    map(data, (detail) => detail.submitted_by).filter(
      (userId) => userId !== null
    )
  );
  const permitIds = uniq(
    map(data, (detail) => detail.permit_id).filter((userId) => userId !== null)
  );
  const paymentIds = uniq(
    map(data, (detail) => detail.payment_id).filter((id) => id !== null)
  );

  const { list: paymentDetails } = await getPaymentRecords(
    {
      payment_ids: paymentIds,
    },
    headers
  );

  const permitDetails = await knex("license_permits as lp")
    .select(
      "lp.id",
      "lp.application_id",
      "lp.payment_id",
      "lp.permit_status",
      "lp.payment_status",
      "lp.permit_master_id",
      "lp.application_status",
      "permit_master_data.permit_fee",
      "category.name"
    )
    .leftJoin(
      "permit_master_data",
      "lp.permit_master_id",
      "permit_master_data.id"
    )
    .leftJoin("category", "category.id", "permit_master_data.category_id")
    .whereIn("lp.id", permitIds);

  const { list: userRecords } = await getUserListingByIds(
    { user_ids: userIds },
    headers
  );

  let total_amount = 0;
  data.map(async (data) => {
    userRecords.map((record) => {
      if (record.user_id === data.submitted_by) {
        data.submitted_by_name = toSentenceCase(record.user_name) || "";
      }
    });
    data.bill_type = toSentenceCase(data.bill_type);
    permitDetails.map((permit) => {
      if (permit.id === data.permit_id) {
        data.permit_fee = permit.permit_fee;
        data.category_name = toSentenceCase(permit.name);
        data.application_status = permit.application_status;
      }
    });
    total_amount += data.bill_amount;
    paymentDetails.map((pay) => {
      if (pay.payment_id === data.payment_id) {
        data.invoice_key = pay.invoice_key;
      }
    });
  });

  return {
    billDetails: data,
    total_bill_amount: total_amount,
    total_count: total,
  };
};


module.exports = {
  licenseBillRequestService,
  payBillService,
  billListService,
};

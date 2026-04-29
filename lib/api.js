const { BASE_URLS } = require("../constant/appConstants");
const { apiCaller } = require("./apiCaller");

/**
 * create payment intent
 * @param {*} body
 * @param {*} headers
 * @returns
 */
const getPaymentIntent = (body, query, headers) => {
  return apiCaller({
    method: "POST",
    body,
    headers,
    query,
    url: `${BASE_URLS.PAYMENT_SERVICE_BASE_URL}/payment-intent`,
  });
};

/**
 * get payment history
 */
const getPaymentHistory = (body, query, headers) => {
  return apiCaller({
    method: "POST",
    body,
    headers,
    query,
    url: `${BASE_URLS.PAYMENT_SERVICE_BASE_URL}/payment-history`,
  });
};

/**
 * get payment history
 */
const updatePaymentInvoice = (paymentId, headers) => {
  return apiCaller({
    method: "PUT",
    headers,
    url: `${BASE_URLS.PAYMENT_SERVICE_BASE_URL}/update-invoice/${paymentId}`,
  });
};

// regenrate payment invoices
const regeneratePaymentInvoice = async (body, headers) => {
  return apiCaller({
    body,
    method: "PUT",
    headers,
    url: `${BASE_URLS.PAYMENT_SERVICE_BASE_URL}/regenerate-payment-invoices`,
  });
};

/**
 * get payment information
 */
const getpaymentInfo = async (paymentId, headers) => {
  return apiCaller({
    method: "GET",
    headers,
    url: `${BASE_URLS.PAYMENT_SERVICE_BASE_URL}/payment/${paymentId}`,
  });
};

/**
 * get user Information
 * @param {*} params
 * @param {*} headers
 * @returns
 */
const getUserInformation = (userId, headers) => {
  // get user information using user id
  return apiCaller({
    method: "GET",
    url: `${BASE_URLS.USER_SERVICE_BASE_URL}/${userId}`,
    headers,
  });
};

const createPayment = (body, headers) => {
  const url = `${BASE_URLS.PAYMENT_SERVICE_BASE_URL}/create-payment`;
  return apiCaller({ method: "POST", body, headers, url });
};

const getPaymentRecords = (body, headers) => {
  return apiCaller({
    body,
    headers,
    method: "POST",
    url: `${BASE_URLS.PAYMENT_SERVICE_BASE_URL}/get-payment-records`,
  });
};

const getPartialPaymentRecords = (body, headers) => {
  return apiCaller({
    body,
    headers,
    method: "POST",
    url: `${BASE_URLS.PAYMENT_SERVICE_BASE_URL}/get-partial-payment-records`,
  });
};

// fetch payment history of market permits
const getPaymentHistoryRecords = (permitId, headers) => {
  return apiCaller({
    headers,
    method: "GET",
    url: `${BASE_URLS.PAYMENT_SERVICE_BASE_URL}/market-rent/payment-details/${permitId}`,
  });
};

// generate renew bill for Market rent
const generateRenewBillAPI = (body, headers) => {
  return apiCaller({
    body,
    method: "POST",
    headers,
    url: `${BASE_URLS.PAYMENT_SERVICE_BASE_URL}/bill/generate-renew-bill`,
  });
};

/**
 * bill request list
 */
const getBillRequestPaymentList = (body, query, headers) => {
  return apiCaller({
    body,
    query,
    method: "POST",
    headers,
    url: `${BASE_URLS.PAYMENT_SERVICE_BASE_URL}/bill/bill-request-list`,
  });
};

/**
 * create payment intent
 * @param {*} body
 * @param {*} headers
 * @returns
 */
const getPaymentIntentUssd = (body, query, headers) => {
  return apiCaller({
    method: "POST",
    body,
    headers,
    query,
    url: `${BASE_URLS.PAYMENT_SERVICE_BASE_URL}/ussd/payment-intent`,
  });
};

// get payment records based on payment ids
const getPaymentRecordById = (body) => {
  return apiCaller({
    body,
    method: "POST",
    url: `${BASE_URLS.PAYMENT_SERVICE_BASE_URL}/ussd/get-payment-records`,
  });
};

// to submit applications
const submitApplication = async (body, headers) => {
  return await apiCaller({
    body,
    headers,
    method: "POST",
    url: `${BASE_URLS.USER_SERVICE_BASE_URL}/application/license-permit`,
  });
};

const updateApplication = async (body, headers) => {
  return await apiCaller({
    body,
    headers,
    method: "PUT",
    url: `${BASE_URLS.USER_SERVICE_BASE_URL}/license-application`,
  });
};

/**
 * generate bill
 */
const generateBill = (body, headers) => {
  const url = `${BASE_URLS.PAYMENT_SERVICE_BASE_URL}/bill/generate-bill`;
  return apiCaller({ method: "POST", body, headers, url });
};

const getUserListingByIds = (body, headers) => {
  return apiCaller({
    body,
    headers,
    method: "POST",
    url: `${BASE_URLS.USER_SERVICE_BASE_URL}/user-list`,
  });
};

/**
 * generate bill
 */
const fetchBillDetails = (query, headers) => {
  return apiCaller({
    method: "GET",
    headers,
    query: query,
    url: `${BASE_URLS.PAYMENT_SERVICE_BASE_URL}/internal/bill/get-bill`,
  });
};

const getUserInfo = (body) => {
  return apiCaller({
    method: "POST",
    body,
    url: `${BASE_URLS.USER_SERVICE_BASE_URL}/user-record`,
  });
};

const getApplication = async (applicationId, headers) => {
  return await apiCaller({
    headers,
    method: "GET",
    url: `${BASE_URLS.USER_SERVICE_BASE_URL}/application/${applicationId}`,
  });
};

const getApplicationById = async (applicationId, headers) => {
  const url = `${BASE_URLS.USER_SERVICE_BASE_URL}/application/${applicationId}`;
  return apiCaller({ method: "GET", url, headers });
};

const generatePaymentInvoice = (body, headers) => {
  return apiCaller({
    method: "POST",
    headers,
    body,
    url: `${BASE_URLS.PAYMENT_SERVICE_BASE_URL}/generate-invoice`,
  });
};

const getPartialPaymentIntent = (body, query, headers) => {
  return apiCaller({
    method: "POST",
    body,
    headers,
    query,
    url: `${BASE_URLS.PAYMENT_SERVICE_BASE_URL}/partial/payment-intent`,
  });
};

const submitMedicalApplication = async (body, headers) => {
  return await apiCaller({
    body,
    headers,
    method: "POST",
    url: `${BASE_URLS.USER_SERVICE_BASE_URL}/medical-submit-application`,
  });
};

const getUserIdsByType = async (body) => {
  return apiCaller({
    body,
    method: "POST",
    url: `${BASE_URLS.USER_SERVICE_BASE_URL}/user-ids-type`,
  });
};

//Assign subcounty to new application
const assignSubCountyToNewApplication = async (body, headers) => {
  return await apiCaller({
    body,
    headers,
    method: "PUT",
    url: `${BASE_URLS.USER_SERVICE_BASE_URL}/application/assign-subcounty`,
  });
};

const submitLandRatesApplication = async (body, headers) => {
  return await apiCaller({
    body,
    headers,
    method: "POST",
    url: `${BASE_URLS.USER_SERVICE_BASE_URL}/application/land-rate-permit`,
  });
};

const getLandRateInvoiceInfo = (query, headers) => {
  return apiCaller({
    method: "GET",
    headers,
    query,
    url: `${BASE_URLS.PAYMENT_SERVICE_BASE_URL}/land-rates/invoices`,
  });
}

module.exports = {
  getPaymentIntent,
  getPaymentHistory,
  getpaymentInfo,
  getUserInformation,
  createPayment,
  updatePaymentInvoice,
  getPaymentRecords,
  regeneratePaymentInvoice,
  getPaymentHistoryRecords,
  generateRenewBillAPI,
  getBillRequestPaymentList,
  getPaymentIntentUssd,
  getPaymentRecordById,
  submitApplication,
  updateApplication,
  generateBill,
  getUserListingByIds,
  fetchBillDetails,
  getUserInfo,
  getApplication,
  getApplicationById,
  generatePaymentInvoice,
  getPartialPaymentIntent,
  getPartialPaymentRecords,
  submitMedicalApplication,
  getUserIdsByType,
  assignSubCountyToNewApplication,
  submitLandRatesApplication,
  getLandRateInvoiceInfo
};

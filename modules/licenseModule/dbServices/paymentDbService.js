const { getPartialPaymentRecords } = require("../../../lib/api");
const { toSentenceCase } = require("../../../lib/helper");

const updatePaymentData = async (paymentId, headers) => {
  const paymentRecords = await getPartialPaymentRecords(
    { payment_id: paymentId },
    headers
  );

  if (paymentRecords?.list?.length) {
    const isPartialPaymentRecord = paymentRecords.list[0].is_partial_payment;
    const paymentDetails = paymentRecords.list[0];

    if (isPartialPaymentRecord) {
      const partialPaymentList = paymentDetails.partial_payment;
      const balanceAmount = paymentDetails.balance_amount;
      partialPaymentList.forEach((item) => {
        item.transactionStatus = item.transaction_status;
        item.dateOfPurchase = item.date_of_purchase;
        item.paymentMethod = toSentenceCase(item.payment_method_name);
        item.transactionId = item.order_id;
        item.transactionRef = item.reference_no;
        item.paymentPhoneNumber = item.phone_number;
        item.receiptKey = item.receipt_key || null;
        item.invoiceKey = item.invoice_key || null;
        item.paymentId = item.payment_id;
        item.partialPaymentId = item.partial_payment_id;
      });

      return { balanceAmount, paymentList: partialPaymentList || [] };
    } else {
      const paymentRecord = paymentRecords.list;
      paymentRecord.forEach((item) => {
        item.transactionStatus = item.transaction_status;
        item.dateOfPurchase = item.date_of_purchase;
        item.paymentMethod = toSentenceCase(item.payment_method_name);
        item.transactionId = item.order_id;
        item.transactionRef = item.reference_no;
        item.paymentPhoneNumber = item.phone_number;
        item.receiptKey = item.receipt_key || null;
        item.invoiceKey = item.invoice_key || null;
        item.id = item.payment_id;
      });

      return { paymentList: paymentRecord || [] };
    }
  }
  return [];
};
module.exports = {
  updatePaymentData,
};

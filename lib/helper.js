const QRCode = require("qrcode");
const { PAYMENT_MODES } = require("../constant/appConstants");
const { errorConstants } = require("../constant/errorConstants");
const errors = require("./errors");
const appConstants = require("../constant/appConstants");

// generate qr code
const generateQR = async (text) => {
  try {
    return QRCode.toDataURL(text);
  } catch (err) {
    console.error("generateQR error : ", err);
  }
};

/*
 * get previous month end date
 * @param {*} date
 * @returns
 */
const getPreviousMonthEndDate = (date = new Date()) => {
  date.setDate(0);
  return new Date(date);
};

const paymentValidation = (query, body) => {
  const { payment_mode } = query;

  const { card_details, transaction_ref, transaction_id, bank_slip_document } =
    body;

  // if payment mode is card and card details are not provided.
  if (payment_mode === PAYMENT_MODES.CARD && !card_details)
    throw errors.INVALID_INPUT(errorConstants.CARD_DETAILS_ARE_REQUIRED);
  // if payment mode is not card and card details are provided.
  else if (payment_mode !== PAYMENT_MODES.CARD && card_details)
    throw errors.INVALID_INPUT(
      errorConstants.ADDITIONAL_PROPERTIES_ARE_NOT_ALLOWED
    );

  // if payment mode is Interswitch, then transaction_ref & transaction_id are required.
  if (
    payment_mode === PAYMENT_MODES.INTERSWITCH &&
    (!transaction_ref || !transaction_id)
  )
    throw errors.INVALID_INPUT(
      errorConstants.TRANSACTION_REF_AND_TRANSACTION_ID_IS_REQUIRED
    );

  // if payment mode is Interswitch, then transaction_ref & transaction_id are required.
  if (payment_mode === PAYMENT_MODES.BANK && !bank_slip_document)
    throw errors.INVALID_INPUT(errorConstants.BANK_SLIP_DOCUCUMENT_IS_REQUIRED);
};

/**
 * get date in format YYYY-MM-DD OR
 * YYYY-MM-DD HH-MM-SS
 * @param {*} date
 * @param {*} isOnlyDate
 * @returns
 */
const getDate = (date, isOnlyDate) => {
  let dateToSend = "";
  if (date !== undefined && date !== null) {
    let d = new Date(date);

    d = d.getTime() > 0 ? d : new Date(parseInt(date, 10));
    if (isOnlyDate) {
      dateToSend =
        ("0" + d.getDate()).slice(-2) +
        "-" +
        ("0" + (d.getMonth() + 1)).slice(-2) +
        "-" +
        d.getFullYear();
    } else {
      dateToSend =
        ("0" + d.getDate()).slice(-2) +
        "-" +
        ("0" + (d.getMonth() + 1)).slice(-2) +
        "-" +
        d.getFullYear() +
        " " +
        d.toLocaleString("en-US", {
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
          hour12: true,
        });
    }
  }
  return dateToSend;
};

function convertKeysToSnakeCase(obj) {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToSnakeCase);
  }

  if (typeof obj === "object" && obj !== null) {
    const newObj = {};

    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        const snakeKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
        newObj[snakeKey] = convertKeysToSnakeCase(obj[key]);
      }
    }

    return newObj;
  }

  return obj;
}

function snakeToCamelCase(str) {
  return str.toLowerCase().replace(/(_\w)/g, (match) => match[1].toUpperCase());
}

function convertKeysToCamelCase(obj) {
  const newObj = {};

  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = snakeToCamelCase(key);
      newObj[camelKey] = obj[key];
    }
  }

  return newObj;
}

const toSentenceCase = (input, noSpaceAtUnderscore = false) => {
  if (!input) return "";

  const convert = (str) => {
    if (!str) return "";

    // Remove leading slash if present
    if (str.startsWith("/")) {
      str = str.slice(1);
    }

    if (/([a-z])([A-Z])/.test(str)) {
      str = str.replace(/([a-z])([A-Z])/g, "$1 $2");
    }

    // Special case for "MPESSA_EXPRESS"
    if (
      str === appConstants.PAYMENT_MODES.MPESSA_EXPRESS ||
      str === appConstants.PAYMENT_MODES.MPESSA
    ) {
      str = str.replace("MPESSA", "MPESA");
    }

    return str
      .split(" ")
      .map((word) => {
        if (word.includes("_")) {
          let actualString = "";
          if (noSpaceAtUnderscore) {
            actualString = word
              .toLowerCase()
              .split("_")
              .map((subWord, index) =>
                index === 0
                  ? subWord.charAt(0).toUpperCase() + subWord.slice(1)
                  : subWord
              )
              .join("");
          } else {
            actualString = word
              .split("_")
              .map(
                (subWord) =>
                  subWord.charAt(0).toUpperCase() +
                  subWord.slice(1).toLowerCase()
              )
              .join(" ");
          }
          return actualString;
        } else {
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        }
      })
      .join(" ");
  };

  if (Array.isArray(input)) {
    return input.map(convert);
  } else {
    return convert(input);
  }
};

function snakeToCamelCaseV1(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function convertAllKeysToCamelCase(obj) {
  if (Array.isArray(obj)) {
    return obj.map(convertAllKeysToCamelCase);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.entries(obj).reduce((acc, [key, value]) => {
      const camelKey = snakeToCamelCaseV1(key);
      acc[camelKey] = convertAllKeysToCamelCase(value);
      return acc;
    }, {});
  }
  return obj;
};

module.exports = {
  generateQR,
  getPreviousMonthEndDate,
  paymentValidation,
  getDate,
  convertKeysToSnakeCase,
  snakeToCamelCase,
  convertKeysToCamelCase,
  toSentenceCase,
  convertAllKeysToCamelCase
};

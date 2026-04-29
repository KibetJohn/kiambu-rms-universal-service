const { UUID_PATTERN, EMAIL, REFERENCE_NUMBER_PATTERN } = require("../../../util/regex");
const {
  validationConstants,
} = require("../../../constant/validationConstants");
const { enums } = require("../../../constant/enumConstants");
const appConstants = require("../../../constant/appConstants");

const licenseApplicationValidation = {
  type: "object",
  properties: {
    categoryId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
    subCategoryId: { type: "string", pattern: UUID_PATTERN },
    stream: {
      type: "string",
      minLength: validationConstants.STRING_MIN_LENGTH,
    },
    email: {
      type: "string",
      pattern: EMAIL,
      errorMessage: "Email format is not correct.",
    },
    amount: {
      type: "number",
      multipleOf: 1,
      minimum: 0,
      errorMessage: "Amount must be positive.",
    },
    phoneNumber: {
      type: "string",
      minLength: validationConstants.PHONE_NUMBER_MIN_LENGTH,
      maxLength: validationConstants.PHONE_NUMBER_MAX_LENGTH,
      errorMessage: "Phone number is incorrect.",
    },
    description: {
      type: "string",
      minLength: validationConstants.STRING_MIN_LENGTH,
      maxLength: 1000,
    },
    location: { type: "string" },
    uploadedDocuments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          key: { type: "string" },
          files: {
            type: "array",
            items: {
              type: "object",
              properties: {
                size: { type: "number" },
                type: { type: "string" },
                fileName: { type: "string" },
                originalFileName: { type: "string" },
              },
              required: ["size", "type", "fileName"],
            },
          },
        },
        required: ["key", "files"],
      },
    },
    userId: { type: "string", pattern: UUID_PATTERN },
    paymentPhoneNumber: {
      type: "string",
      minLength: validationConstants.PHONE_NUMBER_MIN_LENGTH,
      maxLength: validationConstants.PHONE_NUMBER_MAX_LENGTH,
    },
    isAdmin: { type: "boolean", enum: enums.BOOLEAN_ENUM },
    serviceId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
    plotNumber: {
      type: "string",
    },
    isDetailExists: { type: "boolean", enum: enums.BOOLEAN_ENUM },
    businessName: {
      type: "string",
      minLength: validationConstants.STRING_MIN_LENGTH,
      maxLength: validationConstants.STRING_MAX_LENGTH,
      transform: enums.TRANSFORM_ENUM,
    },
    businessRegistrationNo: { type: "string" },
    businessId: { 
      type: "string", 
      pattern: UUID_PATTERN,
      nullable: true 
    },
    branchId: { 
      type: "string", 
      pattern: UUID_PATTERN,
      nullable: true 
    },
    subCountyId: { type: "string", pattern: UUID_PATTERN },
    wardId: { type: "string", pattern: UUID_PATTERN },
    street: {
      type: "string",
      nullable: false,
      maxLength: validationConstants.STRING_MAX_LENGTH,
    },
    floorNumber: {
      type: "string",
      nullable: false,
      maxLength: validationConstants.STRING_MAX_LENGTH,
    },
    stallNumber: {
      type: "string",
      nullable: false,
      maxLength: validationConstants.STRING_MAX_LENGTH,
    },
    buildingName: {
      type: "string",
      nullable: true,
      maxLength: validationConstants.STRING_MAX_LENGTH,
    },
    poBox: {
      type: "string",
      nullable: false,
    },
    postalCode: {
      type: "string",
      nullable: false,
      maxLength: validationConstants.POSTAL_CODE_LENGTH,
    },
    period: { type: "string" },
    medicalApplication: {
      type: "array",
      items: {
        type: "object",
        properties: {
          documentNumber: { type: "string" },
          documentType: { type: "string" }
        },
        required: ["documentNumber", "documentType"]
      }
    },
  },
  required: [
    "categoryId",
    "subCategoryId",
    "amount",
    "description",
    "serviceId",
    "wardId",
    "subCountyId"
  ],
  additionalProperties: false,
};

const paramValidation = {
  type: "object",
  properties: {
    id: { type: "string", pattern: UUID_PATTERN },
  },
  required: ["id"],
  additionalProperties: false,
};

const updateLicenseValidation = {
  type: "object",
  properties: {
    paymentStatus: {
      type: "string",
      enum: [
        appConstants.PAYMENT_STATUS.PAID,
        appConstants.PAYMENT_STATUS.FAIL,
        appConstants.PAYMENT_STATUS.NOT_PAID,
        appConstants.PAYMENT_STATUS.PENDING,
        appConstants.PAYMENT_STATUS.CANCELLED,
      ],
    },
    billNo: { type: "string" },
    paymentId: { type: "string", pattern: UUID_PATTERN },
  },
  required: ["paymentStatus"],
  additionalProperties: false,
};

const statusValidation = {
  type: "object",
  properties: {
    status: {
      type: "string",
      enum: [
        appConstants.APPLICATION_STATUS.SUBMITTED,
        appConstants.APPLICATION_STATUS.REJECTED,
        appConstants.APPLICATION_STATUS.IN_PROCESS,
        appConstants.APPLICATION_STATUS.APPROVED,
        appConstants.APPLICATION_STATUS.QUERY_RAISED,
      ],
    },
  },
};

const billRequestValidation = {
  type: "object",
  properties: {
    billType: {
      type: "string",
      minLength: validationConstants.STRING_MIN_LENGTH,
      maxLength: validationConstants.STRING_MAX_LENGTH,
      transform: enums.TRANSFORM_ENUM,
    },
    billAmount: {
      type: "number",
      multipleOf: 1,
    },
    countyId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
    userId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
    permitId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
  },
  required: ["billType", "permitId", "userId", "countyId", "billAmount"],
  additionalProperties: false,
};

const requestInspectionValidation = {
  type: "object",
  properties: {
    license_id: { type: "string", pattern: UUID_PATTERN },
  },
  required: ["license_id"],
  additionalProperties: false,
};

const notificationCountValidation = {
  type: "object",
  properties: {
    county_id: { type: "string", pattern: UUID_PATTERN },
    user_id: { type: "string", pattern: UUID_PATTERN },
    service_id: { type: "string", pattern: UUID_PATTERN },
  },
  required: ["county_id", "user_id", "service_id"],
  additionalProperties: false,
};

const notificationsDataValidation = {
  type: "object",
  properties: {
    county_id: { type: "string", pattern: UUID_PATTERN },
    user_id: { type: "string", pattern: UUID_PATTERN },
    type: {
      type: "string",
      enum: [
        appConstants.NOTIFICATION_TYPE.READ,
        appConstants.NOTIFICATION_TYPE.UNREAD,
      ],
    },
    service_id: { type: "string", pattern: UUID_PATTERN },
  },
  required: ["county_id", "user_id", "service_id"],
  additionalProperties: false,
};

const paginationQueryValidation = {
  type: "object",
  properties: {
    limit: { type: "string" },
    page: { type: "string" },
  },
  additionalProperties: false,
};

const updateNotificationValidation = {
  type: "object",
  properties: {
    is_read: { type: "boolean" },
  },
  additionalProperties: false,
};

const permitIdParamValidation = {
  type: "object",
  properties: {
    permitId: { type: "string", pattern: UUID_PATTERN },
  },
  required: ["permitId"],
  additionalProperties: false,
};

const payBillValidation = {
  type: "object",
  properties: {
    billReference: {
      type: "string",
    },
    userId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
    countyId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
    phoneNumber: {
      type: "string",
      maxLength: validationConstants.PHONE_NUMBER_MAX_LENGTH,
      minLength: validationConstants.PHONE_NUMBER_MIN_LENGTH,
    },
    email: {
      type: "string",
      pattern: EMAIL,
    },
    paymentId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
  },
  required: [
    "paymentId",
    "billReference",
    "phoneNumber",
    "email",
    "userId",
    "countyId",
  ],
  additionalProperties: false,
};

const getNotificationParamValidation = {
  type: "object",
  properties: {
    notificationId: { type: "string", pattern: UUID_PATTERN },
  },
  required: ["notificationId"],
  additionalProperties: false,
};

const updateInspectionRequestBodyValidation = {
  type: "object",
  properties: {
    notificationId: { type: "string", pattern: UUID_PATTERN },
    permitId: { type: "string", pattern: UUID_PATTERN },
    isAccepted: { type: "boolean" },
  },
  required: ["notificationId", "permitId", "isAccepted"],
  additionalProperties: false,
};

const submitInspectionRequestReportBodyValidation = {
  type: "object",
  properties: {
    comments: { type: "string" },
    recommendation: { type: "string" },
    nextVisit: { type: "string" },
    compliance: { type: "boolean" },
    location: { type: "string" },
    uploadedDocuments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          key: { type: "string" },
          files: {
            type: "array",
            items: {
              type: "object",
              properties: {
                size: { type: "number" },
                type: { type: "string" },
                fileName: { type: "string" },
                originalFileName: { type: "string" },
              },
              required: ["size", "type", "fileName"],
            },
          },
        },
        required: ["key", "files"],
      },
    },
  },
  additionalProperties: false,
};

const inspectionListingValidation = {
  type: "object",
  properties: {
    status: { type: "string" },
    service_id: { type: "string", pattern: UUID_PATTERN },
  },
  required: ["status", "service_id"],
  additionalProperties: false,
};

const cancelLicenseQueryValidation = {
  type: "object",
  properties: {
    reason: { type: "string" },
  },
  required: ["reason"],
  additionalProperties: false,
};

const checkLicenseApplication = {
  type: "object",
  properties: {
    categoryId: { type: "string", pattern: UUID_PATTERN },
    subCategoryId: { type: "string", pattern: UUID_PATTERN },
    businessName: {
      type: "string",
      minLength: validationConstants.STRING_MIN_LENGTH,
      maxLength: validationConstants.STRING_MAX_LENGTH,
      transform: enums.TRANSFORM_ENUM,
    },
    businessRegistrationNo: {
      type: "string",
    },
    userId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
    countyId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
    serviceId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
  },
  required: ["categoryId", "subCategoryId", "userId", "countyId"],
  additionalProperties: false,
};

const licenseDetailsValidation = {
  type: "object",
  properties: {
    applicationIds: {
      type: "array",
      items: {
        type: "string",
        pattern: UUID_PATTERN,
      },
    },
  },
};

const payPermitValidation = {
  type: "object",
  properties: {
    email: {
      type: "string",
      pattern: EMAIL,
    },
    phoneNumber: {
      type: "string",
      minLength: validationConstants.PASSWORD_MIN_LENGTH,
      maxLength: validationConstants.PHONE_NUMBER_MAX_LENGTH,
    },
    permitId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
    staffPermitId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
  },
  required: ["phoneNumber", "email", "permitId"],
  additionalProperties: false,
};

const serviceTypeValidation = {
  type: "object",
  properties: {
    serviceType: {
      type: "string",
      enum: [appConstants.SERVICES.MEDICAL_CERTIFICATE],
    },
  },
  additionalProperties: false,
};

const permitCountValidation = {
    type: 'object',
    properties: {
        start_date: { type: 'string'},
        end_date: { type: 'string'},
        user_type: {
            type: 'array',
            items: {
                type: 'string', 
                enum: [appConstants.USER_TYPE.SUPER_ADMIN,appConstants.USER_TYPE.FIELD_AGENT,appConstants.USER_TYPE.CITIZEN],
                errorMessage: {
                    enum: 'Incorrect user type selection'
                }
            },
        },
    },
    additionalProperties: true
};

const licenseDuplicateCheckValidation = {
  type: "object",
  properties: {
    categoryId: {
      type: "string",
      pattern: UUID_PATTERN,
    },
    subCategoryId: { type: "string", pattern: UUID_PATTERN },
    countyId: { type: "string", pattern: UUID_PATTERN },
    userId: { type: "string", pattern: UUID_PATTERN },
    serviceId: { type: "string", pattern: UUID_PATTERN },
    subCountyId: { type: "string", pattern: UUID_PATTERN },
  },
  required: ["serviceId", "categoryId", "subCategoryId", "subCountyId"],
  additionalProperties: false,
};

const verifyPermitValidation = {
  type: "object",
  properties: {
    referenceNumber: { type: "string", pattern: REFERENCE_NUMBER_PATTERN },
  },
  required: ["referenceNumber"],
  additionalProperties: false,
};

module.exports = {
  licenseApplicationValidation,
  paramValidation,
  updateLicenseValidation,
  statusValidation,
  billRequestValidation,
  requestInspectionValidation,
  notificationCountValidation,
  notificationsDataValidation,
  paginationQueryValidation,
  updateNotificationValidation,
  permitIdParamValidation,
  payBillValidation,
  getNotificationParamValidation,
  updateInspectionRequestBodyValidation,
  submitInspectionRequestReportBodyValidation,
  inspectionListingValidation,
  cancelLicenseQueryValidation,
  checkLicenseApplication,
  licenseDetailsValidation,
  payPermitValidation,
  serviceTypeValidation,
  permitCountValidation,
  licenseDuplicateCheckValidation,
  verifyPermitValidation
};

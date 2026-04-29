const appConstants = require("../../../constant/appConstants");
const { UUID_PATTERN } = require("../../../util/regex");

const documentRequestValidation = {
  type: "object",
  properties: {
    type: {
      type: "string",
      enum: [
        appConstants.DOCUMENT_REQUEST_TYPE.REUPLOAD,
        appConstants.DOCUMENT_REQUEST_TYPE.ADDITIONAL,
      ],
    },
    userId: { type: "string", pattern: UUID_PATTERN },
    reason: { type: "string" },
    applicationId: { type: "string", pattern: UUID_PATTERN },
    documentName: { type: "string" },
  },
  required: ["type", "reason", "userId", "applicationId"],
  additionalProperties: false,
  if: {
    properties: {
      type: { const: appConstants.DOCUMENT_REQUEST_TYPE.REUPLOAD },
    },
  },
  then: {
    required: ["documentName"],
  },
};

const uploadDocumentValidation = {
  type: "object",
  properties: {
    userId: { type: "string", pattern: UUID_PATTERN },
    countyId: { type: "string", pattern: UUID_PATTERN },
    uploadedDocuments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          key: { type: "string" },
          requestFileName: { type: "string" },
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
    type: {
      type: "string",
      enum: [
        appConstants.DOCUMENT_REQUEST_TYPE.REUPLOAD,
        appConstants.DOCUMENT_REQUEST_TYPE.ADDITIONAL,
      ],
    },
  },
  required: ["userId", "countyId", "type", "uploadedDocuments"],
  additionalProperties: false,
};

module.exports = {
  documentRequestValidation,
  uploadDocumentValidation,
};

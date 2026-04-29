const appConstants = require("../../../constant/appConstants");
const { updateApplication, getApplication } = require("../../../lib/api");
const errors = require("../../../lib/errors");
const {
  convertKeysToSnakeCase,
  toSentenceCase,
} = require("../../../lib/helper");
const knex = require("../../../lib/knex");
const logger = require("../../../lib/logger");
const { fetchLicenseApplicationStatus } = require("../dbServices/permitDbService");
const promisify = require("../../../lib/async");
const {
  findOneServiceData,
} = require("../../masterDataModule/dbServices/licenseAndPermitsDbServices");
const { updateDocuments } = require("../dbServices/documentDbService");

const updateDocumentRequestService = async (body, condition) => {
  try {
    return await knex("documents")
      .update(body)
      .where(condition)
      .returning("id");
  } catch (e) {
    console.error("Error updating document request: ", e.message);

    throw e;
  }
};

const findDocument = async (body, selectedFields = ["*"]) => {
  return await knex("documents").select(selectedFields).where(body);
};

const updateUploadedDocumentService = async (body, permitId, headers) => {
  const transaction = await promisify(knex.transaction.bind(knex));
  try {
    let updatedDocuments;
    const [permit] = await fetchLicenseApplicationStatus({ id: permitId });
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

    if (permit?.uploaded_documents_id) {
      const uploadedDocuments = await findDocument({
        id: permit.uploaded_documents_id,
      });

      if (!uploadedDocuments) throw errors.NOT_FOUND("Documents not found.");
      if (
        uploadedDocuments &&
        uploadedDocuments.length &&
        uploadedDocuments.some(
          (doc) =>
            !doc.additional_document_request && !doc.reupload_document_request
        )
      ) {
        throw errors.NOT_ALLOWED(
          "No valid request exists to upload additional or re-uploaded documents."
        );
      }

      if (body.type === appConstants.DOCUMENT_REQUEST_TYPE.REUPLOAD) {
        for (const doc of uploadedDocuments) {
          for (const docKey of body.uploadedDocuments) {
            const documentToUpdate = doc.documents.find(
              (file) => file.key === docKey.key
            );

            let updatedDoc;
            if (documentToUpdate) {
              updatedDoc = await updateDocuments(
                {
                  documents: knex.raw(
                    `jsonb_set(documents, '{${doc.documents.indexOf(
                      documentToUpdate
                    )}}', ?::jsonb)`,
                    [JSON.stringify(convertKeysToSnakeCase(docKey))]
                  ),
                },
                { id: uploadedDocuments[0].id },
                transaction
              );
            }
            const isLastReuploadRequest = updatedDoc.every((doc) =>
              doc.documents.every((document) =>
                document.files.every(
                  (file) => file.reupload_request === undefined
                )
              )
            );

            if (isLastReuploadRequest) {
              await updateDocuments(
                { reupload_document_request: false },
                { id: uploadedDocuments[0].id },
                transaction,
                ["id"]
              );
            }
          }
        }
      } else if (body.type === appConstants.DOCUMENT_REQUEST_TYPE.ADDITIONAL) {
        updatedDocuments = uploadedDocuments[0].documents.map((doc) => {
          const matchingDoc = body.uploadedDocuments.find(
            (newDoc) => newDoc.key === doc.key
          );

          if (matchingDoc) {
            return {
              ...doc,
              files: [...doc.files, ...matchingDoc.files],
            };
          }
          return doc;
        });

        let updatedReasons;
        body.uploadedDocuments.forEach((newDoc) => {
          if (!updatedDocuments.some((doc) => doc.key === newDoc.key)) {
            updatedDocuments.push(newDoc);
          }
        });

        const existingReasons = uploadedDocuments[0].additional_reason || [];
        updatedReasons = existingReasons.map((reason) => {
          const matchingDoc = body.uploadedDocuments.find(
            (newDoc) => newDoc.key === reason.key
          );

          if (matchingDoc) {
            return {
              ...reason,
              uploaded: true,
            };
          }
          return reason;
        });

        body.uploadedDocuments.forEach((newDoc) => {
          if (!updatedReasons.some((reason) => reason.key === newDoc.key)) {
            updatedReasons.push({
              key: newDoc.key,
              uploaded: true,
            });
          }
        });

        const allDocumentsUploaded = updatedReasons.every(
          (reason) => reason.uploaded === true
        );

        await updateDocuments(
          {
            documents: JSON.stringify(updatedDocuments),
            additional_reason: JSON.stringify(updatedReasons),
            additional_document_request: !allDocumentsUploaded,
          },
          { id: uploadedDocuments[0].id },
          transaction,
          ["id"]
        );
      }

      await updateApplication(
        {
          applicationId: permit?.application_id,
          documents:
            body.type === appConstants.DOCUMENT_REQUEST_TYPE.REUPLOAD
              ? convertKeysToSnakeCase(body?.uploadedDocuments)
              : convertKeysToSnakeCase(updatedDocuments),
          type: body?.type,
        },
        headers
      );
    }
    transaction.commit();
  } catch (error) {
    transaction.rollback();
    logger.error("Error in uploading the document", error);
    throw error;
  }
};

const documentRequestService = async (req) => {
  try {
    let responseMessage;
    let updateBody;
    const { type, reason, userId, applicationId, documentName } = req.body;

    const [findPermit] = await fetchLicenseApplicationStatus({
      application_id: applicationId,
    });

    if (!findPermit) throw errors.NOT_FOUND("Permit not found.");
    if (
      findPermit &&
      [
        appConstants.APPLICATION_STATUS.SUBMITTED,
        appConstants.APPLICATION_STATUS.APPROVED,
      ].includes(findPermit.application_status)
    )
      throw errors.NOT_ALLOWED(
        "The application has either been submitted or approved and is currently not in the review state."
      );

    const { data: applicationDetails } = await getApplication(
      applicationId,
      req.headers
    );
    console.log("application", applicationDetails);

    const condition = {
      user_id: userId,
      permit_id: findPermit.id,
    };

    const [fetchDocuments] = await findDocument(condition);

    if (!fetchDocuments) throw errors.NOT_FOUND("Documents not found.");

    const [serviceData] = await findOneServiceData({
      id: findPermit.service_id,
    });

    serviceData.name = toSentenceCase(serviceData?.name);
    if (!serviceData)
      throw errors.NOT_FOUND("Selected service does not exists.");

    if (
      fetchDocuments &&
      type === appConstants.DOCUMENT_REQUEST_TYPE.REUPLOAD
    ) {
      let fileExists = false;
      fetchDocuments.documents.forEach((doc) => {
        doc.files.forEach((file) => {
          if (
            file.file_name === documentName ||
            file.fileName === documentName
          ) {
            file.reupload_request = true;
            file.reason = reason;
            fileExists = true;
          }
        });
      });
      if (!fileExists) throw errors.INVALID_INPUT("File does not exist");
    }

    if (type === appConstants.DOCUMENT_REQUEST_TYPE.REUPLOAD) {
      updateBody = {
        reupload_document_request: true,
        documents: JSON.stringify(fetchDocuments.documents),
      };
      responseMessage = `A request for re-upload documents has been sent for your ${serviceData?.name} application number ${applicationDetails?.reference_no}.`;
    } else if (type === appConstants.DOCUMENT_REQUEST_TYPE.ADDITIONAL) {
      const reasonLen = fetchDocuments?.additional_reason || [];
      const nextIndex = reasonLen.length + 1;

      const newReason = {
        key: `reason-${nextIndex}`,
        reason,
      };

      updateBody = {
        additional_document_request: true,
        additional_reason: knex.raw(
          `COALESCE(additional_reason, '[]'::jsonb) || ?::jsonb`,
          JSON.stringify([newReason])
        ),
      };

      responseMessage = `A request for additional documents has been sent for your ${serviceData?.name} application number ${applicationDetails?.reference_no}.`;
    }

    const [updateResult] = await updateDocumentRequestService(
      updateBody,
      condition
    );

    return {
      serviceName: serviceData?.name,
      responseMessage,
      updateResult,
      userId: findPermit?.user_id,
    };
  } catch (error) {
    console.log("Error in genrating document request service", error);
    throw error;
  }
};

module.exports = {
  updateDocumentRequestService,
  findDocument,
  updateUploadedDocumentService,
  documentRequestService,
};

const errors = require("../../../lib/errors");
const { findDocument } = require("../services/uploadDocumentService");

const fetchDocumentList = async (req, res) => {
  const [data] = await findDocument(
    { id: req.params.id },
    [
      "documents.id",
      "documents.user_id",
      "documents.documents",
      "documents.reupload_document_request",
      "documents.additional_document_request",
      "documents.additional_reason as reason",
    ],
    true
  );

  if (data && data.documents && data.documents.length > 0) {
    data.documents.flatMap((doc) => {
      doc.files = doc.files.filter((file) => {
        return file.reupload_request;
      });
      return doc.length > 0 ? doc : [];
    });
  }
  if (!data) throw errors.NOT_FOUND("No document exists.");
  res.send({
    message: "Documents fetched successfully!",
    data: data || [],
  });
};

module.exports = {
  fetchDocumentList,
};

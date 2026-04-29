const {
  updateUploadedDocumentService,
} = require("../services/uploadDocumentService");

const uploadDocumentController = async (req, res) => {
  await updateUploadedDocumentService(req.body, req.params.id, req.headers);

  res.send({
    message: " Documents uploaded successfully!",
  });
};

module.exports = {
  uploadDocumentController,
};

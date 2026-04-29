const { payPermitFeeService } = require("../services/permitService");

const payPermitFeeController = async (req, res) => {
  res.send({
    message: "Permit Fee payment paid successfully.",
    data: await payPermitFeeService(
      req.body,
      req.query,
      req.user.id,
      req.headers
    ),
  });
};

module.exports = {
  payPermitFeeController,
};

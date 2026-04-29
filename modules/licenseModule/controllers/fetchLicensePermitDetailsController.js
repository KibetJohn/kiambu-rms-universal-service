const appConstants = require("../../../constant/appConstants");
const knex = require("../../../lib/knex");
const {
  fetchLicenseApplicationStatus,
} = require("../dbServices/permitDbService");
const { licenseDetailsService } = require("../services/permitService");

const fetchLicensePermitDetailsController = async (req, res) => {
  let licensePermitDetails;
  if (req?.query?.serviceType === appConstants.SERVICES.MEDICAL_CERTIFICATE) {
    [licensePermitDetails] = await fetchLicenseApplicationStatus(null, {
      whereRawCondition: knex.raw(
        "COALESCE(license_permits.application_id,msp.application_id) = ?",
        [req.params.id]
      ),
      medicalStaffJoin: true,
    });
  } else {
    [licensePermitDetails] = await fetchLicenseApplicationStatus({
      "license_permits.application_id": req.params.id,
    });
  }

  res.send({
    message: "Application Details fetched successfully.",
    data: licensePermitDetails,
  });
};

const fetchLicenseDetailsController = async (req, res) => {
  res.send({
    message: "License Application Details fetched successfully.",
    data: await licenseDetailsService(req.body),
  });
};

module.exports = {
  fetchLicensePermitDetailsController,
  fetchLicenseDetailsController,
};

const getActiveMasterDataLicenseAndPermit = require("./licenseAndPermitServices");

const getAllLicenseAndPermit = async (body, selectFields = ["*"], countyId, serviceId = null, whereNotCondition = null, whereNotInCondition = null,whereInCondition = null) => {
  const licensePermitList = await getActiveMasterDataLicenseAndPermit(
    body,
    selectFields,
    countyId,
    serviceId,
    whereNotCondition,
    whereNotInCondition,
    whereInCondition
  );

  return licensePermitList || [];
};

module.exports = { getAllLicenseAndPermit };

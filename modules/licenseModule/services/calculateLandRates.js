const errors = require("../../../lib/errors");
const appConstants = require("../../../constant/appConstants");
const { getParcelDataService } = require("./landRegistryService");
const { getPricingDataByZone } = require("../dbServices/landRegistryDbService");


const CURRENT_YEAR = new Date().getFullYear();

const convertToAcres = (ha) => parseFloat(ha) * 2.47105;
const convertToM2 = (ha) => parseFloat(ha) * 10000;

const calculateAnnualCharge = (parcel, rateRow) => {
  const { landSize, parcelValue, rateUnit, pathCode } = parcel;
  const rate = parseFloat(rateRow.rate);

  if (pathCode === appConstants.PATH_CODES.PATH_A) {
    let landValue;

    if (rateUnit === appConstants.RATE_UNITS.KES_PER_M2) {
      landValue = convertToM2(landSize) * parseFloat(parcelValue);
    } else if (rateUnit === appConstants.RATE_UNITS.KES_PER_ACRE) {
      landValue = convertToAcres(landSize) * parseFloat(parcelValue);
    } 
     else {
      throw errors.INVALID_INPUT(`Unsupported rate unit: ${rateUnit}`);
    }

    return { annualCharge: landValue * rate, landValue };

  } else if (pathCode === appConstants.PATH_CODES.PATH_B) {
    let area;

    if (rateUnit === appConstants.RATE_UNITS.KES_PER_M2) {
      area = convertToM2(landSize);
    } else if (rateUnit === appConstants.RATE_UNITS.KES_PER_ACRE) {
      area = convertToAcres(landSize);
    } else {
      throw errors.INVALID_INPUT(`Unsupported rate unit: ${rateUnit}`);
    }

    const landValue = area * parseFloat(parcelValue);
    return { annualCharge: area * rate, landValue };

  } else {
    throw errors.INVALID_INPUT(`Unsupported path code: ${pathCode}`);
  }
};

const calculateLandRateService = async (req) => {
  const parcel = await getParcelDataService(req);
  if (!parcel) throw errors.NOT_FOUND("Land parcel not found.");

  const { landUseId, landZoneId, year: startYear } = parcel;

  const years = [];
  for (let y = parseInt(startYear); y <= CURRENT_YEAR; y++) {
    years.push(y);
  }

  const rateRows = await Promise.all(
    years.map((y) => {
      if (y === parseInt(startYear)) {
        return Promise.resolve({ rate: parcel.rate });
      }
      return getPricingDataByZone({ zone_id: landZoneId, land_use_id: landUseId, year: y });
    })
  );

  const results = [];
  let landValue = null;

  for (let i = 0; i < years.length; i++) {
    const year = years[i];
    const rateRow = rateRows[i];

    if (!rateRow) {
      results.push({ year, total: null, error: `No pricing data found for year ${year}` });
      continue;
    }

    const { annualCharge, landValue: calculatedLandValue } = calculateAnnualCharge(parcel, rateRow);

    if (!landValue) landValue = calculatedLandValue.toFixed(2);

    results.push({
      year,
      rate: rateRow.rate,
      total: annualCharge.toFixed(2),
    });
  }

  const totalDue = results.reduce((sum, row) => {
    return sum + (row.total ? parseFloat(row.total) : 0);
  }, 0);

  return {
    ...parcel,
    landValue,
    breakdown: results,
    totalDue: totalDue.toFixed(2),
  };
};

module.exports = {
  calculateAnnualCharge,
  calculateLandRateService,
};

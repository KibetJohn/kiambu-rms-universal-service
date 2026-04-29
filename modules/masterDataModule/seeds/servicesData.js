const appConstants = require("../../../constant/appConstants");

exports.servicesData = [
  {
    name: appConstants.SERVICES.LIQUOR,
    is_active: true,
    module: appConstants.SERVICE_MODULE.LICENSE_PERMIT,
  },
  {
    name: appConstants.SERVICES.ADVERTISEMENT,
    is_active: true,
    module: appConstants.SERVICE_MODULE.LICENSE_PERMIT,
  },
  {
    name: appConstants.SERVICES.LAND_AND_PROPERTIES,
    is_active: true,
    module: appConstants.SERVICE_MODULE.LICENSE_PERMIT,
  },
  {
    name: appConstants.SERVICES.OTHER_LICENSE,
    is_active: true,
    module: appConstants.SERVICE_MODULE.LICENSE_PERMIT,
  },
  {
    name: appConstants.SERVICES.LAND_RENT_AND_RATES,
    is_active: true,
    module: appConstants.SERVICE_MODULE.LAND_RENT_AND_RATES,
  },
  {
    name: appConstants.SERVICES.MEDICAL_CERTIFICATE,
    is_active: true,
    module: appConstants.SERVICE_MODULE.PUBLIC_HEALTH,
  },
  {
    name: appConstants.SERVICES.FOOD_HYGIENE,
    is_active: true,
    module: appConstants.SERVICE_MODULE.PUBLIC_HEALTH,
  },
  {
    name: appConstants.SERVICES.OCCUPATIONAL_CERTIFICATE,
    is_active: true,
    module: appConstants.SERVICE_MODULE.PUBLIC_HEALTH,
  },
  {
    name: appConstants.SERVICES.BUILDING_APPROVAL,
    is_active: true,
    module: appConstants.SERVICE_MODULE.LICENSE_PERMIT,
  },
];

const appConstants = require("../../../constant/appConstants");

exports.zonesData = [
  { 
    name: appConstants.LAND_ZONES.HIGH_DENSITY_RESIDENTIAL, 
    code: appConstants.LAND_ZONE_CODES.HIGH_DENSITY_RESIDENTIAL,
    is_active: true 
  },
  { 
    name: appConstants.LAND_ZONES.LOW_DENSITY_RESIDENTIAL, 
    code: appConstants.LAND_ZONE_CODES.LOW_DENSITY_RESIDENTIAL,
    is_active: true 
  },
  { 
    name: appConstants.LAND_ZONES.PERI_URBAN_RESIDENTIAL, 
    code: appConstants.LAND_ZONE_CODES.PERI_URBAN_RESIDENTIAL,
    is_active: true 
  },
  {
    name: appConstants.LAND_ZONES.RURAL_SMALLHOLDER,
    code: appConstants.LAND_ZONE_CODES.RURAL_SMALLHOLDER,
    is_active: true
  },
];

const route = require("../../../lib/route");
const { authenticate } = require("../../../lib/auth");
const validate = require("../../../lib/validate");
const { landZoneQueryValidation, subcountyZoneBodyValidation, getZoneDataQueryValidation, subcountyZoneParamValidation, } = require("../validations/landZoneValidation");
const {
    landZonesController,
    createSubcountyZoneController,
    getSubcountyZoneController,
    updateSubcountyZoneController,
    pathCodesController,
    rateUnitsController,
} = require("../controllers/landZoneController");
const { roleCheck } = require("../../../lib/roleCheckMiddleware");
const appConstants = require("../../../constant/appConstants");

module.exports = [
    route.get(
        "/land-zones",
        [
            authenticate,
            validate(landZoneQueryValidation,"QUERY_STRING"),
        ],
        landZonesController
    ),

    route.get(
        "/rate/path-codes",
        [
            authenticate,
            validate(landZoneQueryValidation, "QUERY_STRING"),
        ],
        pathCodesController
    ),

    route.get(
        "/rate-units",
        [
            authenticate,
            validate(landZoneQueryValidation, "QUERY_STRING"),
        ],
        rateUnitsController
    ),

    route.post(
        "/add/zone-subcounty-data",
        [
            authenticate,
            roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
            validate(subcountyZoneBodyValidation),
        ],
        createSubcountyZoneController
    ),

    route.get(
        "/zone-subcounty-data",
        [
            authenticate,
            roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
            validate(getZoneDataQueryValidation, "QUERY_STRING"),
        ],
        getSubcountyZoneController
    ),

    route.put(
        "/zone-subcounty-data/:id",
        [
            authenticate,
            roleCheck([appConstants.USER_TYPE.SUPER_ADMIN]),
            validate(subcountyZoneParamValidation, "PARAMS"),
            validate(subcountyZoneBodyValidation),
        ],
        updateSubcountyZoneController
    ),
];

const route = require("../../../lib/route");
const { authenticate } = require("../../../lib/auth");
const { servicesController, getServiceByIdController } = require("../controllers/servicesController");
const { servicesQueryValidation, serviceNameParamsValidation } = require("../validations/servicesValidation");
const validate = require("../../../lib/validate");

module.exports = [
  route.get(
    "/services",
    [
      authenticate,
      validate(servicesQueryValidation,"QUERY_STRING"),
    ],
    servicesController
  ),

  // Internal service call
  route.get(
    "/service-list",
    [],
    servicesController
  ),

  route.get(
    "/get-service/:id",
    [authenticate,
      validate(serviceNameParamsValidation, 'PARAMS')
    ],
    getServiceByIdController
  ),
];

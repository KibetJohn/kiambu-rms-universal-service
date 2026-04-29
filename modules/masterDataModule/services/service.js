const knex = require("../../../lib/knex");
const { servicesData } = require("../seeds/servicesData");

const getServices = async (query) => {
  const { isActive = true, module } = query;
  let services = await fetchServices();

  if (!services.length) {
    services = await insertServices(servicesData);
  } else if (services.length > 0) {
    const newServicesData = [];
    const updatedServicesData = [];

    servicesData.forEach((serviceData) => {
      const existingService = services.find(
        (service) => service.name === serviceData.name
      );

      if (existingService) {
        if (
          existingService.is_active !== serviceData.is_active ||
          !existingService.module ||
          existingService.module !== serviceData.module
        ) {
          updatedServicesData.push({
            id: existingService.id,
            is_active: serviceData.is_active,
            module: serviceData.module,
          });
        }
      } else {
        newServicesData.push(serviceData);
      }
    });

    if (updatedServicesData.length > 0) {
      await Promise.all(
        updatedServicesData.map((service) => {
          return updateServices(
            { is_active: service.is_active, module: service.module },
            { id: service.id }
          );
        })
      );
    }

    if (newServicesData.length > 0) {
      await insertServices(newServicesData);
    }
  }
  const serviceCondition = {
    is_active: isActive,
  };
  if (module) {
    serviceCondition.module = module;
  }
  services = await fetchServices(serviceCondition);

  return services;
};

const fetchServices = async (condition, select = ["*"]) => {
  const serviceQuery = knex("services").select(select);
  if (typeof condition === "function") {
    condition(serviceQuery);
  } else if (condition) {
    serviceQuery.where(condition);
  }
  return await serviceQuery;
};

const insertServices = async (body, select = ["*"]) => {
  return await knex("services").insert(body).returning(select);
};

const updateServices = async (body, condition) => {
  return await knex("services").update(body).where(condition).returning("*");
};

module.exports = {
  fetchServices,
  insertServices,
  getServices,
};

const knex = require("../../../lib/knex");
const { landUseTypesData } = require("../seeds/landUseTypesData");

const getLandUseTypes = async (query) => {
  const { status = true, serviceId } = query;

  let landUseTypes = await fetchLandUseTypesFromDb();

  if (!landUseTypes.length) {
    landUseTypes = await insertLandUseTypes(landUseTypesData);
  } else {
    const newLandUseTypesData = [];
    const updatedLandUseTypesData = [];

    landUseTypesData.forEach((landUseTypeData) => {
      const existing = landUseTypes.find(
        (landUseType) => landUseType.name === landUseTypeData.name
      );

      if (existing) {
        if (existing.status !== landUseTypeData.status) {
          updatedLandUseTypesData.push({
            id: existing.id,
            status: landUseTypeData.status,
          });
        }
      } else {
        newLandUseTypesData.push(landUseTypeData);
      }
    });

    if (updatedLandUseTypesData.length > 0) {
      await Promise.all(
        updatedLandUseTypesData.map((landUseType) => {
          return updateLandUseType(
            { status: landUseType.status },
            { id: landUseType.id }
          );
        })
      );
    }

    if (newLandUseTypesData.length > 0) {
      await insertLandUseTypes(newLandUseTypesData);
    }
  }

  const condition = { status };
  if (serviceId) condition.service_id = serviceId;

  return await fetchLandUseTypesFromDb(condition);
};

const fetchLandUseTypesFromDb = async (condition, select = ["*"]) => {
  const query = knex("land_use_types").select(select);
  if (typeof condition === "function") {
    condition(query);
  } else if (condition) {
    query.where(condition);
  }
  return await query;
};

const insertLandUseTypes = async (body, select = ["*"]) => {
  return await knex("land_use_types").insert(body).returning(select);
};

const updateLandUseType = async (body, condition) => {
  return await knex("land_use_types").update(body).where(condition).returning("*");
};

module.exports = {
  fetchLandUseTypesFromDb,
  insertLandUseTypes,
  getLandUseTypes,
  updateLandUseType,
};
const knex = require("../../../lib/knex");
const { pathCodeData } = require("../seeds/pathCodeData");

const getPathCodes = async (query = {}) => {
  const { isActive = "true" } = query;
  let pathCodes = await fetchPathCodes();

  if (!pathCodes.length) {
    pathCodes = await insertPathCodes(pathCodeData);
  } else {
    const newPathCodesData = [];
    const updatedPathCodesData = [];

    pathCodeData.forEach((pathCode) => {
      const existing = pathCodes.find((p) => p.code === pathCode.code);

      if (existing) {
        if (
          existing.is_active !== pathCode.is_active ||
          existing.name !== pathCode.name
        ) {
          updatedPathCodesData.push({
            id: existing.id,
            is_active: pathCode.is_active,
            name: pathCode.name,
          });
        }
      } else {
        newPathCodesData.push(pathCode);
      }
    });

    if (updatedPathCodesData.length > 0) {
      await Promise.all(
        updatedPathCodesData.map((pathCode) =>
          updatePathCodes(
            { is_active: pathCode.is_active, name: pathCode.name },
            { id: pathCode.id }
          )
        )
      );
    }

    if (newPathCodesData.length > 0) {
      await insertPathCodes(newPathCodesData);
    }
  }

  return await fetchPathCodes({ is_active: isActive });
};

const fetchPathCodes = async (condition, select = ["*"]) => {
  const query = knex("path_codes").select(select);
  if (condition) query.where(condition);
  return await query;
};

const insertPathCodes = async (body, select = ["*"]) => {
  return await knex("path_codes").insert(body).returning(select);
};

const updatePathCodes = async (body, condition) => {
  return await knex("path_codes").update(body).where(condition).returning("*");
};

module.exports = {
    fetchPathCodes,
    insertPathCodes,
    updatePathCodes,
    getPathCodes,
};
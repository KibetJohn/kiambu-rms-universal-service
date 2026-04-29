const { errorConstants } = require("../../../constant/errorConstants");
const errors = require("../../../lib/errors");
const knex = require("../../../lib/knex");
const logger = require("../../../lib/logger");

const findAllLicenseAndPermits = async (
  condition = {},
  select_fields = ["*"]
) => {
  const query = knex("permit_master_data").select(select_fields);
  if (condition) {
    query.where(condition);
  }
  query.orderBy("permit_master_data.created_at", "desc");
  return await query;
};

const checkCategoryAndSubCategoryUnique = async (condition, transaction) => {
  try {
    const { county_id, category, sub_category, service_id } = condition;
    const [categoryData] = await findExistingCategory({
      county_id,
      name: category,
      service_id,
    },
    null,
    transaction);
    let categoryId = "";
    if (!categoryData) {
      [categoryId] = await insertCategory(
        { county_id, name: category, service_id },
        transaction
      );
    } else {
      categoryId = categoryData?.id;
    }

    const [subCategoryData] = await findExistingSubCategory({
      category_id: categoryId,
      name: sub_category,
    },
    null,
    transaction);

    let subCategoryId = "";

    if (!subCategoryData) {
      [subCategoryId] = await insertSubCategory(
        {
          category_id: categoryId,
          name: sub_category,
        },
        transaction
      );
    } else {
      throw errors.ALREADY_EXISTS(errorConstants.ALREADY_EXISTS);
    }

    return {
      categoryId,
      subCategoryId,
    };
  } catch (error) {
    logger.error(
      `Error in check category and sub category: ${error?.message}`,
      {
        error,
      }
    );
    throw error;
  }
};

const findExistingCategory = async (condition, notCondition,transaction) => {
  let query;
  if(transaction){
    query = transaction("category").select("id", "name").where(condition);
  }else{
    query = knex("category").select("id", "name").where(condition);
  }
  if (notCondition) {
    query.whereNot(notCondition);
  }
  return await query;
};

const findExistingSubCategory = async (condition, notCondition,transaction) => {
  let query;
  if(transaction){
    query = transaction("sub_category").select("id", "name").where(condition);
  }else{
    query = knex("sub_category").select("id", "name").where(condition);
  }
  if (notCondition) {
    query.whereNot(notCondition);
  }

  return await query;
};

const insertCategory = async (body, transaction) => {
  if (transaction) {
    return await transaction("category").insert(body).returning("id");
  } else {
    return await knex("category").insert(body).returning("id");
  }
};

const insertSubCategory = async (body, transaction) => {
  if (transaction)
    return await transaction("sub_category").insert(body).returning("id");
  else return await knex("sub_category").insert(body).returning("id");
};

const updateCategory = async (body, condition, transaction) => {
  if (transaction) {
    return await transaction("category")
      .update({ ...body, updated_at: new Date() })
      .where(condition)
      .returning("*");
  } else {
    return await knex("category")
      .update({ ...body, updated_at: new Date() })
      .where(condition)
      .returning("*");
  }
};

const updateSubCategory = async (body, condition, transaction) => {
  if (transaction) {
    return await transaction("sub_category")
      .update({ ...body, updated_at: new Date() })
      .where(condition)
      .returning("*");
  } else {
    return await knex("sub_category")
      .update({ ...body, updated_at: new Date() })
      .where(condition)
      .returning("*");
  }
};

const checkAndUpdateCategory = async (body, transaction) => {
  const { category, county_id, category_id, service_id } = body;

  let categoryData;
  [categoryData] = await findExistingCategory({
    county_id,
    id: category_id,
    service_id,
  });

  const [existingCategory] = await findExistingCategory({
    county_id,
    name: category,
    service_id,
  });
  
  if (existingCategory?.name == body?.category) {
    categoryData = existingCategory;
  } else if (categoryData?.name != body?.category) {
    [categoryData] = await updateCategory(
      { name: category },
      { id: categoryData.id },
      transaction
    );
  }
  return categoryData;
};

const checkAndUpdateSubCategory = async (body, transaction) => {
  const { sub_category, category_id, sub_category_id } = body;

  let subCategoryData;
  [subCategoryData] = await findExistingSubCategory({
    category_id,
    id: sub_category_id,
  });

  const existingSubCategory = await findExistingSubCategory({
    category_id,
    name: sub_category,
  });

  if (existingSubCategory.name == body?.sub_category) {
    [subCategoryData] = existingSubCategory;
  } else if (subCategoryData.name != body?.sub_category) {
    [subCategoryData] = await updateSubCategory(
      { name: sub_category },
      { id: sub_category_id },
      transaction
    );
  }
  return subCategoryData;
};

const findOneServiceData = async (condition, notCondition) => {
  const query = knex("services").select("id", "name").where(condition);

  if (notCondition) {
    query.whereNot(notCondition);
  }

  return await query;
};

const findExistingPathCode = async (condition, notCondition,transaction) => {
  let query;
  if(transaction){
    query = transaction("path_codes").select("id", "name").where(condition);
  }else{
    query = knex("path_codes").select("id", "name").where(condition);
  }
  if (notCondition) {
    query.whereNot(notCondition);
  }
  return await query;
};

const findExistingZones = async (condition, notCondition,transaction) => {
  let query;
  if(transaction){
    query = transaction("land_zones").select("id", "code", "name").where(condition);
  }else{
    query = knex("land_zones").select("id", "code", "name").where(condition);
  }
  if (notCondition) {
    query.whereNot(notCondition);
  }
  return await query;
};

module.exports = {
  findAllLicenseAndPermits,
  checkCategoryAndSubCategoryUnique,
  insertSubCategory,
  insertCategory,
  findExistingSubCategory,
  findExistingCategory,
  checkAndUpdateCategory,
  checkAndUpdateSubCategory,
  findOneServiceData,
  findExistingPathCode,
  findExistingZones,
};

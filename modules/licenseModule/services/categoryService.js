const logger = require("../../../lib/logger");
const knex = require("../../../lib/knex");

const getCategoryListing = async (condition, search) => {
  try {
    const query = knex("category").select("id", "name").where(condition);

    if (search) {
      query.andWhere("name", "like", `%${search}%`);
    }

    return await query;
  } catch (error) {
    logger.error(`Error in getCategoryListing: ${error?.message}`, {
      error,
    });
    throw new Error("Failed to fetch category");
  }
};

const getSubCategoryListing = async (condition, search) => {
  try {
    const query = knex("sub_category as sc")
      .select(
        "sc.id",
        "sc.name",
        "permit_master_data.amount",
        "permit_master_data.application_fee",
        "permit_master_data.board_approval",
        "permit_master_data.public_participation"
      )
      .leftJoin(
        "permit_master_data",
        "permit_master_data.sub_category_id",
        "sc.id"
      )
      .where(condition);

    if (search) {
      query.andWhere("sc.name", "like", `%${search}%`);
    }

    return await query;
  } catch (error) {
    logger.error(`Error in sub category listing: ${error?.message}`, {
      error,
    });
    throw new Error("Failed to fetch sub category");
  }
};

const fetchMasterData = async (condition, queryParams = {}) => {
  try {
    const { whereIncondition } = queryParams;
    const query = knex("permit_master_data").select("*");
    if (condition) {
      query.where(condition);
    }
    if (whereIncondition) {
      query.whereIn(whereIncondition);
    }
    return await query;
  } catch (error) {
    console.error(`Failed to fetch master, ${error?.message}`);
    throw error;
  }
};

const getSubCategoriesByCategory = async (query) => {
  try {
    const { county_id, search, service_id, category } = query;
    const [categoryData] = await getCategoryListing({ 'name': category, county_id, service_id });

    if (!categoryData?.id) {
      return [];
    }

    const list = knex("sub_category as sc")
      .select(
        "sc.id",
        "sc.name",
      )
      .leftJoin(
        "permit_master_data",
        "permit_master_data.sub_category_id",
        "sc.id"
      )
      .where('sc.category_id', categoryData?.id);

    if (search) {
      list.andWhere("sc.name", "ilike", `%${search}%`);
    }

    return await list;
  } catch (error) {
    logger.error(`Error in getSubCategoriesByCategory: ${error?.message}`, {
      error,
    });
    throw new Error("Failed to fetch sub categories");
  }
};

const multiSubCategoryListingService = async (condition, search) => {
  try {
    const query = knex("sub_category as sc")
      .select(
        "sc.id",
        "sc.name",
        "permit_master_data.amount",
        "permit_master_data.application_fee",
        "permit_master_data.board_approval",
        "permit_master_data.public_participation"
      )
      .leftJoin(
        "permit_master_data",
        "permit_master_data.sub_category_id",
        "sc.id"
      );

    if (condition.category_ids?.length) {
      query.whereIn("sc.category_id", condition.category_ids);
    }

    if (condition.service_id) {
      query.andWhere(
        "permit_master_data.service_id",
        condition.service_id
      );
    }

    if (search) {
      query.andWhere("sc.name", "like", `%${search}%`);
    }

    return await query;
  } catch (error) {
    logger.error(`Error in sub category listing: ${error?.message}`, {
      error,
    });
    throw new Error("Failed to fetch sub category");
  }
};

module.exports = {
  getCategoryListing,
  getSubCategoryListing,
  fetchMasterData,
  getSubCategoriesByCategory,
  multiSubCategoryListingService
};

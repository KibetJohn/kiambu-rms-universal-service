const { successConstants } = require("../../../constant/successConstants");
const { getSubCategoryListing, getSubCategoriesByCategory, multiSubCategoryListingService } = require("../services/categoryService");
const logger = require("@lib/logger");

const getSubCategoryListingController = async (req, res) => {
  try {
    const { category_id, search, service_id } = req.query;
    const listingData = await getSubCategoryListing(
      {
        "sc.category_id": category_id,
        "permit_master_data.service_id": service_id,
      },
      search
    );

    // success response
    res.send({
      success: true,
      message: successConstants.SUCCESS,
      list: listingData,
    });
  } catch (error) {
    logger.error(
      `Error in getSubCategoryListingController: ${error?.message}`,
      {
        error,
      }
    );
    throw error;
  }
};

const getSubCategoryController = async (req, res) => {
  try {
    const listingData = await getSubCategoriesByCategory(req.query);

    // success response
    res.send({
      success: true,
      message: successConstants.SUCCESS,
      listingData: listingData,
    });
  } catch (error) {
    logger.error(`Error in getSubCategoryController: ${error?.message}`, {
      error,
    });
    throw error;
  }
};

const multiSubCategoryListingController = async (req, res) => {
  try {
    const { category_ids, search, service_id } = req.body;

    const listingData = await multiSubCategoryListingService(
      {
        category_ids,
        service_id,
      },
      search
    );

    res.send({
      success: true,
      message: successConstants.SUCCESS,
      list: listingData,
    });
  } catch (error) {
    logger.error(
      `Error in getSubCategoryListingController: ${error?.message}`,
      { error }
    );
    throw error;
  }
};

module.exports = {
  getSubCategoryListingController,
  getSubCategoryController,
  multiSubCategoryListingController
};

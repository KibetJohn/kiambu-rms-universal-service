const { successConstants } = require("../../../constant/successConstants");
const {
  getCategoryListing,
  fetchMasterData,
} = require("../services/categoryService");
const logger = require("@lib/logger");

const getCategoryListingController = async (req, res) => {
  try {
    const county_id = req.query.county_id;
    const search = req.query.search;
    const service_id = req.query.service_id;

    let listingData = await getCategoryListing(
      {
        county_id,
      },
      search
    );

    const categoryIds = listingData.map((list) => list.id);
    const masterData = await fetchMasterData(
      { county_id, service_id },
      { category_id: categoryIds }
    );

    const data = listingData.filter((list) =>
      masterData.some(
        (data) => list.id === data.category_id && data.service_id === service_id
      )
    );

    res.send({
      message: successConstants.SUCCESS,
      data,
    });
  } catch (error) {
    logger.error(`Error in getCategoryListingController: ${error?.message}`, {
      error,
    });
    throw error;
  }
};

module.exports = {
  getCategoryListingController,
};

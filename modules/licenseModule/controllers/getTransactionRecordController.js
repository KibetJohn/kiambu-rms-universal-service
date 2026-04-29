const logger = require("@lib/logger");
const { licenseListFromIds } = require("../services/licensePermitDetailsService");

const getLicenseListFromIdsController = async (req, res) => {
    try {
        const list = await licenseListFromIds(req.body);

        res.send({
            success: true,
            list
        });
    } catch (error) {
        logger.error(
            `Error in getLicenseListFromIdsController controller: ${error?.message}`,
            {
                error,
            }
        );
        throw error;
    }
};

module.exports = {
    getLicenseListFromIdsController
};
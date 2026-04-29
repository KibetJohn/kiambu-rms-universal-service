const logger = require("@lib/logger");
const { pricingExportService } = require("../services/pricingService");
const { Readable } = require("stream");
const { Parser } = require("json2csv");

const exportLandRentPricingMasterDataController = async (req, res) => {
    try {
        const data = await pricingExportService(req.query);

        if (!data || data.length === 0) {
            throw new Error("No data found to export");
        }

        if (data && data.length > 0) {
            const json2csvParser = new Parser();
            const csvData = json2csvParser.parse(data);

            const readable = new Readable();
            readable._read = () => { };
            readable.push(csvData);
            readable.push(null);

            res.setHeader(
                "Content-disposition",
                "attachment; filename=Land_Rent_and_Rates_pricing_data.csv"
            );
            res.setHeader("Content-type", "text/csv; charset=utf-8");


            return res.send(csvData);
        }

        res.send({
            success: true,
            message: "Data exported successfully!",
        });
    } catch (error) {
        logger.error(`Error in exportLandRentPricingMasterDataController: ${error?.message}`, {
            error,
        });
        throw error;
    }
};

module.exports = {
    exportLandRentPricingMasterDataController
};
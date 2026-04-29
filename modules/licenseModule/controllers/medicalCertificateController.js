const { fetchServices } = require("../../masterDataModule/services/service");
const { errorConstants } = require("../../../constant/errorConstants");
const errors = require("../../../lib/errors");
const {
  addMedicalCertificateService, medicalPermitDuplicateCheckService
} = require("../services/addMedicalCertificateService");
const logger = require("../../../lib/logger");
const {
  medicalPermitDetailService,
} = require("../dbServices/medicalStaffDbService");

const addMedicalCertificateController = async (req, res) => {
  try {
    if (!req.body?.applicationForStaff) {
      req.body.medicalApplication.forEach((application) => {
        if (application.staffName) {
          throw errors.INVALID_INPUT(
            "Staff name should not be provided for personal application."
          );
        }
      });
    }

    const [service] = await fetchServices({ id: req.body?.serviceId }, [
      "id",
      "name",
    ]);
    if (!service) {
      throw errors.NOT_FOUND(errorConstants.SERVICE_NOT_FOUND);
    }

    res.send({
      message: "Application Submitted Successfully!",
      data: await addMedicalCertificateService(
        req,
        req.body?.applicationForStaff,
        service
      ),
    });
  } catch (error) {
    logger.error(`Error in adding data: ${error?.message}`, { error });
    throw error;
  }
};

const medicalPermitDetailController = async (req, res) => {
  try {
    const data = await medicalPermitDetailService(
      { "lp.id": req.params.id },
      req.headers
    );
    res.send({
      success: true,
      message: "Medical Permit details fetched successfully",
      ...data,
    });
  } catch (error) {
    logger.error(
      `Error in fetching medical permit details: ${error?.message}`,
      {
        error,
      }
    );
    throw error;
  }
};

const medicalInternalPermitDetailController = async (req, res) => {
  try {
    const data = await medicalPermitDetailService(req.params.id, null, true);
    res.send({
      success: true,
      message: "Medical Permit details fetched successfully",
      ...data,
    });
  } catch (error) {
    logger.error(
      `Error in fetching medical permit details: ${error?.message}`,
      {
        error,
      }
    );
    throw error;
  }
};

const medicalPermitDuplicateCheckController = async (req, res) => {
  try {
    const permit = await medicalPermitDuplicateCheckService(req);

    if (permit) {
      return res.status(200).send({
        success: true,
        data: {
          exists: true,
          message: 'Application for this category and sub-category already exists.',
        },
      });
    }

    return res.status(200).send({
      success: true,
      data: {
        exists: false,
      },
    });
  } catch (error) {
    logger.error(
      `Error in medicalPermitDuplicateCheckController: ${error?.message}`,
      { error }
    );
    throw error;
  }
};

module.exports = {
  addMedicalCertificateController,
  medicalPermitDetailController,
  medicalInternalPermitDetailController,
  medicalPermitDuplicateCheckController,
};

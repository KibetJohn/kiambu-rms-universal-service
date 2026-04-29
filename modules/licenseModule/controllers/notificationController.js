const logger = require("@lib/logger");
const {
  getNotificationCountService,
  getNotificationsDataService,
} = require("../services/notifyService");
const {
  updateNotification,
  getNotificationDetails
} = require("../services/notificationService");

const getNotificationCountController = async (req, res) => {
  try {
    const data = await getNotificationCountService(req);

    res.send({
      success: true,
      message: "Notification count fetched successfully!",
      totalCount: data?.totalcount || 0
    });
  } catch (error) {
    logger.error(`Error in getNotificationCountController: ${error?.message}`, {
      error,
    });
    throw error;
  }
};

const getNotificationDataController = async (req, res) => {
  try {
    res.send({
      success: true,
      message: "Notifications fetched successfully!",
      ...await getNotificationsDataService(req)
    });
  } catch (error) {
    logger.error(`Error in getNotificationDataController: ${error?.message}`, {
      error,
    });
    throw error;
  }
};

const updateNotificationController = async (req, res) => {
  try {
    const { is_read } = req.body;
    const { id } = req.params;

    res.send({
      success: true,
      message: "Notifications updated successfully!",
      ...await updateNotification({is_read}, {id})
    });
  } catch (error) {
    logger.error(`Error in updateNotificationController: ${error?.message}`, {
      error,
    });
    throw error;
  }
};

const getNotificationDetailsController = async (req, res) => {
  try {
    const { permitId } = req.params;
    const { isEnforcer } = req.query;
    const userId = req.user.id;
    const data = await getNotificationDetails(permitId, userId, isEnforcer);

    res.send({
      success: true,
      message: "Inspection history fetched successfully!",
      data
    });
  } catch (error) {
    logger.error(`Error in getNotificationDetailsController: ${error?.message}`, {
      error,
    });
    throw error;
  }
};

module.exports = {
  getNotificationCountController,
  getNotificationDataController,
  updateNotificationController,
  getNotificationDetailsController
};

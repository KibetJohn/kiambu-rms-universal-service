const appConstants = require("../../../constant/appConstants");
const { getUserInformation, getUserInfo } = require("../../../lib/api");
const logger = require("@lib/logger");
const knex = require("../../../lib/knex");
const errors = require("../../../lib/errors");
const { errorConstants } = require("../../../constant/errorConstants");

const createNotification = async (body, transaction) => {
    try {
        if (transaction) {
            const [notificationId] = await transaction("notification")
                .insert(body)
                .returning("id");
            const { data } = await getUserInfo({
                type: appConstants.USER_TYPE.FIELD_AGENT,
                isList: true,
            });

            const userNotifications = data.map((user) => ({
                user_id: user.id,
                notification_id: notificationId,
            }));
            return await transaction("user_notification").insert(userNotifications);
        } else {
            const [notificationId] = await knex("notification")
                .insert(body)
                .returning("id");
            const { data } = await getUserInfo({
                type: appConstants.USER_TYPE.FIELD_AGENT,
                isList: true,
            });
            const userNotifications = data.map((user) => ({
                user_id: user.id,
                notification_id: notificationId,
            }));
            return await transaction("user_notification").insert(userNotifications);
        }
    } catch (error) {
        logger.error("Error createNotification service", error);
        throw error;
    }
};

const updateNotification = async (body, condition, transaction) => {
    try {
        if (transaction)
            return await transaction("notification").update(body).where(condition);
        else return await knex("notification").update(body).where(condition);
    } catch (error) {
        logger.error("Error updateNotification service", error);
        throw error;
    }
};

const updateUserNotification = async (body, condition, transaction) => {
    try {
        if (transaction)
            return await transaction("user_notification")
                .update(body)
                .where(condition);
        else return await knex("user_notification").update(body).where(condition);
    } catch (error) {
        logger.error("Error updateNotification service", error);
        throw error;
    }
};


const findOneNotification = async (condition) => {
    try {
        return await knex("notification").select("id").where(condition);
    } catch (error) {
        logger.error("Error requestInspectionService service", error);
        throw error;
    }
};

const getNotificationDetails = async (permitId, userId, isEnforcer) => {
    try {
        let data = null;

        if (isEnforcer) {
            const [notification] = await findOneNotification({ permit_id: permitId });

            if (!notification) {
                throw errors.NOT_FOUND(errorConstants.NOTIFICATION_NOT_EXIST);
            }

            // Mark notification as read
            await updateUserNotification(
                { is_read: true, updated_at: new Date() },
                { notification_id: notification.id, user_id: userId }
            );

            // Fetch notification details
            const [notificationData] = await knex("notification as not")
                .select(
                    "not.id as notificationId",
                    "not.permit_id as permitId",
                    "not.created_at as assignedOn",
                    "category.name as type",
                    "license_permits.reference_number as referenceNumber",
                    "license_permits.user_id as userId",
                    "license_permits.accepted_by as acceptedBy",
                    "license_permits.inspection_requested_by as assignedById",
                    "user_notification.is_rejected as isRejected"
                )
                .leftJoin("license_permits", "license_permits.id", "not.permit_id")
                .leftJoin(
                    "user_notification",
                    "user_notification.notification_id",
                    "not.id"
                )
                .leftJoin(
                    "permit_master_data",
                    "permit_master_data.id",
                    "license_permits.permit_master_id"
                )
                .leftJoin("category", "category.id", "permit_master_data.category_id")
                .where({ "not.id": notification.id })
                .andWhere({ "user_notification.user_id": userId });

            if (notificationData) {
                notificationData.isInspectionAcceptedByEnforcer =
                    notificationData.acceptedBy === userId;
                notificationData.isInspectionAccepted = Boolean(
                    notificationData.acceptedBy
                );

                if (notificationData.userId) {
                    const userData = await getUserInformation(notificationData.userId);
                    const { first_name, last_name, mobile_no, email } = userData.data;
                    notificationData.userName = `${first_name} ${last_name}`;
                    notificationData.phoneNumber = mobile_no;
                    notificationData.email = email;
                }

                if (notificationData.assignedById) {
                    const assignedByData = await getUserInformation(
                        notificationData.assignedById
                    );
                    const { first_name, last_name } = assignedByData.data;
                    notificationData.assignedBy = `${first_name} ${last_name}`;
                }

                data = notificationData;
            }
        }

        const inspectionHistory = await getLicenseInspectionHistory({
            permit_id: permitId,
        });
        if (inspectionHistory?.length > 0) {
            for (const data of inspectionHistory) {
                const [documentDetails] = await findDocument({
                    id: data?.document_id,
                    inspection_documents: true,
                });
                data.uploadedDocuments = documentDetails?.documents;
            }
        }

        return {
            ...data,
            inspectionHistory,
        };
    } catch (error) {
        logger.error("Error in getNotificationDetails service", error);
        throw error;
    }
};

const getLicenseInspectionHistory = async (condition) => {
    try {
        const data = await knex("inspection_history")
            .select(
                "id",
                "created_at as inspectedOn",
                "compliance",
                "comments",
                "recommendation",
                "status",
                "location",
                "next_visit",
                "document_id"
            )
            .where(condition);

        return data;
    } catch (error) {
        logger.error("Error getLicenseInspectionHistory service", error);
        throw error;
    }
};

const findDocument = async (body, selectedFields = ["*"]) => {
    return await knex("documents").select(selectedFields).where(body);
};

module.exports = {
    createNotification,
    findOneNotification,
    updateNotification,
    getNotificationDetails,
    updateUserNotification,
};
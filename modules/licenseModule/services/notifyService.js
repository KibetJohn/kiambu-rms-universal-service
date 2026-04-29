const appConstants = require("../../../constant/appConstants");
const { getUserInformation } = require("../../../lib/api");
const { sendNotification } = require("../../../lib/rabbitMq");
const logger = require("@lib/logger");
const knex = require("../../../lib/knex");

const notifySevice = async (reqBody) => {
  const { user_id, subject, message } = reqBody;

  const { data: userInformation } = await getUserInformation(user_id);

  const { mobile_no, email } = userInformation;

  // send message to mobile with the help of rabbitMQ
  if (mobile_no) {
    sendNotification(
      JSON.stringify({
        to: mobile_no,
        body: message,
      }),
      appConstants.QUEUE.PDSL_NOTIFICATION_QUEUE
    );
  }

  // send email to mobile with the help of rabbitMQ
  if (email) {
    sendNotification(
      JSON.stringify({
        via: "email",
        to: email,
        template_id: appConstants.TEMPLATE_ID.DOCUMENT_REQUEST_TEMPLATE_ID,
        dynamic_template_data: {
          body: message,
          subject: subject,
        },
      }),
      appConstants.QUEUE.PDSL_NOTIFICATION_QUEUE
    );
  }
};

const getNotificationsDataService = async (req) => {
  try {
    const { county_id, user_id, type, service_id } = req.body;

    let { limit, page } = req.query;

    limit = parseInt(limit);
    page = parseInt(page);

    limit = limit > appConstants.PAGE.LIMIT ? appConstants.PAGE.LIMIT : limit;
    page = limit * (page - 1);

    const dbQuery = knex("notification as not")
      .select(
        "not.id as notificationId",
        "not.message",
        "not.permit_id as permitId",
        "not.assigned_by as assignedBy",
        "user_notification.is_read as isRead",
        "user_notification.is_rejected as isRejected",
        knex.raw("COUNT(*) OVER() as totalRecords")
      )
      .leftJoin(
        "user_notification",
        "user_notification.notification_id",
        "not.id"
      )
      .where({
        "not.county_id": county_id,
        "not.service_id": service_id,
        "user_notification.user_id": user_id,
      })
      .andWhere((builder) =>
        builder
          .where("not.notify_user_id", user_id)
          .orWhereNull("not.notify_user_id")
      );

    // Add condition based on the `type`
    if (type === "READ") {
      dbQuery.andWhere("user_notification.is_read", true);
    } else if (type === "UNREAD") {
      dbQuery.andWhere("user_notification.is_read", false);
    }

    const data = await dbQuery
      .limit(limit)
      .offset(page)
      .orderBy("not.created_at", "DESC");

    const totalRecords = data[0]?.totalrecords || 0;
    data.forEach((item) => delete item.totalrecords);

    return {
      data,
      totalPages: Math.ceil(totalRecords / limit),
      totalCount: totalRecords,
    };
  } catch (error) {
    logger.error("Error getNotificationsDataService service", error);
    throw error;
  }
};

const getNotificationCountService = async (req) => {
  try {
    const { county_id, user_id, service_id } = req.query;

    const [data] = await knex("notification as not")
      .join("user_notification", "not.id", "user_notification.notification_id")
      .select(knex.raw("COUNT(*) OVER() as totalCount"))
      .where("not.county_id", county_id)
      .andWhere("user_notification.user_id", user_id)
      .andWhere("user_notification.is_read", false)
      .andWhere("not.service_id", service_id)
      .andWhere((builder) =>
        builder
          .where("not.notify_user_id", user_id)
          .orWhereNull("not.notify_user_id")
      );

    return data;
  } catch (error) {
    logger.error("Error getNotificationCountService service", error);
    throw error;
  }
};

module.exports = {
  notifySevice,
  getNotificationCountService,
  getNotificationsDataService,
};

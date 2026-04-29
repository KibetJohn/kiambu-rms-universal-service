const cron = require("node-cron");
const { licenseStatusChangeUpdate } = require("../services/permitService");
const { staffPermitStatusUpdateService } = require("../dbServices/medicalStaffDbService");

/**
 * scheduler to change the license status
 * runs every day at 12:02 (0 2 0 * * *)
 * pervious license if reached its expiry will get expired.
 */
const licenseStatusScheduler = cron.schedule("0 2 0 * * *", async () => {
  console.log("Land Rent and Rates status update cron job started...");
  await licenseStatusChangeUpdate();
  console.log("Land Rent and Rates status update cron job finished.");
});

const staffPermitScheduler = cron.schedule("0 2 0 * * *", async () => {
  console.log("Staff Permit Cron started...");
  await staffPermitStatusUpdateService();
  console.log("Staff Permit Cron job finished.");
});

module.exports = {
  licenseStatusScheduler,
  staffPermitScheduler
};
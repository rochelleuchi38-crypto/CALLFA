// scheduler/notification-scheduler.js
// Periodically generates due-date notifications for unpaid loans and machinery bookings

const { generateDueDateNotifications } = require('../routes/notifications');

let intervalId = null;

/**
 * Start the notification scheduler
 * - Runs immediately on startup
 * - Then runs every 6 hours to catch new records and date changes
 */
function startNotificationScheduler() {
  console.log('⏰ Starting due-date notification scheduler...');

  // Run immediately on startup (with a small delay to let DB connect)
  setTimeout(async () => {
    try {
      await generateDueDateNotifications();
      console.log('✅ Initial notification generation complete');
    } catch (err) {
      console.error('❌ Initial notification generation failed:', err.message);
    }
  }, 5000);

  // Run every 6 hours (6 * 60 * 60 * 1000 = 21600000ms)
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  intervalId = setInterval(async () => {
    try {
      await generateDueDateNotifications();
    } catch (err) {
      console.error('❌ Scheduled notification generation failed:', err.message);
    }
  }, SIX_HOURS);

  console.log('⏰ Notification scheduler running (every 6 hours)');
}

function stopNotificationScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('⏰ Notification scheduler stopped');
  }
}

module.exports = { startNotificationScheduler, stopNotificationScheduler };

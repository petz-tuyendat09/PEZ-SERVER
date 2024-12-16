const cron = require("node-cron");
const bookingService = require("../services/bookingServices");

cron.schedule("30 9,11,13,15,17,19,21 * * *", async () => {
  console.log(
    "Running check for pending bookings at 9:30, 11:30, 1:30, and every 2 hours after..."
  );
  await bookingService.checkAndCancelPendingBookings();
});

// cron.schedule("*/5 * * * * *", async () => {
//   console.log("Running check for pending bookings every 5 seconds...");
//   await bookingService.checkAndCancelPendingBookings();
// });

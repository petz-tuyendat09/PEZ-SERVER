const express = require("express");
const router = express.Router();
const bookingController = require("../controller/booking-controller");

router.post("/", bookingController.createBooking);
router.get("/booking-by-date", bookingController.getBookingByDate);
router.get("/booking-userId/", bookingController.getBookingByUserId);

module.exports = router;

const express = require("express");
const router = express.Router();
const bookingController = require("../controller/booking-controller");

router.get("/booking-by-date", bookingController.getBookingByDate);

module.exports = router;

const express = require("express");
const router = express.Router();
const bookingController = require("../controller/booking-controller");

router.get("/", bookingController.queryBooking);
router.post("/", bookingController.createBooking);
router.get("/booking-by-date", bookingController.getBookingByDate);
router.get("/booking-userId/", bookingController.getBookingByUserId);
router.put("/cancel-booking", bookingController.cancelBooking);
router.put("/confirm-booking", bookingController.confirmBooking);
router.put("/done-booking", bookingController.doneBooking);
router.post("/review-booking", bookingController.reviewBooking);
router.get("/get-review", bookingController.getReview);
router.post("/momo", bookingController.createBookingWithMomo);

module.exports = router;

const express = require("express");
const statsBookingController = require("../controller/statsBookingController");

const router = express.Router();

router.get("/", statsBookingController.getStatistics);

module.exports = router;

const express = require("express");
const statsController = require("../controller/statsController");

const router = express.Router();

router.get("/", statsController.getStatistics);

module.exports = router;

const express = require("express");
const statsOrderController = require("../controller/statsOrderController");

const router = express.Router();

router.get("/", statsOrderController.getStatistics);

module.exports = router;

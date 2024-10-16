const express = require("express");
const router = express.Router();
const servicesController = require("../controller/services-controller");

router.get("/", servicesController.queryServices);

module.exports = router;

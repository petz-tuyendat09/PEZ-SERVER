const express = require("express");
const router = express.Router();
const servicesController = require("../controller/services-controller");

router.get("/", servicesController.queryServices);
router.get("/paginate", servicesController.queryServicesPaginate);
router.post("/", servicesController.insertService);
router.delete("/", servicesController.deleteService);
router.put("/", servicesController.updateService);
router.put("/toggle-service", servicesController.toggleService);

module.exports = router;

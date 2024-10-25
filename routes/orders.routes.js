const express = require("express");
const router = express.Router();
const orderController = require("../controller/orders-controller");

router.get("/order-userId/", orderController.getOrderByUserId);
router.get("/order-id/", orderController.getOrderByOrderId);

module.exports = router;

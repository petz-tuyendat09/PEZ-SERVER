const express = require("express");
const router = express.Router();
const orderController = require("../controller/orders-controller");

router.get("/", orderController.queryOrders);
router.get("/order-userId/", orderController.getOrderByUserId);
router.post("/", orderController.insertOrders);
module.exports = router;

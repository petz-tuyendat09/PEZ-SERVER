const express = require("express");
const router = express.Router();
const orderController = require("../controller/orders-controller");

router.get("/", orderController.queryOrders);
router.get("/order-userId/", orderController.getOrderByUserId);
router.get("/order-id/", orderController.getOrderByOrderId);
router.post("/cancel-order", orderController.cancelOrder);
router.post("/delivering-order/", orderController.getOrderByOrderId);
router.post("/delivering-order/", orderController.getOrderByOrderId);
router.put("/edit-order-status", orderController.editOrderStatus);

module.exports = router;

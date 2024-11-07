const express = require("express");
const router = express.Router();
const orderController = require("../controller/orders-controller");

router.get("/", orderController.queryOrders);
router.get("/order-userId/", orderController.getOrderByUserId);
router.post("/", orderController.insertOrders);
router.post("/cancel-order", orderController.cancelOrder);
router.get("/order-id/", orderController.getOrderByOrderId);
router.post("/delivering-order/", orderController.getOrderByOrderId);
router.put('/payment-status', orderController.updatePaymentStatus);

module.exports = router;

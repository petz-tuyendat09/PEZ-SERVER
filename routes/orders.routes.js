const express = require("express");
const router = express.Router();
const orderController = require("../controller/orders-controller");
const refundHandler = require("../momo/refund");

router.get("/", orderController.queryOrders);
router.get("/order-userId/", orderController.getOrderByUserId);
router.post("/", orderController.insertOrders);
router.post("/cancel-order", orderController.cancelOrder);
router.get("/order-id/", orderController.getOrderByOrderId);
router.put("/edit-order-status", orderController.editOrderStatus);
router.post("/refund", refundHandler);

module.exports = router;

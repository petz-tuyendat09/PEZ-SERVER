const express = require("express");
const router = express.Router();
const orderController = require("../controller/orders-controller");

router.get("/order-userId/", orderController.getOrderByUserId);

module.exports = router;

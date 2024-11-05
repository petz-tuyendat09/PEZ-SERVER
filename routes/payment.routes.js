const express = require("express");
const handler = require("../momo/payment");
const router = express.Router();
const paymentController = require("../controller/payment-controller");

router.post("/", handler);
router.post("/callback-payment", paymentController.paymentCallback);

module.exports = router;

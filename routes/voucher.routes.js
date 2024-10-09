const express = require("express");
const router = express.Router();
const voucherController = require("../controller/voucher-controller");

router.get("/", voucherController.getVoucher);

module.exports = router;

const express = require("express");
const router = express.Router();
const voucherController = require("../controller/voucher-controller");

router.get("/", voucherController.getVoucher);
router.post("/", voucherController.insertVoucher);
router.delete("/", voucherController.deleteVoucher);
router.put("/", voucherController.editVoucher);
router.get("/can-exchange", voucherController.getVoucherCanExchange);
router.post("/change-voucher", voucherController.changeVoucher);
router.put("/toggle-voucher", voucherController.toggleVoucher);

module.exports = router;

const express = require("express");
const router = express.Router();
const cartController = require("../controller/cart-controller");

router.post("/", cartController.insertCart);
router.post("/quantity-adjust", cartController.quantityAdjust);
router.post("/remove-item", cartController.removeItem);

module.exports = router;

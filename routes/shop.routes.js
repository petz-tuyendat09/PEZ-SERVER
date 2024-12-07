const express = require("express");
const router = express.Router();
const shopController = require('../controller/shop-controller');
router.get('/', shopController.queryProductsNguyet);
module.exports = router;
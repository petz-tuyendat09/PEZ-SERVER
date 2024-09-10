const express = require("express");
const router = express.Router();

const productController = require("../controller/product-controller");

router.get("/", productController.queryProducts);
router.get("/page", productController.getProductsWithPagination);

module.exports = router;

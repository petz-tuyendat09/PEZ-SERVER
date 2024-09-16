const express = require("express");
const router = express.Router();
// const upload = require("../middlewares/uploadImage");
const multer = require("multer");
const upload = multer();
const productController = require("../controller/product-controller");

router.get("/", productController.queryProducts);
router.get("/page", productController.getProductsWithPagination);
router.get("/trending", productController.getTrendingProducts);
module.exports = router;

const express = require("express");
const router = express.Router();
// const upload = require("../middlewares/uploadImage");
const multer = require("multer");
const upload = multer();
const productController = require("../controller/product-controller");

router.get("/", productController.queryProducts);
router.get("/page", productController.getProductsWithPagination);
router.post(
  "/insert-product",
  upload.fields([
    { name: "productThumbnail", maxCount: 1 },
    { name: "productImages", maxCount: 9 },
  ]),
  productController.insertProduct
);
router.get("/trending", productController.getTrendingProducts);
router.get("/by-cat-id", productController.queryProductsByCateId);
router.delete("/delete-product", productController.deleteProduct);
router.post("/lowstock-nofi", productController.deleteProduct);

router.put(
  "/edit-product",
  upload.fields([
    { name: "newThumbnail", maxCount: 1 },
    { name: "newImages", maxCount: 9 },
  ]),
  productController.editProduct
);

module.exports = router;

const express = require("express");
const router = express.Router();

const categoriesController = require("../controller/categories-controller");

router.get("/", categoriesController.queryCategories);
router.get("/page", categoriesController.queryCategoriesByPage);
router.put("/", categoriesController.editCategory);
router.post("/", categoriesController.addCategory);
router.delete("/", categoriesController.deleteCategory);

module.exports = router;

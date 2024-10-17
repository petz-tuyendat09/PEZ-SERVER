const express = require("express");
const router = express.Router();

const subCategories = require("../controller/subcategories-controller");

router.get("/", subCategories.querySubCategories);
router.get("/page", subCategories.querySubCategoriesByPage);
router.put("/", subCategories.editSubCategory);
router.post("/", subCategories.addSubCategory);
router.delete("/", subCategories.deleteSubCategory);

module.exports = router;

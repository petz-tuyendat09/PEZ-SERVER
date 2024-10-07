const express = require("express");
const router = express.Router();

const subCategories = require("../controller/subcategories-controller");

router.get("/", subCategories.querySubCategories);
router.get("/page", subCategories.querySubCategoriesByPage);

module.exports = router;

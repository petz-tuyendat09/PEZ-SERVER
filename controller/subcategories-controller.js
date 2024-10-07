const subCategoriesServices = require("../services/subCategoriesServices");

exports.querySubCategories = async (req, res) => {
  try {
    const filter = {
      animalType: req.query.animalType,
      categoryId: req.query.categoryId,
      subCategoryId: req.query.subCategoryId,
    };

    const result = await subCategoriesServices.querySubCategories(filter);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
exports.querySubCategoriesByPage = async (req, res) => {
  try {
    const filter = {
      animalType: req.query.animalType,
      categoryId: req.query.categoryId,
      subCategoryId: req.query.subCategoryId,
      page: parseInt(req.query.page) || 1, // Default to page 1 if not provided
    };

    const result = await subCategoriesServices.querySubCategoriesByPage(filter);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

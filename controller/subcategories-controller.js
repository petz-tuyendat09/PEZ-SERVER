const subCategoriesServices = require("../services/subCategoriesServices");

exports.querySubCategories = async (req, res) => {
  try {
    const categoryName = req.query.categoryName;

    const result = await subCategoriesServices.querySubCategories(categoryName);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const categorieServices = require("../services/categoriesServices");

/**
 * Controller để tìm kiếm danh mục
 * @param {object} req
 * @param {object} res
 * @returns {Promise<void>}
 */

exports.queryCategories = async (req, res) => {
  try {
    const result = await categorieServices.queryCategories();
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

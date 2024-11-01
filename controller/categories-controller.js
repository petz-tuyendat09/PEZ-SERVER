const categorieServices = require("../services/categoriesServices");

/**
 * Controller để tìm kiếm danh mục
 * @param {object} req
 * @param {object} res
 * @returns {Promise<void>}
 */

exports.queryCategories = async (req, res) => {
  try {
    const categoryId = req.query.categoryId;
    const result = await categorieServices.queryCategories(categoryId);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.queryCategoriesByPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const result = await categorieServices.queryCategoriesPagination(page);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.editCategory = async (req, res) => {
  try {
    const categoryId = req.body.categoryId;
    const editCategoryName = req.body.editCategoryName;

    // Kiểm tra xem tên danh mục đã tồn tại chưa
    const existingCategory = await categorieServices.existingCategoryName(
      editCategoryName
    );

    if (existingCategory) {
      return res.status(400).json({ message: "Tên danh mục đã tồn tại" });
    }

    await categorieServices.editCategory(categoryId, editCategoryName);
    return res.status(200).json({ message: "Sửa danh mục thành công" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
exports.addCategory = async (req, res) => {
  try {
    const newCategoryName = req.body.newCategoryName;

    const existingCategory = await categorieServices.existingCategoryName(
      newCategoryName
    );
    if (existingCategory) {
      return res.status(400).json({ message: "Tên danh mục đã tồn tại" });
    }

    // Nếu chưa tồn tại, thêm danh mục mới
    const result = await categorieServices.addCategory(newCategoryName);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { deleteCategoryId, deleteAlong, newCategory } = req.body;
    await categorieServices.deleteCategory({
      deleteCategoryId,
      deleteAlong,
      newCategory,
    });
    return res.status(200).json({ message: "Xóa thành công" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

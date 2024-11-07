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

exports.editSubCategory = async (req, res) => {
  try {
    const { newSubCategoryName, newCategoryId, editSubCategoryId } = req.body;
    console.log(req.body);

    const existingSubCategoryName =
      await subCategoriesServices.existingSubCategoryName(
        newSubCategoryName,
        newCategoryId
      );

    if (existingSubCategoryName) {
      console.log("Tên danh mục đã tồn tại");
      return res.status(400).json({ message: "Tên danh mục đã tồn tại" });
    }

    await subCategoriesServices.editSubCategory(
      editSubCategoryId,
      newSubCategoryName,
      newCategoryId
    );
    return res.status(200).json({ message: "Sửa danh mục thành công" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err.message });
  }
};

// Add subcategory controller
exports.addSubCategory = async (req, res) => {
  try {
    const { newSubCategoryName, categoryId } = req.body;

    // Check if the subcategory name already exists
    const existingSubCategory =
      await subCategoriesServices.existingSubCategoryName(newSubCategoryName);

    if (existingSubCategory) {
      return res.status(400).json({ message: "Tên danh mục đã tồn tại" });
    }

    // Add new subcategory
    const result = await subCategoriesServices.addSubCategory(
      newSubCategoryName,
      categoryId
    );

    return res.status(201).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Delete subcategory controller
exports.deleteSubCategory = async (req, res) => {
  try {
    const { subCategoryId } = req.body;

    let result;
    if (Array.isArray(subCategoryId)) {
      result = await subCategoriesServices.deleteMultipleSubCategoriesByIds(
        subCategoryId
      );
    } else {
      result = await subCategoriesServices.deleteSubCategoryById(subCategoryId);
    }

    if (!result || (Array.isArray(result) && result.length === 0)) {
      return res.status(404).json({ message: "Subcategory not found" });
    }

    return res.status(200).json({
      message: Array.isArray(subCategoryId)
        ? "Subcategories deleted successfully"
        : "Subcategory deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

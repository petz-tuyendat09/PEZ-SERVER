const Categories = require("../models/Categories");

/**
 * Tìm kiếm danh mục
 */
exports.queryCategories = async (categoryId) => {
  try {
    console.log(categoryId);
    if (categoryId) {
      const queryResult = await Categories.findById(categoryId);
      return queryResult;
    }

    const queryResult = await Categories.find();
    return queryResult;
  } catch (err) {
    console.error("Error occurred:", err.message);
  }
};

/**
 * Tìm kiếm danh mục phân trang
 */
exports.queryCategoriesPagination = async (page) => {
  try {
    const limit = 5;
    const skip = (page - 1) * limit;

    const queryResult = await Categories.find().skip(skip).limit(limit);
    const total = await Categories.countDocuments();

    return {
      categories: queryResult,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  } catch (err) {
    console.error("Error occurred:", err.message);
    throw new Error(err);
  }
};

exports.editCategory = async (id, editCategoryName) => {
  try {
    await Categories.findByIdAndUpdate(id, { categoryName: editCategoryName });
  } catch (err) {
    console.error("Error occurred:", err.message);
    throw new Error(err);
  }
};

exports.existingCategoryName = async (newCategoryName) => {
  try {
    const trimmedName = newCategoryName.trim().replace(/\s+/g, " ");

    const category = await Categories.findOne({
      categoryName: trimmedName,
    });
    return category;
  } catch (err) {
    console.error("Error occurred:", err.message);
    throw new Error(err);
  }
};

exports.addCategory = async (newCategoryName) => {
  try {
    const trimmedName = newCategoryName.trim().replace(/\s+/g, " ");

    const newCategory = new Categories({ categoryName: trimmedName });
    await newCategory.save();
    return newCategory;
  } catch (err) {
    console.error("Error occurred:", err.message);
    throw new Error(err);
  }
};

exports.deleteCategory = async (deleteCategoryId) => {
  try {
    await Categories.findByIdAndDelete(deleteCategoryId);
  } catch (err) {
    console.error("Error occurred:", err.message);
    throw new Error(err);
  }
};

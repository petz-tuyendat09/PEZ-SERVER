const Categories = require("../models/Categories");
const Subcategories = require("../models/SubCategories");
const Product = require("../models/Product.js");
const productServices = require("../services/productServices.js");
/**
 * Tìm kiếm danh mục
 */
exports.queryCategories = async (categoryId) => {
  try {
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
    const limit = 4;
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

exports.deleteCategory = async ({
  deleteCategoryId,
  deleteAlong,
  newCategory,
}) => {
  try {
    if (deleteAlong) {
      // Xóa tất cả các sản phẩm và danh mục con liên quan khi deleteAlong là true
      await productServices.deleteProductsByCategory(deleteCategoryId);
      console.log("Tất cả sản phẩm đã được xóa.");

      await Subcategories.deleteMany({ categoryId: deleteCategoryId });
      console.log("Tất cả danh mục con đã được xóa.");
    } else if (newCategory) {
      // Nếu deleteAlong là false, cập nhật tất cả sản phẩm và danh mục con với danh mục mới
      await Subcategories.updateMany(
        { categoryId: deleteCategoryId },
        { categoryId: newCategory }
      );
      console.log("Danh mục con đã được cập nhật với danh mục mới.");

      await Product.updateMany(
        { productCategory: deleteCategoryId },
        { productCategory: newCategory }
      );
      console.log("Sản phẩm đã được cập nhật với danh mục mới.");
    }

    // Xóa danh mục chính
    await Categories.findByIdAndDelete(deleteCategoryId);
    console.log("Danh mục chính đã được xóa.");
  } catch (err) {
    console.error("Error occurred:", err.message);
    throw new Error(err);
  }
};

const subCategories = require("../models/SubCategories");

/**
 * Tìm kiếm danh mục con dựa trên các tiêu chí khác nhau
 * @param {object} filter - Các tiêu chí tìm kiếm danh mục con
 * @param {string} filter.animalType - Loại thú cưng (Chó - Mèo)
 * @param {string} filter.categoryId - Id danh mục)
 * @param {string} filter.subCategoryId - Tìm danh mục con theo Id)
 *
 *
 */
exports.querySubCategories = async ({
  animalType,
  categoryId,
  subCategoryId,
}) => {
  try {
    const query = {};

    if (animalType) {
      // Sử dụng $regex để tìm kiếm tên danh mục chứa chuỗi
      query.animalType = { $regex: animalType, $options: "i" }; // 'i' để không phân biệt chữ hoa và chữ thường
    }

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (subCategoryId) {
      query._id = subCategoryId;
    }

    const queryResult = await subCategories.find(query);
    return queryResult;
  } catch (err) {
    console.error("Error occurred:", err.message);
  }
};

exports.querySubCategoriesByPage = async ({
  animalType,
  categoryId,
  subCategoryId,
  page,
}) => {
  try {
    const query = {};
    const limit = 4;
    const skip = (page - 1) * limit;

    if (animalType) {
      query.animalType = { $regex: animalType, $options: "i" }; // Case-insensitive match
    }

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (subCategoryId) {
      query._id = subCategoryId;
    }

    const queryResult = await subCategories
      .find(query)
      .skip(skip)
      .limit(limit)
      .populate("categoryId", "categoryName") // Populate categoryId with categoryName
      .exec();

    const total = await subCategories.countDocuments(query);

    return {
      subCategories: queryResult,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    };
  } catch (err) {
    console.error("Error occurred:", err.message);
    throw new Error(err);
  }
};

exports.existingSubCategoryName = async (newSubCategoryName, newCategoryId) => {
  try {
    const trimmedName = newSubCategoryName.trim().replace(/\s+/g, " ");

    const subCategory = await subCategories.findOne({
      subCategoryName: trimmedName,
      categoryId: newCategoryId,
    });
    return subCategory;
  } catch (err) {
    console.error("Error occurred:", err.message);
    throw new Error(err);
  }
};

exports.editSubCategory = async (
  editSubCategoryId,
  newSubCategoryName,
  newCategoryId
) => {
  console.log("123");

  try {
    await subCategories.findByIdAndUpdate(editSubCategoryId, {
      subCategoryName: newSubCategoryName,
      categoryId: newCategoryId,
    });
  } catch (err) {
    console.error("Error occurred:", err.message);
    throw new Error(err);
  }
};

exports.addSubCategory = async (newSubCategoryName, newCategoryId) => {
  try {
    const trimmedName = newSubCategoryName.trim().replace(/\s+/g, " ");

    // Create a new subcategory document
    const newSubCategory = new subCategories({
      subCategoryName: trimmedName,
      categoryId: newCategoryId,
    });

    // Save the new subcategory to the database
    const savedSubCategory = await newSubCategory.save();

    return savedSubCategory;
  } catch (err) {
    console.error("Error occurred:", err.message);
    throw new Error(err);
  }
};

// Delete single subcategory service
exports.deleteSubCategoryById = async (id) => {
  try {
    const deletedSubCategory = await subCategories.findByIdAndDelete(id);
    return deletedSubCategory;
  } catch (err) {
    console.error("Error occurred:", err.message);
    throw new Error(err);
  }
};

// Delete multiple subcategories service
exports.deleteMultipleSubCategoriesByIds = async (ids) => {
  try {
    const deletedSubCategories = await subCategories.deleteMany({
      _id: { $in: ids },
    });
    return deletedSubCategories;
  } catch (err) {
    console.error("Error occurred:", err.message);
    throw new Error(err);
  }
};

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
exports.querySubCategories = async ({ animalType, categoryId,subCategoryId }) => {
  try {
    const query = {};
  
    if (animalType) {
      // Sử dụng $regex để tìm kiếm tên danh mục chứa chuỗi
      query.animalType = { $regex: animalType, $options: "i" }; // 'i' để không phân biệt chữ hoa và chữ thường
    }

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (
      subCategoryId
    ) {
      query._id = subCategoryId;

    }

    const queryResult = await subCategories.find(query);
    return queryResult;
  } catch (err) {
    console.error("Error occurred:", err.message);
  }
};

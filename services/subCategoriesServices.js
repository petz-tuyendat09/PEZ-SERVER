const subCategories = require("../models/SubCategories");

/**
 * Tìm kiếm danh mục con dựa trên các tiêu chí khác nhau
 * @param {string} categoryName - Tên danh mục sản phẩm
 */
exports.querySubCategories = async (categoryName) => {
  try {
    const query = {};
    console.log(categoryName);

    if (categoryName) {
      // Sử dụng $regex để tìm kiếm tên danh mục chứa chuỗi
      query["category.categoryName"] = { $regex: categoryName, $options: "i" }; // 'i' để không phân biệt chữ hoa và chữ thường
    }
    const queryResult = await subCategories.find(query);
    return queryResult;
  } catch (err) {
    console.error("Error occurred:", err.message);
  }
};

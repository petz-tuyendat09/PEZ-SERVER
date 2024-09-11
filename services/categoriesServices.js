const Categories = require("../models/Categories");

/**
 * Tìm kiếm danh mục
 */
exports.queryCategories = async ({} = {}) => {
  try {
    const queryResult = await Categories.find();
    return queryResult;
  } catch (err) {
    console.error("Error occurred:", err.message);
  }
};

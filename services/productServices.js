const Product = require("../models/Product");

/**
 * Tìm kiếm sản phẩm dựa trên các tiêu chí khác nhau
 * @param {object} filters - Các tiêu chí tìm kiếm sản phẩm
 * @param {string} filters.categoryName - Tên danh mục sản phẩm
 * @param {string} filters.productSubcategories - Tên các danh mục con của sản phẩm
 * @param {string} filters.productName - Tên sản phẩm
 * @param {number} filters.salePercent - Phần trăm giảm giá
 * @param {string} filters.productStatus - Trạng thái sản phẩm ("default" hoặc "lastest")
 * @param {number} filters.limit - Số lượng sản phẩm tối đa trả về
 * @returns {Promise<Array>} Trả về danh sách các sản phẩm phù hợp với tiêu chí tìm kiếm
 */
exports.queryProducts = async ({
  categoryName,
  productSubcategories,
  productName,
  salePercent,
  productStatus = "default",
  limit,
} = {}) => {
  try {
    const query = {};
    let productOrder = 1;

    // Tìm kiếm theo tên sản phẩm (nếu có)
    if (productName) {
      query.productName = new RegExp(productName, "i");
    }

    // Sắp xếp theo sản phẩm mới nhất (nếu có yêu cầu)
    if (productStatus === "lastest") {
      productOrder = -1;
    }

    // Tìm kiếm theo phần trăm giảm giá (nếu có)
    if (salePercent) {
      query.salePercent = { $gte: salePercent };
    }

    // Tìm kiếm theo tên danh mục sản phẩm (nếu có)
    if (categoryName) {
      query["productCategory.categoryName"] = categoryName;
    }

    // Tìm kiếm theo danh mục con (nếu có)
    if (productSubcategories) {
      query.productSubcategories = productSubcategories;
    }

    // Thực hiện truy vấn
    const queryResult = await Product.find(query)
      .limit(limit)
      .sort({ _id: productOrder });

    return queryResult;
  } catch (err) {
    console.error("Error occurred:", err.message);
  }
};

/**
 * Phân trang khi get product
 * @param {object} paginateOption - Các tiêu chí tìm kiếm sản phẩm
 * @param {number} paginateOption.page - Số trang hiện tại
 * @param {number} paginateOption.limit - Số lượng sản phẩm trên mỗi trang
 * @returns {Promise<object>} Trả về thông tin về tổng số trang, trang hiện tại và danh sách sản phẩm
 */
exports.getProductsWithPagination = async ({ page = 1, limit = 10 }) => {
  try {
    const startIndex = (page - 1) * limit;

    // Tổng số sản phẩm
    const totalProducts = await Product.countDocuments();

    // Tính tổng số trang
    const totalPages = Math.ceil(totalProducts / limit);

    // Lấy danh sách sản phẩm với phân trang và sắp xếp theo _id giảm dần
    const products = await Product.find()
      .skip(startIndex)
      .limit(limit)
      .sort({ _id: -1 });

    return {
      products,
      totalPages,
    };
  } catch (err) {
    console.error("Error occurred:", err.message);
  }
};

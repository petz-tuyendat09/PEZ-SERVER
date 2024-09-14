const Product = require("../models/Product");
const fs = require("fs");
const path = require("path");
const slugify = require("slugify");

/**
 * Tìm kiếm sản phẩm dựa trên các tiêu chí khác nhau
 * @param {object} filters - Các tiêu chí tìm kiếm sản phẩm
 * @param {string} filters.categoryName - Tên danh mục sản phẩm
 * @param {string} filters.productSubcategory - Tên các danh mục con của sản phẩm
 * @param {string} filters.productName - Tên sản phẩm
 * @param {number} filters.salePercent - Phần trăm giảm giá
 * @param {string} filters.productStatus - Trạng thái sản phẩm ("default" hoặc "lastest")
 * @param {string} filters.productFor - Sản phẩm dành cho chó hoặc mèo ("chó" hoăc "mèo")
 * @param {number} filters.limit - Số lượng sản phẩm tối đa trả về
 * @returns {Promise<Array>} Trả về danh sách các sản phẩm phù hợp với tiêu chí tìm kiếm
 */
exports.queryProducts = async ({
  categoryName,
  productSubcategory,
  productName,
  salePercent,
  productStatus = "default",
  productFor,
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

    if (productFor) {
      query.productFor = new RegExp(productFor, "i");
    }

    // Tìm kiếm theo tên danh mục sản phẩm (nếu có)
    if (categoryName) {
      query["productCategory.categoryName"] = new RegExp(categoryName, "i");
    }

    // Tìm kiếm theo danh mục con (nếu có)
    if (productSubcategory) {
      query["productSubCategory.subCategoryName"] = new RegExp(
        productSubcategory,
        "i"
      );
    }

    console.log(productFor);

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

// === LOGIC INSERT PRODUCT ===

/**
 * Check sản phẩm trùng
 * @param {string} productName - Tên sản phẩm vừa thêm
 */

exports.checkDuplicatedProduct = async (productName, files) => {
  try {
    // Tìm sản phẩm với tên trùng lặp
    const duplicatedProduct = await Product.findOne({
      productName: productName,
    });

    if (duplicatedProduct) {
      // Lấy danh sách tên tệp từ `files`
      // if (files) {
      //   const filesToDelete = files.map((item) => item.originalname);

      //   // Xóa tất cả các tệp tin nếu sản phẩm bị trùng
      //   await Promise.all(
      //     filesToDelete.map((file) => {
      //       const filePath = path.join(
      //         __dirname,
      //         "../public/images/products",
      //         file
      //       );
      //       return fs.promises.unlink(filePath).catch((err) => {
      //         console.error(`Failed to delete file ${file}:`, err);
      //       });
      //     })
      //   );

      //   console.log("All files deleted successfully.");
      // }

      return !!duplicatedProduct;
    }

    return false; // Trả về false nếu không có sản phẩm trùng lặp
  } catch (error) {
    console.error("Error checking duplicated product:", error);
    throw error; // Ném lỗi để xử lý ở nơi gọi hàm
  }
};

/**
 * Thêm sản phẩm vào database
 * @param {object} newProductInfo - Các tiêu chí tìm kiếm sản phẩm
 * @param {string} newProductInfo.productName - Tên danh mục sản phẩm
 * @param {string} newProductInfo.productSubcategory - Tên các danh mục con của sản phẩm
 * @param {string} newProductInfo.productName - Tên sản phẩm
 * @param {number} newProductInfo.salePercent - Phần trăm giảm giá
 * @param {string} newProductInfo.productStatus - Trạng thái sản phẩm ("default" hoặc "lastest")
 * @param {string} newProductInfo.productFor - Sản phẩm dành cho chó hoặc mèo ("chó" hoăc "mèo")
 * @param {number} newProductInfo.limit - Số lượng sản phẩm tối đa trả về
 * @returns {Promise<Array>} Trả về danh sách các sản phẩm phù hợp với tiêu chí tìm kiếm
 */
exports.insertProduct = async ({
  productName,
  productPrice,
  salePercent,
  productQuantity,
  productCategory,
  productSubcategory,
  animalType,
  productDescription,
  productImages,
}) => {
  try {
    const productSlug = slugify(productName, { lower: true });
    console.table([
      {
        "Product Name": productName,
        "Product Slug": productSlug,
        "Product Price": productPrice,
        "Sale Percent": salePercent,
        "Product Quantity": productQuantity,
        "Product Category": productCategory,
        "Product Subcategory": productSubcategory,
        "Animal Type": animalType,
        "Product Description": productDescription,
      },
    ]);

    // const newProduct = new Product({
    //   productName: productName,
    //   productPrice: productPrice,
    //   salePercent: salePercent,
    //   productSlug: productSlug,
    //   productQuantity: productQuantity,
    //   productThumbnail: productImages[0].originalname,
    //   productImages: [
    //     productImages[1].originalname || null,
    //     productImages[2].originalname || null,
    //     productImages[3].originalname || null,
    //   ],
    //   productDescription: productDescription,
    //   productCategory: productCategory,
    //   productSubCategory: productSubcategory,
    //   animalType: animalType,
    // });

    console.table([
      productImages[0] || null,
      productImages[1] || null,
      productImages[2] || null,
      productImages[3] || null,
    ]);
    console.log(productImages["productThumbnail"]);
    // console.log(newProduct);

    // const result = await newProduct.save();
  } catch (error) {
    console.log(error);
  }
};

// const newProduct = new Product({
//   productName: productName,
//   productPrice: productPrice,
//   salePercent: salePercent,
//   productSlug: "123",
//   productQuantity: productQuantity,
//   productImage: productImage,
//   productDescription: description,
//   productCategory: {
//     categoryId: categoryFind._id,
//     categoryName: categoryFind.categoryName,
//   },
//   skinType: {
//     skinTypeId: skintypeFind._id,
//     skinTypeName: skintypeFind.skinType,
//   },
// });

// const result = await newProduct.save();

// // Add to categories database
// categoryFind.products.push({ productId: result._id });
// await categoryFind.save();

// skintypeFind.products.push({ productId: result._id });
// await skintypeFind.save(); // Đã sửa lỗi từ categoryFind.save() thành skintypeFind.save()

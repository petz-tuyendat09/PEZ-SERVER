const Product = require("../models/Product");
const slugify = require("slugify");
const uploadFileToDrive = require("../utils/uploadToDrive.js");
const { uploadFileToS3 } = require("../utils/uploadToAWS.js");

// === Query Product ===
/**
 * Tìm kiếm sản phẩm dựa trên các tiêu chí khác nhau
 * @param {object} filters - Các tiêu chí tìm kiếm sản phẩm
 * @param {string} filters.productCategory - Tên danh mục sản phẩm
 * @param {string} filters.productSubcategory - Tên các danh mục con của sản phẩm
 * @param {string} filters.productName - Tên sản phẩm
 * @param {number} filters.salePercent - Phần trăm giảm giá
 * @param {string} filters.productStatus - Trạng thái sản phẩm ("default" hoặc "lastest")
 * @param {string} filters.animalType - Sản phẩm dành cho chó hoặc mèo ("chó" hoăc "mèo")
 * @param {number} filters.limit - Số lượng sản phẩm tối đa trả về
 * @param {number} filters.productBuy - Lượt mua của sản phẩm
 * @returns {Promise<Array>} Trả về danh sách các sản phẩm phù hợp với tiêu chí tìm kiếm
 */
exports.queryProducts = async ({
  productCategory,
  productSlug,
  productSubcategory,
  productName,
  salePercent,
  productStatus = "default",
  productBuy,
  animalType,
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

    if (animalType) {
      query.animalType = new RegExp(animalType, "i");
    }

    // Tìm kiếm theo tên danh mục sản phẩm (nếu có)
    if (productCategory) {
      query.productCategory = categoryName;
    }

    // Tìm kiếm theo danh mục con (nếu có)
    if (productSubcategory) {
      query.productSubcategory = productSubcategory;
    }

    if (productSlug) {
      query.productSlug = new RegExp(productSlug, "i");
    }

    if (productBuy) {
      query.salePercent = { $gte: productBuy };
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
// exports.insertProduct = async ({
//   productName,
//   productPrice,
//   salePercent,
//   productQuantity,
//   productCategory,
//   productSubcategory,
//   animalType,
//   productDescription,
//   files,
// }) => {
//   try {
//     const productSlug = slugify(productName, {
//       lower: false, // convert to lower case, defaults to `false`
//     });

//     // Upload thumbnail and images to Google Drive
//     const productThumbnail = files.productThumbnail
//       ? await uploadFileToDrive.uploadFileToDrive(files.productThumbnail[0]) // Upload thumbnail
//       : null;

//     const productImages = files.productImages
//       ? await Promise.all(
//           files.productImages.map(uploadFileToDrive.uploadFileToDrive)
//         ) // Upload images
//       : [];

//     const newProduct = new Product({
//       productName: productName,
//       productPrice: productPrice,
//       salePercent: salePercent,
//       productSlug: productSlug,
//       productQuantity: productQuantity,
//       productThumbnail: productThumbnail,
//       productImages: productImages,
//       productDescription: productDescription,
//       productCategory: productCategory,
//       productSubCategory: productSubcategory,
//       animalType: animalType,
//     });

//     await newProduct.save();
//   } catch (error) {
//     console.log(error);
//   }
// };

exports.insertProduct = async ({
  productName,
  productPrice,
  salePercent,
  productQuantity,
  productCategory,
  productSubcategory,
  animalType,
  productDescription,
  files,
}) => {
  try {
    const productSlug = slugify(productName, { lower: false });

    // Upload thumbnail lên S3
    const productThumbnail = files.productThumbnail
      ? await uploadFileToS3(files.productThumbnail[0])
      : null;

    // Upload các hình ảnh khác lên S3
    const productImages = files.productImages
      ? await Promise.all(files.productImages.map(uploadFileToS3))
      : [];

    // Tạo sản phẩm mới và lưu vào database
    const newProduct = new Product({
      productName: productName,
      productPrice: productPrice,
      salePercent: salePercent,
      productSlug: productSlug,
      productQuantity: productQuantity,
      productThumbnail: productThumbnail,
      productImages: productImages,
      productDescription: productDescription,
      productCategory: productCategory,
      productSubCategory: productSubcategory,
      animalType: animalType,
    });

    await newProduct.save();
  } catch (error) {
    console.log(error);
  }
};

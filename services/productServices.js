const Product = require("../models/Product");
const slugify = require("slugify");
const mongoose = require("mongoose");
const { uploadFileToS3, deleteFileFromS3 } = require("../utils/uploadToAWS.js");
const ProductDetailDescription = require("../models/ProductDetailDescription.js");

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
  productSubCategory,
  productName,
  salePercent,
  productStatus = "default",
  productBuy,
  animalType,
  limit = 10,
  page = 1,
} = {}) => {
  try {
    const query = {};
    let productOrder = 1;

    // Search by product name (if provided)
    if (productName) {
      query.productName = new RegExp(productName, "i");
    }

    // Sort by latest products (if requested)
    if (productStatus === "latest") {
      productOrder = -1;
    }

    // Search by sale percentage (if provided)
    if (salePercent) {
      query.salePercent = { $gte: salePercent };
    }

    // Search by animal type (if provided)
    if (animalType) {
      query.animalType = new RegExp(animalType, "i");
    }

    // Search by product category (if provided)
    if (productCategory) {
      const categoriesArray = productCategory.split(",").map((id) => id.trim());
      query.productCategory = { $in: categoriesArray };
    }

    // Search by product subcategory (if provided)
    if (productSubCategory) {
      const subCategoriesArray = productSubCategory
        .split(",")
        .map((id) => id.trim());
      query.productSubCategory = { $in: subCategoriesArray };
    }

    // Search by product slug (if provided)
    if (productSlug) {
      query.productSlug = new RegExp(productSlug, "i");
    }

    // Search by product buy (if provided)
    if (productBuy) {
      query.productBuy = { $gte: productBuy };
    }

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // Get the total count of documents matching the query
    const totalDocuments = await Product.countDocuments(query);

    // Execute the query with pagination and populate ProductDetailDescription if productSlug is present
    let queryResult = Product.find(query)
      .limit(limit)
      .skip(skip)
      .sort({ _id: productOrder });

    // Populate ProductDetailDescription only when searching by productSlug
    if (productSlug) {
      queryResult = queryResult.populate("productDetailDescription");
    }

    // Execute the query
    const products = await queryResult;

    // Calculate total pages
    const totalPages = Math.ceil(totalDocuments / limit);

    // Return the results along with pagination info
    return {
      products,
      pagination: {
        totalDocuments,
        totalPages,
        currentPage: page,
        limit,
      },
    };
  } catch (err) {
    console.error("Error occurred:", err.message);
    throw err; // It's good practice to re-throw the error after logging it
  }
};

// === LOGIC INSERT PRODUCT ===
/**
 * Check sản phẩm trùng
 * @param {string} productName - Tên sản phẩm vừa thêm
 */

exports.checkDuplicatedProduct = async (productName) => {
  try {
    // Tìm sản phẩm với tên trùng lặp
    const duplicatedProduct = await Product.findOne({
      productName: productName,
    });

    if (duplicatedProduct) {
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
 *
 * @param {string} productName - Tên sản phẩm
 * @param {number} productPrice - Giá sản phẩm
 * @param {number} salePercent - Phần trăm giảm giá
 * @param {number} productQuantity - Số lượng sản phẩm
 * @param {string} productCategory - Tên danh mục sản phẩm
 * @param {string} productSubcategory - Tên các danh mục con của sản phẩm
 * @param {string} animalType - Sản phẩm dành cho chó hoặc mèo ("chó" hoặc "mèo")
 * @param {string} productDescription - Mô tả ngắn sản phẩm
 * @param {string} productDetailDescription - Mô tả sản phẩm chi tiết như chất liệu, dinh dưỡng
 * @param {string} productOption - Tùy chọn của sản phẩm, cân nặng, màu sắc
 * @param {object} files - Object chứa các tệp hình ảnh của sản phẩm
 *
 * Thêm sản phẩm bao gồm hình ảnh và thông tin sản phẩm vào cơ sở dữ liệu.
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
  productDetailDescription,
  productOption,
  files,
}) => {
  try {
    let success;
    let message;

    const isProductNameDuplicated = await this.checkDuplicatedProduct(
      productName
    );

    if (isProductNameDuplicated) {
      success = false;
      message = "Tên sản phẩm đã tồn tại";
      return { success, message };
    }

    const productSlug = slugify(productName, { lower: true });

    // Upload thumbnail lên S3
    const productThumbnail = files.productThumbnail
      ? await uploadFileToS3(files.productThumbnail[0])
      : null;

    // Upload các hình ảnh khác lên S3
    const productImages = files.productImages
      ? await Promise.all(files.productImages.map(uploadFileToS3))
      : [];

    const newProductDetailDescription = new ProductDetailDescription({
      detailContent: productDetailDescription,
    });

    newProductDetailDescription.save();

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
      productOption: productOption,
      productDetailDescription: newProductDetailDescription._id,
      productCategory: productCategory,
      productSubCategory: productSubcategory,
      animalType: animalType,
    });

    await newProduct.save();

    success = true;
    message = "Thêm sản phẩm thành công";
    return { success, message };
  } catch (error) {
    console.log(error);
    let success = false;
    let message = "Thêm sản phẩm không thành công";
    return { success, message };
  }
};

// === LOGIC DELETE PRODUCT ===
/**
 * Xóa sản phẩm khỏi database
 * @param {string} productId - Id sản phẩm cần xóa
 */

exports.deleteProduct = async (productId) => {
  try {
    // Tìm sản phẩm cần xóa
    const product = await Product.findById(productId);

    if (!product) {
      return false;
    }

    const detailId = product.productDetailDescription;
    await ProductDetailDescription.findByIdAndDelete(detailId);

    // Hàm handle xóa ảnh khỏi S3 theo URL
    const deleteImageFromS3 = async (imageUrl) => {
      const fileKey = imageUrl.split(".com/")[1]; // Lấy fileKey từ URL
      await deleteFileFromS3(fileKey);
    };

    // Xóa thumbnail
    if (product.productThumbnail) {
      await deleteImageFromS3(product.productThumbnail);
    }

    // Xóa ảnh
    if (product.productImages && product.productImages.length > 0) {
      for (const imageUrl of product.productImages) {
        await deleteImageFromS3(imageUrl);
      }
    }

    // Xóa sản phẩm khỏi cơ sở dữ liệu
    await Product.deleteOne({ _id: productId });

    console.log(
      `Product with ID ${productId} has been deleted along with its images.`
    );
  } catch (error) {
    console.error("Error in product deletion service:", error);
    throw error;
  }
};

/**
 * Chỉnh sửa thông tin sản phẩm trong cơ sở dữ liệu.
 *
 * @param {object} newProductInfo - Thông tin sản phẩm cần chỉnh sửa
 * @param {string} newProductInfo.productId - ID của sản phẩm cần chỉnh sửa
 * @param {string} newProductInfo.productName - Tên sản phẩm mới
 * @param {number} newProductInfo.productPrice - Giá sản phẩm mới
 * @param {number} newProductInfo.salePercent - Phần trăm giảm giá mới
 * @param {number} newProductInfo.productQuantity - Số lượng sản phẩm mới
 * @param {string} newProductInfo.productCategory - ID danh mục sản phẩm mới
 * @param {string} newProductInfo.productSubcategory - ID danh mục con của sản phẩm mới
 * @param {string} newProductInfo.animalType - Loại động vật liên quan đến sản phẩm (ví dụ: "Chó" hoặc "Mèo")
 * @param {string} newProductInfo.productDescription - Mô tả ngắn về sản phẩm mới
 * @param {string[]} newProductInfo.productOption - Các tùy chọn cho sản phẩm (ví dụ: trọng lượng, kích thước)
 * @param {string} newProductInfo.productDetailDescription - Mô tả chi tiết về sản phẩm (ví dụ: chất liệu, dinh dưỡng)
 * @param {string[]} [newProductInfo.removeImages] - Danh sách các URL hình ảnh cần xóa khỏi S3
 * @param {string} [newProductInfo.removeThumbnail] - URL của ảnh đại diện cần xóa khỏi S3
 * @param {object} newProductInfo.files - Các tệp hình ảnh được tải lên
 * @param {File[]} [newProductInfo.files.newImages] - Các tệp hình ảnh mới được tải lên để thêm vào sản phẩm
 * @param {File[]} [newProductInfo.files.newThumbnail] - Tệp ảnh đại diện mới được tải lên
 *
 * @returns {Promise<object>} Kết quả của việc cập nhật sản phẩm, bao gồm `success` và `message`
 *
 */

exports.editProduct = async ({
  productId,
  productName,
  productPrice,
  salePercent,
  productQuantity,
  productCategory,
  productSubcategory,
  animalType,
  productDescription,
  productOption,
  productDetailDescription,
  removeImages,
  removeThumbnail,
  files,
}) => {
  try {
    let success;
    let message;
    const existedProduct = await Product.findById(productId);
    if (!existedProduct) {
      throw new Error("Không tìm thấy sản phẩm");
    }
    let updatedImageList = [...existedProduct.productImages];

    const isProductNameDuplicated = await this.checkDuplicatedProduct(
      productName
    );
    if (isProductNameDuplicated) {
      success = false;
      message = "Tên sản phẩm đã tồn tại";
      return { success, message };
    }

    // Xóa hình cũ khỏi S3
    if (removeImages && removeImages.length > 0) {
      for (const imageUrl of removeImages) {
        const imageKey = imageUrl.split("/").pop(); // lấy key file s3
        if (imageKey) {
          await deleteFileFromS3(imageKey);
          updatedImageList = updatedImageList.filter((url) => url !== imageUrl);
        }
      }
    }

    // Thêm hình mới đc upload lên S3
    if (files.newImages && files.newImages.length > 0) {
      const uploadedImages = await Promise.all(
        files.newImages.map(uploadFileToS3)
      );
      updatedImageList = [...updatedImageList, ...uploadedImages];
    }

    // Cập nhật detail descriptioon
    const detailId = existedProduct.productDetailDescription;
    await ProductDetailDescription.findByIdAndUpdate(detailId, {
      detailContent: productDetailDescription,
    }).then(() => {
      console.log("Đã cập nhật detail descrioptn");
    });

    // Up thumbnail lên S3
    const updatedThumbnail = files.newThumbnail
      ? await uploadFileToS3(files.newThumbnail[0])
      : existedProduct.productThumbnail;

    // Xóa thumbnail cũ khỏi S3
    if (removeThumbnail) {
      const fileKey = removeThumbnail.split(".com/")[1]; // Lấy fileKey từ URL
      console.log(fileKey);
      await deleteFileFromS3(fileKey);
    }

    await Product.findByIdAndUpdate(
      productId,
      {
        productName: productName,
        productPrice: productPrice,
        salePercent: salePercent,
        productQuantity: productQuantity,
        productThumbnail: updatedThumbnail,
        productImages: updatedImageList,
        productDescription: productDescription,
        productOption: productOption,
        productCategory: productCategory,
        productSubCategory: productSubcategory,
        animalType: animalType,
      },
      { new: true }
    ).then(() => console.log("Sản phẩm đã được cập nhật"));

    // === UPDATE KIỂU NÀY LÀ FIX 1 TIẾNG ĐỒNG HỒ ===
    // const updatedProduct = await Product.findByIdAndUpdate(
    //   productId,
    //   {
    //     productName,
    //     productPrice,
    //     salePercent,
    //     productQuantity,
    //     productCategory,
    //     productSubcategory,
    //     animalType,
    //     productDescription,
    //     productOption,
    //     productDetailDescription,
    //     productImages: updatedImageList, // Updated images array
    //     productThumbnail: updatedThumbnail, // Updated thumbnail URL
    //   },
    //   { new: true } // Return the updated product
    // );
    success = true;
    message = true;

    return { success, message };
  } catch (error) {
    console.log(error);
  }
};

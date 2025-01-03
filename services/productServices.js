const Product = require("../models/Product");
const slugify = require("slugify");
const { uploadFileToS3, deleteFileFromS3 } = require("../utils/uploadToAWS.js");
const ProductDetailDescription = require("../models/ProductDetailDescription.js");
const { sendLowstockEmail } = require("../utils/sendLowstockEmail.js");
const User = require("../models/User.js");
const ReviewProducts = require("../models/ReviewProducts.js");
const Cart = require("../models/Cart.js");
const { default: mongoose } = require("mongoose");

// === Query Product ===
/**
 * Trả về pipeline bước lọc giá (nếu có minPrice, maxPrice).
 * Mục tiêu: Chỉ giữ lại doc có option thỏa giá trị min - max.
 */
function buildPriceRangeMatch(minPrice, maxPrice) {
  const pipeline = [];

  // Nếu cả minPrice và maxPrice đều tồn tại
  if (minPrice !== undefined && maxPrice !== undefined) {
    pipeline.push({
      $match: {
        "productOption.productPrice": { $gte: minPrice, $lte: maxPrice },
      },
    });
  } else if (minPrice !== undefined) {
    pipeline.push({
      $match: {
        "productOption.productPrice": { $gte: minPrice },
      },
    });
  } else if (maxPrice !== undefined) {
    pipeline.push({
      $match: {
        "productOption.productPrice": { $lte: maxPrice },
      },
    });
  }
  return pipeline;
}

/**
 * Build pipeline cho trường hợp lowStock
 */
function buildLowStockPipeline(query, sortBy, skip, limit, minPrice, maxPrice) {
  const lowStockThreshold = 5;
  let pipeline = [
    { $match: query },
    // Pipeline lọc giá (nếu có minPrice, maxPrice)
    ...buildPriceRangeMatch(minPrice, maxPrice),
    // Bắt buộc phải unwind để group, tính totalQuantity
    { $unwind: "$productOption" },
    {
      $group: {
        _id: "$_id",
        productName: { $first: "$productName" },
        productCategory: { $first: "$productCategory" },
        productSlug: { $first: "$productSlug" },
        productOption: { $push: "$productOption" },
        salePercent: { $first: "$salePercent" },
        productBuy: { $first: "$productBuy" },
        productThumbnail: { $first: "$productThumbnail" },
        productImages: { $first: "$productImages" },
        totalQuantity: { $sum: "$productOption.productQuantity" },
      },
    },
    { $match: { totalQuantity: { $lt: lowStockThreshold } } },
  ];

  // Thêm phần sort, skip, limit
  pipeline = pipeline.concat(buildSortPipeline(sortBy, skip, limit));
  return pipeline;
}

/**
 * Build pipeline sort + skip + limit
 */
function buildSortPipeline(sortBy, skip, limit) {
  let pipeline = [];

  if (sortBy === "productBuyDesc") {
    pipeline.push({ $sort: { productBuy: -1 } });
  } else if (sortBy === "productBuyAsc") {
    pipeline.push({ $sort: { productBuy: 1 } });
  } else if (sortBy === "latest") {
    pipeline.push({ $sort: { _id: -1 } });
  } else if (sortBy === "price") {
    pipeline.push(
      { $addFields: { maxPrice: { $max: "$productOption.productPrice" } } },
      { $sort: { maxPrice: 1 } }
    );
  } else if (sortBy === "priceDesc") {
    pipeline.push(
      { $addFields: { maxPrice: { $max: "$productOption.productPrice" } } },
      { $sort: { maxPrice: -1 } }
    );
  } else {
    // Mặc định
    pipeline.push({ $sort: { _id: 1 } });
  }

  // Cuối cùng mới skip, limit
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: limit });

  return pipeline;
}

/**
 * Build pipeline cho non-lowStock (dùng aggregate)
 * để lọc khoảng giá + sort theo giá
 */
function buildNonLowStockAggregatePipeline(
  query,
  sortBy,
  skip,
  limit,
  minPrice,
  maxPrice
) {
  let pipeline = [
    { $match: query },
    // Lọc theo giá (nếu có)
    ...buildPriceRangeMatch(minPrice, maxPrice),
  ];

  // Tuỳ theo sortBy
  if (
    sortBy === "price" ||
    sortBy === "priceDesc" ||
    sortBy === "productBuyAsc" ||
    sortBy === "productBuyDesc" ||
    sortBy === "latest"
  ) {
    // cần unwind + group, hay addFields?
    // tuỳ logic, ở đây demo addFields maxPrice, productBuy
    pipeline.push({ $unwind: "$productOption" });
    pipeline.push({
      $group: {
        _id: "$_id",
        productName: { $first: "$productName" },
        productCategory: { $first: "$productCategory" },
        productSlug: { $first: "$productSlug" },
        productOption: { $push: "$productOption" },
        salePercent: { $first: "$salePercent" },
        productBuy: { $first: "$productBuy" },
        productThumbnail: { $first: "$productThumbnail" },
        productImages: { $first: "$productImages" },
      },
    });
    // Ghép thêm pipeline sort
    pipeline = pipeline.concat(buildSortPipeline(sortBy, skip, limit));
  } else {
    // nếu sortBy không phải price, ta vẫn có thể dừng ở .find()
    // tuỳ theo bạn muốn unify 1 flow hay tách ra.
    // Ở đây mình unify hết sang aggregate pipeline luôn:
    pipeline = pipeline.concat([
      { $unwind: "$productOption" },
      {
        $group: {
          _id: "$_id",
          productName: { $first: "$productName" },
          productCategory: { $first: "$productCategory" },
          productSlug: { $first: "$productSlug" },
          productOption: { $push: "$productOption" },
          salePercent: { $first: "$salePercent" },
          productBuy: { $first: "$productBuy" },
          productThumbnail: { $first: "$productThumbnail" },
          productImages: { $first: "$productImages" },
        },
      },
      ...buildSortPipeline(null, skip, limit), // null => sort mặc định
    ]);
  }

  return pipeline;
}

/**
 * Tìm kiếm sản phẩm dựa trên các tiêu chí khác nhau
 * @param {object} filters - Các tiêu chí tìm kiếm sản phẩm
 * @param {string} filters.productCategory - Tên danh mục sản phẩm
 * @param {string} filters.productName - Tên sản phẩm
 * @param {number} filters.salePercent - Phần trăm giảm giá
 * @param {string} filters.productStatus - Trạng thái sản phẩm ("default" hoặc "lastest")
 * @param {number} filters.limit - Số lượng sản phẩm tối đa trả về
 * @param {number} filters.productBuy - Lượt mua của sản phẩm
 * @returns {Promise<Array>} Trả về danh sách các sản phẩm phù hợp với tiêu chí tìm kiếm
 */

// === Query Product ===
/**
 * Tìm kiếm sản phẩm dựa trên các tiêu chí khác nhau
 * @param {object} filters - Các tiêu chí tìm kiếm sản phẩm
 * @param {string} filters.productCategory - Tên danh mục sản phẩm
 * @param {string} filters.productName - Tên sản phẩm
 * @param {number} filters.salePercent - Phần trăm giảm giá
 * @param {string} filters.productStatus - Trạng thái sản phẩm ("default" hoặc "lastest")
 * @param {number} filters.limit - Số lượng sản phẩm tối đa trả về
 * @param {number} filters.productBuy - Lượt mua của sản phẩm
 * @returns {Promise<Array>} Trả về danh sách các sản phẩm phù hợp với tiêu chí tìm kiếm
 */
exports.queryProducts = async ({
  productCategory,
  productSlug,
  productName,
  salePercent,
  productStatus = "default",
  productBuy,
  limit = 10,
  page = 1,
  lowStock = false,
  sortBy,
  isHidden,
} = {}) => {
  try {
    const query = {};
    let sort = { _id: 1 }; // Default sort order

    // Build query conditions
    if (productName) {
      query.productName = new RegExp(productName, "i");
    }

    if (isHidden) {
      query.isHidden = isHidden;
    }

    if (salePercent) {
      if (salePercent == 0) {
        query.salePercent = 0;
      } else {
        query.salePercent = { $gte: salePercent };
      }
    }

    if (productCategory) {
      const categoriesArray = productCategory.split(",").map((id) => id.trim());
      query.productCategory = { $in: categoriesArray };
    }

    if (productSlug) {
      query.productSlug = new RegExp(productSlug, "i");
    }

    if (productBuy) {
      query.productBuy = { $gte: productBuy };
    }

    // Handle sorting
    if (sortBy) {
      if (sortBy === "productBuyDesc") {
        sort = { productBuy: -1 };
      } else if (sortBy === "productBuyAsc") {
        sort = { productBuy: 1 };
      } else if (sortBy === "latest") {
        sort = { _id: -1 };
      } else if (sortBy === "oldest") {
        sort = { _id: 1 };
      }
    } else if (productStatus === "latest") {
      sort = { _id: -1 };
    }

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    let products;
    let totalDocuments;
    let totalPages;

    if (lowStock) {
      const lowStockThreshold = 5;

      const pipeline = [
        { $match: query },
        { $unwind: "$productOption" },
        {
          $group: {
            _id: "$_id",
            productName: { $first: "$productName" },
            productCategory: { $first: "$productCategory" },
            productSlug: { $first: "$productSlug" },
            productOption: { $push: "$productOption" },
            salePercent: { $first: "$salePercent" },
            productBuy: { $first: "$productBuy" },
            productThumbnail: { $first: "$productThumbnail" },
            productImages: { $first: "$productImages" },
            totalQuantity: { $sum: "$productOption.productQuantity" },
          },
        },
        { $match: { totalQuantity: { $lt: lowStockThreshold } } },
        { $sort: sort },
        { $skip: skip },
        { $limit: limit },
      ];

      const countPipeline = [
        { $match: query },
        { $unwind: "$productOption" },
        {
          $group: {
            _id: "$_id",
            totalQuantity: { $sum: "$productOption.productQuantity" },
          },
        },
        { $match: { totalQuantity: { $lt: lowStockThreshold } } },
        { $count: "count" },
      ];

      const [results, countResults] = await Promise.all([
        Product.aggregate(pipeline),
        Product.aggregate(countPipeline),
      ]);

      products = results;
      totalDocuments = countResults.length > 0 ? countResults[0].count : 0;
    } else {
      totalDocuments = await Product.countDocuments(query);

      let queryResult = Product.find(query).limit(limit).skip(skip).sort(sort);

      if (productSlug) {
        queryResult = queryResult.populate("productDetailDescription");
      }

      products = await queryResult;
    }

    totalPages = Math.ceil(totalDocuments / limit);

    return {
      products,
      totalPages,
      currentPage: page,
    };
  } catch (err) {
    console.error("Error occurred:", err.message);
    throw err;
  }
};

exports.queryProductsWithPriceFilter = async ({
  productCategory,
  productSlug,
  productName,
  salePercent,
  productStatus = "default",
  productBuy,
  limit = 10,
  page = 1,
  sortBy,
  minPrice, // Giá tối thiểu
  maxPrice, // Giá tối đa
} = {}) => {
  try {
    // --------------------------------------------
    // 1. Tạo query cho các trường cơ bản (ngoài price)
    // --------------------------------------------
    const query = {};
    query.isHidden = false;

    if (productName) {
      query.productName = new RegExp(productName, "i");
    }

    if (salePercent !== undefined) {
      if (Number(salePercent) === 0) {
        query.salePercent = 0;
      } else {
        query.salePercent = { $gte: Number(salePercent) };
      }
    }

    if (productCategory) {
      query.productCategory = new mongoose.Types.ObjectId(productCategory);
    }

    if (productSlug) {
      query.productSlug = new RegExp(productSlug, "i");
    }

    if (productBuy) {
      query.productBuy = { $gte: Number(productBuy) };
    }

    // --------------------------------------------
    // 2. Tính skip, limit để phân trang
    // --------------------------------------------
    const skip = (page - 1) * limit;

    // --------------------------------------------
    // 3. Xây pipeline cho aggregate
    // --------------------------------------------
    const pipeline = [];

    // 3.1. $match: khớp query cơ bản
    pipeline.push({ $match: query });

    // 3.2. $unwind: tách các productOption để lọc theo price
    pipeline.push({ $unwind: "$productOption" });

    // 3.3. Lọc theo minPrice, maxPrice (nếu có)
    const priceFilter = {};
    if (minPrice !== undefined) {
      priceFilter.$gte = Number(minPrice);
    }
    if (maxPrice !== undefined) {
      priceFilter.$lte = Number(maxPrice);
    }
    if (Object.keys(priceFilter).length > 0) {
      pipeline.push({
        $match: {
          "productOption.productPrice": priceFilter,
        },
      });
    }

    // 3.4. $group để gom lại từng Product, đồng thời tính maxPrice, minPrice
    pipeline.push({
      $group: {
        _id: "$_id",
        // Lưu 1 doc gốc để lát replaceRoot
        doc: { $first: "$$ROOT" },
        // Gom tất cả option cho product này
        allOptions: { $push: "$productOption" },
        // Tính giá max/min
        maxPrice: { $max: "$productOption.productPrice" },
        minPrice: { $min: "$productOption.productPrice" },
      },
    });

    // 3.5. $addFields để tạo thêm 2 trường "maxPriceOption" và "minPriceOption"
    //     (filter từ allOptions)
    pipeline.push({
      $addFields: {
        "doc.productOption": "$allOptions",
        "doc.maxPrice": "$maxPrice",
        "doc.minPrice": "$minPrice",
        "doc.maxPriceOption": {
          $filter: {
            input: "$allOptions",
            as: "opt",
            cond: { $eq: ["$$opt.productPrice", "$maxPrice"] },
          },
        },
        "doc.minPriceOption": {
          $filter: {
            input: "$allOptions",
            as: "opt",
            cond: { $eq: ["$$opt.productPrice", "$minPrice"] },
          },
        },
      },
    });

    // 3.6. Đưa doc trở thành document chính
    pipeline.push({
      $replaceRoot: { newRoot: "$doc" },
    });

    // 3.7. Sắp xếp (nếu cần)
    // sortBy có thể là "priceDesc", "priceAsc", "productBuyDesc", ...
    // Ở ví dụ này, minh họa 2 kiểu sort: priceDesc & priceAsc.
    if (sortBy === "priceDesc") {
      pipeline.push({ $sort: { maxPrice: -1 } });
    } else if (sortBy === "priceAsc") {
      pipeline.push({ $sort: { minPrice: 1 } });
    } else if (sortBy === "productBuyDesc") {
      pipeline.push({ $sort: { productBuy: -1 } });
    } else if (sortBy === "productBuyAsc") {
      pipeline.push({ $sort: { productBuy: 1 } });
    } else if (sortBy === "latest") {
      pipeline.push({ $sort: { _id: -1 } });
    } else if (sortBy === "oldest") {
      pipeline.push({ $sort: { _id: 1 } });
    } else if (productStatus === "latest") {
      pipeline.push({ $sort: { _id: -1 } });
    } else {
      // Mặc định
      pipeline.push({ $sort: { _id: 1 } });
    }

    // 3.8. Áp dụng skip và limit
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: Number(limit) });

    // --------------------------------------------
    // 4. Tính tổng số documents cho pagination
    //    (phải build 1 pipeline riêng để đếm)
    // --------------------------------------------
    const countPipeline = [{ $match: query }, { $unwind: "$productOption" }];
    if (Object.keys(priceFilter).length > 0) {
      countPipeline.push({
        $match: {
          "productOption.productPrice": priceFilter,
        },
      });
    }
    // Gom để đếm unique _id
    countPipeline.push({
      $group: { _id: "$_id" },
    });
    countPipeline.push({
      $count: "count",
    });

    // --------------------------------------------
    // 5. Chạy pipeline
    // --------------------------------------------
    const [products, countResult] = await Promise.all([
      Product.aggregate(pipeline),
      Product.aggregate(countPipeline),
    ]);

    const totalDocuments = countResult.length > 0 ? countResult[0].count : 0;
    const totalPages = Math.ceil(totalDocuments / limit);

    // Populate productDetailDescription nếu cần
    // (Vì aggregate không tự populate như .find().populate())
    // Bạn có thể query ngược _id => populate, hoặc convert sang .lookup()...

    return {
      products,
      totalPages,
      currentPage: page,
    };
  } catch (err) {
    console.error("Error occurred:", err);
    throw err;
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
    const trimmedName = productName.trim().replace(/\s+/g, " ");

    const duplicatedProduct = await Product.findOne({
      productName: trimmedName,
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

exports.checkDuplicatedEditProduct = async (productId, productName) => {
  try {
    // Trim the product name and replace multiple spaces with a single space
    const trimmedName = productName.trim().replace(/\s+/g, " ");

    // Find a product with the same name
    const duplicatedProduct = await Product.findOne({
      productName: trimmedName,
    });

    // If a product with the same name is found
    if (duplicatedProduct) {
      // Check if the found product's ID is different from the current product's ID
      if (duplicatedProduct._id.toString() !== productId.toString()) {
        // Return true if the IDs don't match, meaning the name is duplicated for another product
        return true;
      }
    }

    // Return false if no duplicate name was found or if it's the same product being edited
    return false;
  } catch (error) {
    console.error("Error checking duplicated product:", error);
    throw error; // Throw error to handle it in the calling code
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
 * @param {string} productDescription - Mô tả ngắn sản phẩm
 * @param {string} productDetailDescription - Mô tả sản phẩm chi tiết như chất liệu, dinh dưỡng
 * @param {string} productOption - Tùy chọn của sản phẩm, cân nặng, màu sắc
 * @param {object} files - Object chứa các tệp hình ảnh của sản phẩm
 *
 * Thêm sản phẩm bao gồm hình ảnh và thông tin sản phẩm vào cơ sở dữ liệu.
 */
exports.insertProduct = async ({
  productName,
  salePercent,
  productCategory,
  productDescription,
  productDetailDescription,
  productOption, // productOption now contains price and quantity for each option
  files,
}) => {
  try {
    let success;
    let message;

    // Check for duplicated product name
    const isProductNameDuplicated = await this.checkDuplicatedProduct(
      productName
    );

    if (isProductNameDuplicated) {
      success = false;
      message = "Tên sản phẩm đã tồn tại";
      return { success, message };
    }

    const productSlug = slugify(productName, { lower: true });

    // Handle file uploads for productThumbnail and productImages
    const productThumbnail = files.productThumbnail
      ? await uploadFileToS3(files.productThumbnail[0])
      : null;

    const productImages = files.productImages
      ? await Promise.all(files.productImages.map(uploadFileToS3))
      : [];

    // Create product detail description if provided
    let newProductDetailDescription = null;
    if (productDetailDescription) {
      newProductDetailDescription = new ProductDetailDescription({
        detailContent: productDetailDescription,
      });
      await newProductDetailDescription.save();
    }

    const productOptionsArray = Object.values({ ...productOption });

    // Create new product
    const newProduct = new Product({
      productName: productName,
      salePercent: salePercent,
      productSlug: productSlug,
      productThumbnail: productThumbnail,
      productImages: productImages,
      productDescription: productDescription,
      productOption: productOptionsArray.map((option) => {
        return {
          name: option.name,
          productPrice: option.price,
          productQuantity: option.quantity,
        };
      }),
      productDetailDescription: newProductDetailDescription?._id || null,
      productCategory: productCategory,
    });

    // Save new product to the database
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

exports.deleteProductOld = async (productId) => {
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

    const removeProductFromCart = async (productId) => {
      let hasMore = true;
      while (hasMore) {
        const carts = await Cart.find({ "cartItems.productId": productId })
          .limit(100)
          .exec();

        if (carts.length === 0) {
          hasMore = false;
          break;
        }

        for (const cart of carts) {
          cart.cartItems = cart.cartItems.filter(
            (item) => !item.productId.equals(productId)
          );
          await cart.save();
        }
      }
    };

    await removeProductFromCart(productId);

    console.log(
      `Product with ID ${productId} has been deleted along with its images.`
    );
  } catch (error) {
    console.error("Error in product deletion service:", error);
    throw error;
  }
};

exports.deleteProduct = async (productId) => {
  try {
    await Product.findByIdAndUpdate(productId, { isHidden: true });
  } catch (error) {
    console.log(error.message);
  }
};

exports.unHidden = async (productId) => {
  try {
    await Product.findByIdAndUpdate(productId, { isHidden: false });
  } catch (error) {
    console.log(error.message);
  }
};

exports.deleteProductsByCategory = async (categoryId) => {
  try {
    // Tìm tất cả sản phẩm có categoryId cần xóa
    const products = await Product.find({ productCategory: categoryId });

    if (products.length === 0) {
      console.log("Không có sản phẩm nào để xóa.");
      return;
    }

    // Hàm handle xóa ảnh khỏi S3 theo URL
    const deleteImageFromS3 = async (imageUrl) => {
      const fileKey = imageUrl.split(".com/")[1]; // Lấy fileKey từ URL
      await deleteFileFromS3(fileKey);
    };

    // Duyệt qua từng sản phẩm và xóa
    for (const product of products) {
      const detailId = product.productDetailDescription;
      // Xóa chi tiết mô tả sản phẩm
      if (detailId) {
        await ProductDetailDescription.findByIdAndDelete(detailId);
      }

      // Xóa thumbnail
      if (product.productThumbnail) {
        await deleteImageFromS3(product.productThumbnail);
      }

      // Xóa tất cả ảnh trong productImages
      if (product.productImages && product.productImages.length > 0) {
        for (const imageUrl of product.productImages) {
          await deleteImageFromS3(imageUrl);
        }
      }

      // Xóa sản phẩm khỏi cơ sở dữ liệu
      await Product.deleteOne({ _id: product._id });
    }

    console.log(
      `Tất cả sản phẩm thuộc danh mục ID ${categoryId} đã được xóa cùng với hình ảnh.`
    );
  } catch (error) {
    console.error("Error in deleteProductsByCategory service:", error);
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
  salePercent,
  productCategory,
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

    const isProductNameDuplicated = await this.checkDuplicatedEditProduct(
      productId,
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

    const productOptionsArray = Object.values({ ...productOption });

    await Product.findByIdAndUpdate(
      productId,
      {
        productName: productName,
        salePercent: salePercent,
        productThumbnail: updatedThumbnail,
        productImages: updatedImageList,
        productDescription: productDescription,
        productOption: productOptionsArray.map((option) => {
          return {
            name: option.name,
            productPrice: option.price,
            productQuantity: option.quantity,
          };
        }),
        productCategory: productCategory,
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

exports.lowstockNofi = async ({ productId }) => {
  try {
    const product = await Product.findById(productId).populate("productOption");

    if (!product) {
      console.log("Không tìm thấy sản phẩm với ID đã cho");
    }

    const managers = await User.find(
      { userRole: "manager" },
      "userEmail displayName"
    );

    if (managers.length === 0) {
      console.log("Không tìm thấy user no với vai trò quản lý");
    }

    const productInfo = {
      productName: product.productName,
      productOption: product.productOption.map((option) => `${option.name}`),
      productQuantity: product.productOption.reduce(
        (sum, option) => sum + option.productQuantity,
        0
      ),
      productImage: product.productThumbnail,
    };

    for (const manager of managers) {
      await sendLowstockEmail(manager.userEmail, [productInfo]);
    }

    console.log("Thông báo low stock đã được gửi thành công");
  } catch (error) {
    console.log("Lỗi xảy ra:", error);
    throw error;
  }
};

exports.queryReviews = async ({
  userId,
  ratingStatus,
  productId,
  publicStatus,
  reviewId,
  sort,
  star,
  page = 1,
  limit = 10,
}) => {
  try {
    if (productId) {
      const filter = {};

      // Xử lý ratingStatus
      if (ratingStatus === "yes") {
        filter.rating = { $ne: null }; // Rating khác null
      } else if (ratingStatus === "no") {
        filter.rating = null; // Rating bằng null
      } else {
        filter.rating = { $ne: null }; // Mặc định tìm rating khác null
      }

      if (userId) {
        filter.userId = userId;
      }

      if (publicStatus) {
        filter.publicStatus = publicStatus;
      }

      if (productId) {
        filter.productId = productId;
      }

      if (reviewId) {
        filter._id = reviewId;
      }

      if (star) {
        filter.rating = star;
      }

      const sortOptions = { createdAt: -1 };
      if (sort === "asc") {
        sortOptions.rating = 1;
      } else if (sort === "desc") {
        sortOptions.rating = -1;
      }

      const skip = (page - 1) * limit;

      const reviews = await ReviewProducts.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate("userId", "userEmail")
        .populate("productId", "productSlug");

      const totalReviews = await ReviewProducts.countDocuments(filter);

      return {
        reviews,
        page,
        totalPages: Math.ceil(totalReviews / limit),
      };
    }
  } catch (error) {
    console.error("Error in queryReviews:", error);
    throw error;
  }
};

exports.updateReview = async (reviewId, rating, reviewContent) => {
  try {
    const updatedReview = await ReviewProducts.findByIdAndUpdate(
      reviewId,
      {
        rating,
        reviewContent,
      },
      { new: true }
    );

    return updatedReview;
  } catch (error) {
    console.error("Error in updateReview:", error);
    throw error;
  }
};

exports.publicReview = async (reviewId, newReviewStatus) => {
  try {
    const updatedReview = await ReviewProducts.findByIdAndUpdate(
      reviewId,
      {
        publicStatus: newReviewStatus,
      },
      { new: true }
    );

    return updatedReview;
  } catch (error) {
    console.error("Error in publicReview:", error);
    throw error;
  }
};

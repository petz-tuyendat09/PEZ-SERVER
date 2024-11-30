const Product = require("../models/Product");
const productService = require("../services/productServices");

exports.getProductsWithPagination = async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
    };

    const result = await productService.getProductsWithPagination(options);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * Controller để tìm kiếm sản phẩm
 * @param {object} req
 * @param {object} res
 * @returns {Promise<void>}
 */
exports.queryProducts = async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      fromPrice: req.query.fromPrice,
      toPrice: req.query.toPrice,
      productCategory: Array.isArray(req.query.productCategory)
        ? req.query.productCategory
        : req.query.productCategory
        ? req.query.productCategory.split(',')
        : [],
      salePercent: req.query.salePercent,
      productStatus: req.query.productStatus,
      productBuy: req.query.productBuy,
      lowStock: req.query.lowStock === "true",
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      sortBy: req.query.sortBy,
      'productOption.name': Array.isArray(req.query.size) ? req.query.size : req.query.size ? req.query.size.split(',') : [],
    };

    const query = {};
    
    if (filters.search) {
      query.$or = [
        { productName: { $regex: '.*' + searchRegexVietnamese(filters.search) + '.*', $options: 'i' } }
      ];
    }

    const fromPrice = filters.fromPrice ? parseFloat(filters.fromPrice) : null;
    const toPrice = filters.toPrice ? parseFloat(filters.toPrice) : null;
    if (fromPrice && toPrice) {
      query['productOption.productPrice'] = { 
        $gte: fromPrice, 
        $lte: toPrice 
      };
    } else if (fromPrice) {
      query['productOption.productPrice'] = { 
        $gte: fromPrice 
      };
    } else if (toPrice) {
      query['productOption.productPrice'] = { 
        $lte: toPrice 
      };
    }

    if (filters['productOption.name'].length > 0) {
      query['productOption.name'] = { $in: filters['productOption.name'] };
    }

    if (filters.productCategory && filters.productCategory.length > 0) {
      query.productCategory = { $in: filters.productCategory };
    }
    if (filters.salePercent) query.salePercent = filters.salePercent;
    if (filters.productStatus) query.productStatus = filters.productStatus;
    if (filters.productBuy) query.productBuy = { $gt: 100 };
    if (filters.lowStock) query.stock = { $lte: 10 };

    let sortOptions = {};
    if (filters.sortBy === "3") {
      sortOptions = { "productOption.productPrice": -1 };
    } else if (filters.sortBy === "4") {
      sortOptions = { "productOption.productPrice": 1 };
    } else if (filters.sortBy === "1") {
      query.productBuy = { $gte: 100 };
    }

    const limit = filters.limit;
    const skip = (filters.page - 1) * limit;

    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const totalCount = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    return res.status(200).json({
      currentPage: filters.page,
      totalPages,
      limit,
      totalCount,
      products,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.queryProductsByCateId = async (req, res) => {
  const { categoryId } = req.query;

  if (!categoryId) {
    return res.status(400).json({ error: "categoryId is required" });
  }

  try {
    const products = await Product.find({ productCategory: categoryId });
    return res.status(200).json(products);
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ error: "Internal Server Error", message: err.message });
  }
};

exports.getTrendingProducts = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ productBuy: -1 });
    return res.status(200).json(products);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.getPromotionalProducts = async (req, res) => {
  try {
    const products = await Product.find({ salePercent: 1 });
    return res.status(200).json(products);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.insertProduct = async (req, res) => {
  try {
    const newProductInfo = {
      productName: req.body.productName,
      salePercent: req.body.salePercent,
      productCategory: req.body.productCategory,
      productSubcategory: req.body.productSubcategory,
      productDescription: req.body.productDescription,
      productOption: req.body.productOption,
      productDetailDescription: req.body.productDetailDescription,
      files: req.files,
    };

    const { success, message } = await productService.insertProduct(
      newProductInfo
    );

    if (!success) {
      return res.status(401).json({ message: message });
    }
    return res.status(200).json({ message: message });
  } catch (error) {
    console.log(error);
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { productId } = req.body;
    const result = productService.deleteProduct(productId);
    if (!result) {
      return res.status(200).json({ message: "Sản phẩm không tồn tại" });
    }

    return res.status(200).json({ message: "Xóa thành công" });
  } catch (err) {
    console.log("Error in Delete Product Controller:", err);
  }
};

exports.editProduct = async (req, res) => {
  try {
    const editedProductInfo = {
      productId: req.body.productId,
      productName: req.body.productName,
      salePercent: req.body.salePercent,
      productCategory: req.body.productCategory,
      productSubcategory: req.body.productSubcategory,
      productDescription: req.body.productDescription,
      productOption: req.body.productOption,
      productDetailDescription: req.body.productDetailDescription,
      removeImages: req.body.removeImages,
      removeThumbnail: req.body.removeThumbnail,
      files: req.files,
    };
    const { success, message } = await productService.editProduct(
      editedProductInfo
    );
    if (!success) {
      return res.status(401).json({ message: message });
    }

    res.status(200).json({ message: message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.lowstockNofi = async (req, res) => {
  try {
    const { productId } = req.body;
    productService.lowstockNofi({ productId });

    res.status(200).json({ message: "Thông báo thành công" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error" });
  }
};

exports.getReview = async (req, res) => {
  try {
    const {
      userId,
      ratingStatus,
      productId,
      publicStatus,
      reviewId,
      sort,
      star,
      page = 1,
      limit = 10,
    } = req.query;
    const reviewsData = await productService.queryReviews({
      userId,
      ratingStatus,
      productId,
      publicStatus,
      reviewId,
      sort,
      star,
      page: parseInt(page),
      limit: parseInt(limit),
    });
    res.status(200).json(reviewsData);
  } catch (error) {
    console.log("Error in getReview:", error);
    res.status(500).json({ message: "Lỗi khi get reviews" });
  }
};

exports.review = async (req, res) => {
  try {
    const { reviewId, rating, reviewContent } = req.body;

    const updatedReview = await productService.updateReview(
      reviewId,
      rating,
      reviewContent
    );

    if (!updatedReview) {
      return res.status(404).json({ message: "Review không tồn tại" });
    }

    res.status(200).json({
      message: "Cập nhật review thành công",
      updatedReview,
    });
  } catch (error) {
    console.error("Error in review:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật review" });
  }
};

exports.publicReview = async (req, res) => {
  try {
    const { reviewId, newReviewStatus } = req.body;

    const updatedReview = await productService.publicReview(
      reviewId,
      newReviewStatus
    );

    if (!updatedReview) {
      return res.status(404).json({ message: "Review không tồn tại" });
    }

    res.status(200).json({
      message: "Cập nhật review thành công",
      updatedReview,
    });
  } catch (error) {
    console.error("Error in review:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật review" });
  }
};

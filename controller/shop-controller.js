const { searchRegexVietnamese } = require("../helpers/searchHelper");
const Product = require("../models/Product");
exports.queryProductsNguyet = async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      fromPrice: req.query.fromPrice,
      toPrice: req.query.toPrice,
      productCategory: Array.isArray(req.query.productCategory)
        ? req.query.productCategory
        : req.query.productCategory
        ? req.query.productCategory.split(",")
        : [],
      salePercent: req.query.salePercent,
      productStatus: req.query.productStatus,
      productBuy: req.query.productBuy,
      lowStock: req.query.lowStock === "true",
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 10,
      sortBy: req.query.sortBy,
      "productOption.name": Array.isArray(req.query.size)
        ? req.query.size
        : req.query.size
        ? req.query.size.split(",")
        : [],
    };

    const query = {};

    if (filters.search) {
      query.$or = [
        {
          productName: {
            $regex: ".*" + searchRegexVietnamese(filters.search) + ".*",
            $options: "i",
          },
        },
      ];
    }

    const fromPrice = filters.fromPrice ? parseFloat(filters.fromPrice) : null;
    const toPrice = filters.toPrice ? parseFloat(filters.toPrice) : null;
    if (fromPrice && toPrice) {
      query["productOption.productPrice"] = {
        $gte: fromPrice,
        $lte: toPrice,
      };
    } else if (fromPrice) {
      query["productOption.productPrice"] = {
        $gte: fromPrice,
      };
    } else if (toPrice) {
      query["productOption.productPrice"] = {
        $lte: toPrice,
      };
    }

    if (filters["productOption.name"].length > 0) {
      query["productOption.name"] = { $in: filters["productOption.name"] };
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

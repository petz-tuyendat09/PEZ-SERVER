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
      productCategory: req.query.productCategory,
      productSlug: req.query.productSlug,
      productSubCategory: req.query.productSubCategory,
      productName: req.query.productName,
      salePercent: req.query.salePercent,
      productStatus: req.query.productStatus,
      productBuy: req.query.productBuy,
      page: req.query.page,
      limit: parseInt(req.query.limit, 10) || 20,
    };

    const products = await productService.queryProducts(filters);
    return res.status(200).json(products);
  } catch (err) {
    return res.status(500).json({ error: err.message });
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

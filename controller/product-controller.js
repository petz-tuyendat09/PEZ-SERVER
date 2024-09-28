const Product = require("../models/Product");
const Categories = require("../models/Categories");
const productService = require("../services/productServices");
const fs = require("fs");
const path = require("path");

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
      animalType: req.query.animalType,
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

exports.getTrendingProducts = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ productBuy: -1 });
    return res.status(200).json(products);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.insertProduct = async (req, res) => {
  try {
    const newProductInfo = {
      productName: req.body.productName,
      productPrice: req.body.productPrice,
      salePercent: req.body.salePercent,
      productQuantity: req.body.productQuantity,
      productCategory: req.body.productCategory,
      productSubcategory: req.body.productSubcategory,
      animalType: req.body.animalType,
      productDescription: req.body.productDescription,
      files: req.files,
    };

    const isProductExists = await productService.checkDuplicatedProduct(
      newProductInfo.productName,
      req.files
    );

    if (isProductExists) {
      return res.status(409).json({ message: "Product duplicated" });
    }

    await productService.insertProduct(newProductInfo).then(() => {
      console.log("Product has been inserted to database");
    });

    return { status: 201, message: "Product has been inserted to database" };
  } catch (error) {
    console.log(error);
  }
};

exports.deleteProduct = async (id) => {
  try {
    //  Delete product from database
    const deleteProduct = await Product.findByIdAndDelete(id);

    if (!deleteProduct) {
      throw new Error("Product not found");
    }

    // Delete product from categories
    await Categories.updateMany(
      { "products.productId": id },
      { $pull: { products: { productId: id } } }
    );

    await Skintype.updateMany(
      { "products.productId": id },
      { $pull: { products: { productId: id } } }
    );

    const filePath = path.join(
      __dirname,
      "../public/images/products",
      deleteProduct.productImage
    );

    fs.unlink(filePath, (err) => {
      if (err) console.error("Failed to delete file:", err);
    });

    console.log(
      `Product with ID ${id} has been deleted and removed from categories`
    );
  } catch (err) {
    throw new Error(err.message);
  }
};

exports.updateProduct = async (id, body, imageName) => {
  try {
    const {
      productName,
      productPrice,
      salePercent,

      productQuantity,
      productCategory,
      productSkinType,
    } = body;

    const pro = await Product.findById(id);

    if (!pro) {
      throw new Error("Không tìm thấy sản phẩm");
    }

    const duplicatedProduct = await Product.findOne({
      productName: productName,
    });

    if (duplicatedProduct) {
      return { message: "Duplicated name" };
    }

    let categoryFind = null;
    if (productCategory) {
      categoryFind = await Categories.findOne({ _id: productCategory });
    }
    let skintypeFind = null;
    if (productSkinType) {
      skintypeFind = await Skintype.findOne({ _id: productSkintype });
    }

    const cateUpdate = categoryFind
      ? {
          categoryId: categoryFind._id,
          categoryName: categoryFind.name,
        }
      : pro.productCategory;

    const skinTypeUpdate = skintypeFind
      ? {
          skinTypeId: skintypeFind._id,
          skinTypeName: skintypeFind.skinType,
        }
      : pro.skinType;

    if (imageName != "") {
      const filePath = path.join(
        __dirname,
        "../public/images/products",
        pro.productImage
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted file: ${filePath}`);
      }
    }

    const updateProduct = await Product.findByIdAndUpdate(
      { _id: id },
      {
        productName: productName !== "" ? productName : pro.productName,
        productPrice: productPrice == 0 ? pro.productPrice : productPrice,
        salePercent: salePercent == 0 ? pro.salePercent : salePercent,
        productQuantity:
          productQuantity === 0 ? pro.productQuantity : productQuantity,
        productImage: imageName || pro.productImage,
        productCategory: cateUpdate,
        skinType: skinTypeUpdate,
      }
    );
    return updateProduct;
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.uploadImageCKEditor = async (req, res) => {
  console.log(req.files);
  return res.status(200).json({
    uploaded: true,
  });
};

exports.deleteImageCKEditor = async (req, res) => {
  console.log("body data:", req.body);
  // const filePath = path.join(
  //   __dirname,
  //   "../public/images/products",
  //   deleteProduct.productImage
  // );

  // fs.unlink(filePath, (err) => {
  //   if (err) console.error("Failed to delete file:", err);
  // });

  console.log(`Image has been deleted`);

  return res.status(200).json({
    uploaded: true,
  });
};

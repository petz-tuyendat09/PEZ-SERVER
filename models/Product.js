const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const productSchema = new Schema({
  productName: {
    type: String,
    required: true,
  },
  productPrice: {
    type: Number,
    required: true,
  },
  salePercent: {
    type: Number,
    required: false,
    default: 0,
  },
  productBuy: {
    type: Number,
    required: false,
    default: 0,
  },
  productSlug: {
    type: String,
    required: true,
  },
  productImage: {
    type: String,
    required: false,
    default: "no-img.png",
  },
  productQuantity: {
    type: Number,
    required: true,
  },
  productCategory: {
    categoryId: {
      type: ObjectId,
      ref: "Categories",
      required: true,
    },
    categoryName: {
      type: String,
      required: true,
    },
  },
  productSubcategories: {
    type: String,
    required: true,
    enum: ["Cat", "Dog"],
  },
  productDescription: {
    type: String,
    required: false,
    default: "Updating...",
  },
});

module.exports = mongoose.model("Products", productSchema, "products");

// sau cai productSchema la collection muon su dung, neu k co thi mongoDB su dung products la default,
// truong hop collection ten la product thi find k ra, phai chi dinh collection la product

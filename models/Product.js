const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const productSchema = new Schema({
  productName: {
    type: String,
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
  productThumbnail: {
    type: String,
    required: false,
    default: "no-img.png",
  },
  productImages: [
    {
      type: String,
      required: false,
    },
  ],
  productCategory: {
    type: ObjectId,
    ref: "Categories",
    required: true,
  },
  productSubCategory: {
    type: ObjectId,
    required: true,
    ref: "Subcategories",
  },
  productDescription: {
    type: String,
    required: false,
    default: "Đang cập nhật...",
  },
  productOption: [
    {
      name: { type: String, required: true },
      productPrice: { type: Number, required: true }, // Add price field
      productQuantity: { type: Number, required: true }, // Add quantity field
    },
  ],
  productDetailDescription: {
    type: ObjectId,
    required: false,
    default: null,
    ref: "ProductDetailDescription",
  },
});

productSchema.index({ productName: 1 });

module.exports = mongoose.model("Products", productSchema, "products");

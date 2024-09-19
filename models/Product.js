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
  productQuantity: {
    type: Number,
    required: true,
  },
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
  animalType: {
    type: String,
    required: false,
    enum: ["Chó", "Mèo"],
  },
  productDescription: {
    type: String,
    required: false,
    default: "Đang cập nhật...",
  },
  productWeight: [
    {
      type: String,
      required: true,
    },
  ],
  productDetailDescription: {
    type: ObjectId,
    required: false,
    default: null,
    ref: "ProductDetailDescription",
  },
  productRating: {
    type: Number,
    required: false,
    default: 0,
  },
  ratingCount: {
    type: Number,
    required: false,
    default: 0,
  },
});

productSchema.index({ productName: 1 });

module.exports = mongoose.model("Products", productSchema, "products");

// sau cai productSchema la collection muon su dung, neu k co thi mongoDB su dung products la default,
// truong hop collection ten la product thi find k ra, phai chi dinh collection la product

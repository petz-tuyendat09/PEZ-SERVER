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
  productImage: [
    {
      type: String,
      required: false,
    },
  ],
  productQuantity: {
    type: Number,
    required: true,
  },
  categoryId: {
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
});

productSchema.index({ productName: 1 });
module.exports = mongoose.model("Products", productSchema, "products");

// sau cai productSchema la collection muon su dung, neu k co thi mongoDB su dung products la default,
// truong hop collection ten la product thi find k ra, phai chi dinh collection la product

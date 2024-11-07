const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const productReviewSchema = new Schema(
  {
    userId: {
      type: ObjectId,
      required: true,
      ref: "User",
    },
    rating: {
      type: Number,
      default: null,
      min: 1,
      max: 5,
    },
    productId: {
      type: ObjectId,
      required: true,
      ref: "Products",
    },
    productName: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

module.exports = mongoose.model(
  "ProductReview",
  productReviewSchema,
  "productReviews"
);

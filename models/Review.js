const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const customerReviewSchema = new Schema(
  {
    customerName: {
      type: String,
      required: true,
    },
    services: [
      {
        type: ObjectId,
        required: true,
        ref: "Service", // Tham chiếu tới model "Service"
      },
    ],
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: false,
    },
    userId: {
      type: ObjectId,
      required: true,
      ref: "User", // Tham chiếu tới model "User"
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Chỉ tạo trường createdAt
  }
);

module.exports = mongoose.model(
  "CustomerReview",
  customerReviewSchema,
  "customerReviews"
);

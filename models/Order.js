const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const orderSchema = new Schema(
  {
    productId: [
      {
        productId: {
          type: ObjectId,
          required: true,
          ref: "Product",
        },
        productQuantity: {
          type: Number,
          required: true,
        },
      },
    ],
    orderTotal: {
      type: Number,
      required: true,
    },
    voucherId: {
      type: String,
      required: false,
    },
    orderDiscount: {
      type: Number,
      required: true,
    },
    userId: {
      type: ObjectId,
      required: true,
      ref: "User",
    },
    orderAfterDiscount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "BANKING"],
      required: true,
    },
    orderStatus: {
      type: String,
      enum: ["PENDING", "DELIVERING", "CANCEL", "REFUND"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema, "orders");

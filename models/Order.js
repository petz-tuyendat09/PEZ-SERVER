const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const orderSchema = new Schema(
  {
    customerName: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
    },
    customerAddress: {
      type: String,
      required: true,
    },
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
        salePercent: {
          type: Number,
          require: true,
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
      required: false,
      ref: "User",
    },
    totalAfterDiscount: {
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

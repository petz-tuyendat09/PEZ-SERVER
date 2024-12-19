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
      required: false,
      default: null,
    },
    customerAddress: {
      type: String,
      required: true,
    },
    products: [
      {
        productId: {
          type: ObjectId,
          required: true,
          ref: "Products",
        },
        productQuantity: {
          type: Number,
          required: true,
        },
        productName: {
          type: String,
          required: true,
        },
        productOption: {
          type: String,
          required: true,
        },
        productPrice: {
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
      enum: [
        "PENDING",
        "PAID",
        "FAILED",
        "DELIVERING",
        "DELIVERED",
        "CANCELLED",
      ],
      default: "PENDING",
    },
    transIDMomo: {
      type: String,
      required: false,
      default: undefined,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema, "orders");

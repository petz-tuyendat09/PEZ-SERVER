const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const voucherSchema = new Schema(
  {
    voucherPoint: {
      type: Number,
      required: true,
    },
    totalToUse: {
      type: Number,
      required: false,
      default: undefined,
    },
    limitedDate: {
      type: Date,
      required: false,
      default: undefined,
    },
    voucherQuantity: {
      type: Number,
      required: false,
      default: null,
    },
    salePercent: {
      type: Number,
      required: false,
    },
    isHidden: {
      type: Boolean,
      required: false,
      default: false,
    },
    voucherType: {
      type: String,
      enum: ["ON_ORDER_SAVINGS", "FLAT_DISCOUNT", "SHIPPING_DISCOUNT"],
      required: true,
    },
    flatDiscountAmount: {
      type: Number,
      required: function () {
        return this.voucherType === "FLAT_DISCOUNT";
      },
    },
    shippingDiscountAmount: {
      type: Number,
      required: function () {
        return this.voucherType === "SHIPPING_DISCOUNT";
      },
    },
    expirationDate: {
      type: Number,
      required: false,
    },
    maxRedemption: {
      type: Number,
      require: false,
    },
    voucherDescription: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Voucher", voucherSchema, "vouchers");

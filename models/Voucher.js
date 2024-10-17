const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const voucherSchema = new Schema(
  {
    voucherPoint: {
      type: Number,
      required: true,
    },
    salePercent: {
      type: Number,
      required: true,
    },
    voucherType: {
      type: String,
      enum: ["PER_ITEM_SAVINGS", "ON_ORDER_SAVINGS"], // Bạn có thể thêm các giá trị khác vào enum nếu cần
      required: true,
    },
    voucherDescription: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // Tự động tạo createdAt và updatedAt
  }
);

module.exports = mongoose.model("Voucher", voucherSchema, "vouchers");

const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const userVoucherSchema = new Schema({
  userId: {
    type: ObjectId,
    ref: "User",
    required: true,
  },
  vouchers: [
    {
      voucherId: {
        type: ObjectId,
        ref: "Voucher",
        required: true,
        index: true,
      },
      quantity: {
        type: Number,
        required: true,
        default: 1,
      },
      expirationDate: {
        type: Date,
        required: true,
      },
      redemptionCount: {
        type: Number,
        default: 0, // Số lần user đã đổi voucher này
        required: true,
      },
    },
  ],
});

module.exports = mongoose.model(
  "UserVoucher",
  userVoucherSchema,
  "userVoucher"
);

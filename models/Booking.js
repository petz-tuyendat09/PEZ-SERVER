const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const bookingSchema = new Schema(
  {
    userId: {
      type: ObjectId,
      ref: "User",
      default: null,
    },
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      required: true,
    },
    customerPhone: {
      type: String,
      required: true,
    },
    service: [
      {
        type: ObjectId,
        ref: "Service",
        required: true,
      },
    ],
    bookingDate: {
      type: Date,
      required: true,
    },
    bookingStatus: {
      type: String,
      enum: ["Booked", "Done", "Confirm", "Paid", "Canceled"],
      default: "Booked",
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "BANKING"],
      default: "COD",
    },
    reviewStatus: {
      type: Boolean,
      default: false,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    discountAmount: {
      type: Number,
      required: false,
      default: 0,
    },
    totalAfterDiscount: {
      type: Number,
      required: false,
      default: 0,
    },
    transIDMomo: {
      type: Number,
      required: false,
    },
    voucherId: {
      type: ObjectId,
      ref: "Voucher",
      required: false,
    },
    bookingHours: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Booking", bookingSchema, "bookings");

const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const bookingSchema = new Schema({
  userId: {
    type: ObjectId,
    ref: "User",
    default: null,
  },
  customerName: {
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
    enum: ["Booked", "Done", "Cancel"],
    default: "Booked",
  },
  bookingHours: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Booking", bookingSchema, "bookings");

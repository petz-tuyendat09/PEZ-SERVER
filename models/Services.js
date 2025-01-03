const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const serviceSchema = Schema({
  serviceName: {
    type: String,
    required: true,
  },
  bookingAmount: {
    type: Number,
    required: false,
    default: 0,
  },
  servicePrice: {
    type: Number,
    required: true,
  },
  serviceDuration: {
    type: Number,
    required: true,
  },
  isHidden: {
    type: Boolean,
    required: false,
    default: false,
  },
  serviceType: {
    type: String,
    enum: ["NAIL_CARE", "CLEAN", "HAIR", "MASSAGE", "COMBO"],
    required: true,
  },
});

module.exports = mongoose.model("Service", serviceSchema);

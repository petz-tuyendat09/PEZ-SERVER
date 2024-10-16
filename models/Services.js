const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const serviceSchema = Schema({
  serviceName: {
    type: String,
    required: true,
  },
  bookingAmount: {
    type: Number,
    required: true,
  },
  servicePrice: {
    type: Number,
    required: true,
  },
  serviceDuration: {
    type: Number,
    required: true,
  },
  serviceDescription: {
    type: String,
    required: true,
  },
  serviceType: {
    type: String,
    enum: ["NAIL_CARE", "CLEAN", "HAIR", "MASSAGE", "COMBO"],
    required: true,
  },
});

module.exports = mongoose.model("Service", serviceSchema);

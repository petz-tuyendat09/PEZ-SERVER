const mongoose = require("mongoose");

const tempUserSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  password: { type: String, required: false },
  username: { type: String, required: false },
  otp: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 },
});

module.exports = mongoose.model("TempUser", tempUserSchema, "tempusers");

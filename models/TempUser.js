const mongoose = require("mongoose");

const tempUserSchema = new mongoose.Schema({
    userEmail: { type: String, required: true },
    password: { type: String, required: true },
    username: { type: String, required: true },
    otp: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now, expires: 300 }, // Expire after 60 seconds
});
  


module.exports =  mongoose.model("TempUser", tempUserSchema, 'tempusers');

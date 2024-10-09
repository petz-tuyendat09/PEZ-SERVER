const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const cartSchema = new Schema({
  cartItems: [
    {
      productId: {
        type: ObjectId,
        required: true,
        ref: "Product",
      },
      productName: String,
      productQuantity: Number,
      productPrice: Number,
      productOption: String,
      salePercent: Number,
    },
  ],
});

module.exports = mongoose.model("Cart", cartSchema, "carts");

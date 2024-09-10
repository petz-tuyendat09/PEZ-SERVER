const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;

const cartSchema = new Schema({
  userId: {
    type: ObjectId,
  },
  cartItems: [
    {
      productId: ObjectId,
      productQuantity: Number,
    },
  ],
});

module.exports = mongoose.model("Cart", cartSchema, "carts");

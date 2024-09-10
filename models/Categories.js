const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const categoriesSchema = Schema({
  categoryName: {
    type: String,
    required: true,
  },
  products: [
    {
      productId: {
        type: ObjectId,
        ref: "Products",
      },
    },
  ],
});

module.exports = mongoose.model("Categories", categoriesSchema);

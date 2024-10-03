const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const productDetailDescription = Schema({
  detailContent: {
    type: String,
    required: false,
  },
});

module.exports = mongoose.model("ProductDetailDescription", productDetailDescription,"productDetailDescription");

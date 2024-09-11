const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const categoriesSchema = Schema({
  categoryName: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Categories", categoriesSchema);

const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const subCategoriesSchema = Schema({
  subCategoryName: {
    type: String,
    required: true,
  },
  categoryId: {
    type: ObjectId,
    ref: "Categories",
    required: true,
  },
});

module.exports = mongoose.model(
  "SubCategories",
  subCategoriesSchema,
  "subCategories"
);

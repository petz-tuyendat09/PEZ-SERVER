const mongoose = require("mongoose");

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
const subCategoriesSchema = Schema({
  subCategoryName: {
    type: String,
    required: true,
  },
  category: {
    categoryId: {
      type: ObjectId,
      required: true,
    },
    categoryName: {
      type: String,
      required: true,
    },
  },
});

module.exports = mongoose.model(
  "SubCategories",
  subCategoriesSchema,
  "subCategories"
);

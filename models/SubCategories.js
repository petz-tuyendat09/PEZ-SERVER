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
    required: true,

    animalType: {
      type: String,
      required: true,
      enum: ["Chó", "Mèo"],
    },
  },
});

module.exports = mongoose.model(
  "SubCategories",
  subCategoriesSchema,
  "subCategories"
);

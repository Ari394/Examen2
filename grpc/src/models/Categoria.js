const mongoose = require("mongoose");

const categoriaSchema = new mongoose.Schema(
  {
    CategoryID: { type: Number, required: true, unique: true },
    CategoryName: { type: String, required: true },
    Description: { type: String, required: true }
  },
  {
    collection: "categorias",
    versionKey: false
  }
);

module.exports =
  mongoose.models.Categoria || mongoose.model("Categoria", categoriaSchema);

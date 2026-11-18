const mongoose = require("mongoose");

const productoSchema = new mongoose.Schema(
  {
    ProductID: { type: Number, required: true, unique: true },
    ProductName: { type: String, required: true },
    SupplierID: { type: Number, required: true },
    CategoryID: { type: Number, required: true },
    QuantityPerUnit: { type: String, required: true },
    UnitPrice: { type: Number, required: true },
    UnitsInStock: { type: Number, required: true },
    ReorderLevel: { type: Number, required: true }
  },
  {
    collection: "productos",
    versionKey: false
  }
);

module.exports =
  mongoose.models.Producto || mongoose.model("Producto", productoSchema);

const mongoose = require("mongoose");

const proveedorSchema = new mongoose.Schema(
  {
    SupplierID: { type: Number, required: true, unique: true },
    CompanyName: { type: String, required: true },
    ContactName: { type: String, required: true },
    ContactTitle: { type: String, required: true },
    Country: { type: String, required: true },
    City: { type: String, required: true },
    Address: { type: String, required: true }
  },
  {
    collection: "proveedores",
    versionKey: false
  }
);

module.exports =
  mongoose.models.Proveedor || mongoose.model("Proveedor", proveedorSchema);

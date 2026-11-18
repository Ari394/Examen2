const mongoose = require("mongoose");

const connectDatabase = require("../config/database");
const products = require("../data/Products.json");
const categories = require("../data/Categories.json");
const suppliers = require("../data/Suppliers.json");
const Producto = require("../models/Producto");
const Categoria = require("../models/Categoria");
const Proveedor = require("../models/Proveedor");

const datasets = [
  { model: Producto, idField: "ProductID", records: products },
  { model: Categoria, idField: "CategoryID", records: categories },
  { model: Proveedor, idField: "SupplierID", records: suppliers }
];

async function importDataset({ model, idField, records }) {
  const operations = records.map(record => ({
    replaceOne: {
      filter: { [idField]: record[idField] },
      replacement: record,
      upsert: true
    }
  }));

  const result = await model.bulkWrite(operations, { ordered: true });

  console.log(
    `${model.collection.name}: ${records.length} procesados, ` +
      `${result.upsertedCount} insertados, ${result.modifiedCount} actualizados.`
  );
}

async function importJsonData() {
  try {
    await connectDatabase();
    await Promise.all(datasets.map(({ model }) => model.init()));

    for (const dataset of datasets) {
      await importDataset(dataset);
    }

    console.log("Importación de JSON completada.");
  } catch (error) {
    const errorType = error instanceof Error ? error.name : "Error desconocido";
    const message =
      error instanceof Error &&
      (error.message === "MONGO_URI no está configurada en el archivo .env." ||
        error.message === "No se pudo conectar a MongoDB.")
        ? error.message
        : `La importación no pudo completarse (${errorType}).`;
    console.error(message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      try {
        await mongoose.disconnect();
      } catch (error) {
        console.error("No se pudo cerrar la conexión con MongoDB.");
        process.exitCode = 1;
      }
    }
  }
}

importJsonData();

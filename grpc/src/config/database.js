const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env")
});

async function connectDatabase() {
  const { MONGO_URI } = process.env;

  if (!MONGO_URI) {
    throw new Error("MONGO_URI no está configurada en el archivo .env.");
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log("Conexión a MongoDB establecida.");
    return mongoose.connection;
  } catch (error) {
    const errorType = error instanceof Error ? error.name : "Error desconocido";
    console.error(`Error al conectar con MongoDB (${errorType}).`);
    throw new Error("No se pudo conectar a MongoDB.");
  }
}

module.exports = connectDatabase;

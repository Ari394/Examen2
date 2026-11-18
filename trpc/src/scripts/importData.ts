
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { connectMongoDB, closeMongoDB } from "../config/mongodb.js";

async function importData() {
  try {
    const db = await connectMongoDB();

    const files = [
      { file: "Products.json", collection: "products" },
      { file: "Categories.json", collection: "categories" },
      { file: "Suppliers.json", collection: "suppliers" },
    ];

    for (const item of files) {
      const filePath = join(
        process.cwd(),
        "src",
        "data",
        item.file
      );

      const content = readFileSync(filePath, "utf-8");
      const data = JSON.parse(content);

      if (!Array.isArray(data)) {
        throw new Error(`${item.file} no contiene un arreglo`);
      }

      const collection = db.collection(item.collection);

      // Evita duplicar registros al volver a importar.
      await collection.deleteMany({});

      if (data.length > 0) {
        await collection.insertMany(data);
      }

      console.log(
        `${item.collection}: ${data.length} registros importados`
      );
    }

    console.log("Importación completada correctamente");

  } catch (error) {
    console.error("Error al importar:", error);
    process.exitCode = 1;

  } finally {
    await closeMongoDB();
  }
}

importData();

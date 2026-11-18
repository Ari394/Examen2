import "dotenv/config";
import { MongoClient, Db } from "mongodb";

const uri =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017";

const dbName =
  process.env.MONGO_DB || "examen2_trpc";

const client = new MongoClient(uri);

let database: Db | null = null;

export async function connectMongoDB(): Promise<Db> {
  if (database) {
    return database;
  }

  await client.connect();

  database = client.db(dbName);

  await database.command({ ping: 1 });

  console.log("Conexión a MongoDB exitosa");

  return database;
}

export async function getDatabase(): Promise<Db> {
  return connectMongoDB();
}

export async function closeMongoDB(): Promise<void> {
  await client.close();
  database = null;
}
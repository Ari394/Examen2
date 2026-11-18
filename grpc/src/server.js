
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const connectDatabase = require("./config/database");
const productoService = require("./services/productoService");
const productoAggregationService = require("./services/productoAggregationService");
const productoCrudService = require("./services/productoCrudService");

// Ruta del archivo .proto
const PROTO_PATH = path.join(
  __dirname,
  "proto",
  "productos.proto"
);

// Cargar la configuracion del archivo .proto
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

// Cargar el servicio gRPC
const proto = grpc.loadPackageDefinition(
  packageDefinition
).productos;

// Crear el servidor
const server = new grpc.Server();

// Registrar las consultas
server.addService(
  proto.ProductoService.service,
  {
    ...productoService,
    ...productoAggregationService,
    ...productoCrudService
  }
);

// Iniciar el servidor
const PORT = "0.0.0.0:50051";

async function startServer() {
  try {
    await connectDatabase();
  } catch (error) {
    console.error("Servidor gRPC no iniciado: MongoDB no está disponible.");
    process.exitCode = 1;
    return;
  }

  server.bindAsync(
    PORT,
    grpc.ServerCredentials.createInsecure(),
    (error, port) => {
      if (error) {
        console.error("Error al iniciar servidor gRPC:", error.message);
        process.exitCode = 1;
        return;
      }

      console.log(
        `Servidor gRPC ejecutandose en puerto ${port}`
      );
    }
  );
}

startServer();

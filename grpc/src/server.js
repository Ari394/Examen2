
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

const productoService = require("./services/productoService");

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
  productoService
);

// Iniciar el servidor
const PORT = "0.0.0.0:50051";

server.bindAsync(
  PORT,
  grpc.ServerCredentials.createInsecure(),
  (error, port) => {
    if (error) {
      console.error("Error al iniciar servidor:", error);
      return;
    }

    console.log(
      `Servidor gRPC ejecutandose en puerto ${port}`
    );
  }
);

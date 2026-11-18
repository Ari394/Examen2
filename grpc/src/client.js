
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");

// Cargar el archivo proto
const PROTO_PATH = path.join(__dirname, "proto", "productos.proto");

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true
});

const proto = grpc.loadPackageDefinition(packageDefinition).productos;

// Crear cliente gRPC
const client = new proto.ProductoService(
  "localhost:50051",
  grpc.credentials.createInsecure()
);

// CONSULTA A: Todos los productos
client.ObtenerProductos({}, (error, response) => {
  if (error) {
    console.error("Error en consulta A:", error.message);
    return;
  }

  console.log("\nCONSULTA A: TODOS LOS PRODUCTOS");
  console.table(response.productos);
});

// CONSULTA B1: Campos especificos de productos
client.ObtenerCampos({}, (error, response) => {
  if (error) {
    console.error("Error en consulta B1:", error.message);
    return;
  }

  console.log("\nCONSULTA B1: CAMPOS DE PRODUCTOS");
  console.table(response.productos);
});

// CONSULTA B2: Campos especificos de proveedores
client.ObtenerCamposProveedores({}, (error, response) => {
  if (error) {
    console.error("Error en consulta B2:", error.message);
    return;
  }

  console.log("\nCONSULTA B2: CAMPOS DE PROVEEDORES");
  console.table(response.proveedores);
});

// CONSULTA C1: Filtrar productos por categoria
client.FiltrarProductos({ CategoryID: 1 }, (error, response) => {
  if (error) {
    console.error("Error en consulta C1:", error.message);
    return;
  }

  console.log("\nCONSULTA C1: PRODUCTOS DE BEBIDAS");
  console.table(response.productos);
});

// CONSULTA C2: Filtrar proveedores por pais
client.FiltrarProveedores({ Country: "USA" }, (error, response) => {
  if (error) {
    console.error("Error en consulta C2:", error.message);
    return;
  }

  console.log("\nCONSULTA C2: PROVEEDORES DE USA");
  console.table(response.proveedores);
});

// CONSULTA D1: Productos con su categoria
client.ObtenerProductosConCategoria({}, (error, response) => {
  if (error) {
    console.error("Error en consulta D1:", error.message);
    return;
  }

  console.log("\nCONSULTA D1: PRODUCTOS CON CATEGORIA");
  console.dir(response.productos, { depth: null });
});

// CONSULTA D2: Productos con su proveedor
client.ObtenerProductosConProveedor({}, (error, response) => {
  if (error) {
    console.error("Error en consulta D2:", error.message);
    return;
  }

  console.log("\nCONSULTA D2: PRODUCTOS CON PROVEEDOR");
  console.dir(response.productos, { depth: null });
});

// CONSULTA D3: Productos con categoria y proveedor
client.ObtenerProductosConCategoriaYProveedor({}, (error, response) => {
  if (error) {
    console.error("Error en consulta D3:", error.message);
    return;
  }

  console.log("\nCONSULTA D3: PRODUCTOS CON CATEGORIA Y PROVEEDOR");
  console.dir(response.productos, { depth: null });
});

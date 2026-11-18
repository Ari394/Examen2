process.env.JWT_SECRET = "test-only-signing-secret-not-for-production";
process.env.JWT_EXPIRES_IN = "1h";

const test = require("node:test");
const assert = require("node:assert/strict");
const grpc = require("@grpc/grpc-js");
const jwt = require("jsonwebtoken");
const protoLoader = require("@grpc/proto-loader");

const Producto = require("../models/Producto");
const {
  generateToken,
  verifyToken
} = require("./jwtService");
const {
  createJwtAuthInterceptor,
  PUBLIC_METHODS,
  PROTECTED_METHODS
} = require("../middleware/jwtAuthInterceptor");
const productoService = require("./productoService");
const productoAggregationService = require("./productoAggregationService");
const productoCrudService = require("./productoCrudService");
const productoPaginacionService = require("./productoPaginacionService");

const originalMethods = {
  init: Producto.init,
  exists: Producto.exists,
  create: Producto.create
};

function invoke(client, method, request, token) {
  const metadata = new grpc.Metadata();
  if (token) {
    metadata.set("authorization", `Bearer ${token}`);
  }

  return new Promise(resolve => {
    client[method](request, metadata, (error, response) => {
      resolve({ error, response });
    });
  });
}

function makeProduct() {
  return {
    ProductID: 910010,
    ProductName: "Producto autenticado",
    SupplierID: 1,
    CategoryID: 1,
    QuantityPerUnit: "1 unidad",
    UnitPrice: 10,
    UnitsInStock: 5,
    ReorderLevel: 1
  };
}

test("JWT interceptor authenticates real gRPC calls by method policy", async () => {
  let createCount = 0;
  Producto.init = async () => Producto;
  Producto.exists = async () => null;
  Producto.create = async product => {
    createCount += 1;
    return { ...product };
  };

  const definition = protoLoader.loadSync(
    "src/proto/productos.proto",
    { keepCase: true, longs: String, enums: String, defaults: true, oneofs: true }
  );
  const proto = grpc.loadPackageDefinition(definition).productos;
  const server = new grpc.Server({
    interceptors: [createJwtAuthInterceptor()]
  });
  server.addService(proto.ProductoService.service, {
    ...productoService,
    ...productoAggregationService,
    ...productoCrudService,
    ...productoPaginacionService
  });

  let client;
  try {
    const port = await new Promise((resolve, reject) => {
      server.bindAsync(
        "127.0.0.1:0",
        grpc.ServerCredentials.createInsecure(),
        (error, boundPort) => error ? reject(error) : resolve(boundPort)
      );
    });
    client = new proto.ProductoService(
      `127.0.0.1:${port}`,
      grpc.credentials.createInsecure()
    );

    const generatedToken = generateToken({ sub: "grpc-auth-test" });
    assert.equal(verifyToken(generatedToken).sub, "grpc-auth-test");
    assert(verifyToken(generatedToken).exp > verifyToken(generatedToken).iat);

    const publicResult = await invoke(client, "ObtenerProductos", {});
    assert.equal(publicResult.error, null);
    assert(publicResult.response.productos.length > 0);

    const validProduct = makeProduct();
    const protectedRequests = {
      ObtenerProductosConCategoria: {},
      ObtenerProductosConProveedor: {},
      ObtenerProductosConCategoriaYProveedor: {},
      CrearProducto: validProduct,
      ConsultarProductos: { ProductID: 0 },
      ActualizarProducto: validProduct,
      EliminarProducto: { ProductID: validProduct.ProductID },
      ConsultarProductosPaginados: {
        pagina: 1,
        limite: 10,
        campoOrdenamiento: "ProductID",
        orden: "ASCENDENTE"
      }
    };

    assert.equal(PUBLIC_METHODS.size, 5);
    assert.equal(PROTECTED_METHODS.size, 8);

    for (const [method, request] of Object.entries(protectedRequests)) {
      const result = await invoke(client, method, request);
      assert.equal(result.error.code, grpc.status.UNAUTHENTICATED, method);
    }

    const invalidToken = await invoke(
      client,
      "CrearProducto",
      validProduct,
      "token.incorrecto"
    );
    assert.equal(invalidToken.error.code, grpc.status.UNAUTHENTICATED);
    assert.equal(invalidToken.error.details, "El token JWT es inválido.");

    const expiredToken = jwt.sign(
      { sub: "expired-test" },
      process.env.JWT_SECRET,
      { expiresIn: -1, algorithm: "HS256" }
    );
    const expired = await invoke(client, "CrearProducto", validProduct, expiredToken);
    assert.equal(expired.error.code, grpc.status.UNAUTHENTICATED);
    assert.equal(expired.error.details, "El token JWT expiró.");
    assert.equal(createCount, 0);

    const authorized = await invoke(
      client,
      "CrearProducto",
      validProduct,
      generatedToken
    );
    assert.equal(authorized.error, null);
    assert.equal(authorized.response.exito, true);
    assert.equal(createCount, 1);
  } finally {
    if (client) {
      client.close();
    }
    server.forceShutdown();
    Object.assign(Producto, originalMethods);
  }
});

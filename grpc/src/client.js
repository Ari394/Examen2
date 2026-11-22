
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
const { generateToken } = require("./services/jwtService");

// Crear cliente gRPC
const client = new proto.ProductoService(
  "localhost:50051",
  grpc.credentials.createInsecure()
);

function crearMetadataAutorizacion(
  token = generateToken({ sub: "grpc-client-demo" })
) {
  const metadata = new grpc.Metadata();
  metadata.set("authorization", `Bearer ${token}`);
  return metadata;
}

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
client.ObtenerProductosConCategoria(
  {},
  crearMetadataAutorizacion(),
  (error, response) => {
    if (error) {
      console.error("Error en consulta D1:", error.message);
      return;
    }

    console.log("\nCONSULTA D1: PRODUCTOS CON CATEGORIA");
    console.dir(response.productos, { depth: null });
  }
);

// CONSULTA D2: Productos con su proveedor
client.ObtenerProductosConProveedor(
  {},
  crearMetadataAutorizacion(),
  (error, response) => {
    if (error) {
      console.error("Error en consulta D2:", error.message);
      return;
    }

    console.log("\nCONSULTA D2: PRODUCTOS CON PROVEEDOR");
    console.dir(response.productos, { depth: null });
  }
);

// CONSULTA D3: Productos con categoria y proveedor
client.ObtenerProductosConCategoriaYProveedor(
  {},
  crearMetadataAutorizacion(),
  (error, response) => {
    if (error) {
      console.error("Error en consulta D3:", error.message);
      return;
    }

    console.log("\nCONSULTA D3: PRODUCTOS CON CATEGORIA Y PROVEEDOR");
    console.dir(response.productos, { depth: null });
  }
);

function llamarCrud(metodo, request) {
  return new Promise((resolve, reject) => {
    client[metodo](request, crearMetadataAutorizacion(), (error, response) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(response);
    });
  });
}

async function probarCrud() {
  const ProductID = 1900000000 + Math.floor(Math.random() * 100000000);
  let productoCreado = false;

  const producto = {
    ProductID,
    ProductName: "Producto de prueba CRUD",
    SupplierID: 1,
    CategoryID: 1,
    QuantityPerUnit: "1 unidad de prueba",
    UnitPrice: 10,
    UnitsInStock: 5,
    ReorderLevel: 1
  };

  try {
    console.log("\nCRUD: CREAR");
    const creado = await llamarCrud("CrearProducto", producto);
    productoCreado = true;
    console.log(creado.mensaje, creado.producto);

    console.log("\nCRUD: CONSULTAR POR ProductID");
    const consultado = await llamarCrud("ConsultarProductos", { ProductID });
    console.dir(consultado.productos, { depth: null });

    console.log("\nCRUD: ACTUALIZAR");
    const actualizado = await llamarCrud("ActualizarProducto", {
      ...producto,
      ProductName: "Producto CRUD actualizado",
      UnitPrice: 12
    });
    console.log(actualizado.mensaje, actualizado.producto);

    console.log("\nCRUD: CONSULTAR CAMBIOS");
    const verificado = await llamarCrud("ConsultarProductos", { ProductID });
    console.dir(verificado.productos, { depth: null });

    console.log("\nCRUD: ELIMINAR");
    const eliminado = await llamarCrud("EliminarProducto", { ProductID });
    productoCreado = false;
    console.log(eliminado.mensaje, eliminado.producto);

    try {
      await llamarCrud("ConsultarProductos", { ProductID });
      console.error("Error: el producto todavía existe después de eliminarlo.");
    } catch (error) {
      if (error.code === grpc.status.NOT_FOUND) {
        console.log("Verificación: el producto eliminado ya no existe.");
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error("La demostración CRUD falló:", error.message);
  } finally {
    if (productoCreado) {
      try {
        await llamarCrud("EliminarProducto", { ProductID });
      } catch (error) {
        console.error("No se pudo limpiar el producto de prueba:", error.message);
      }
    }
  }
}

probarCrud();

client.ConsultarProductosPaginados(
  {
    pagina: 1,
    limite: 10,
    campoOrdenamiento: "ProductID",
    orden: "ASCENDENTE"
  },
  crearMetadataAutorizacion(),
  (error, response) => {
    if (error) {
      console.error("Error en paginación ascendente:", error.message);
      return;
    }

    console.log("\nPAGINACIÓN: PRIMERA PÁGINA, ProductID ASCENDENTE");
    console.log({
      pagina: response.pagina,
      limite: response.limite,
      totalRegistros: response.totalRegistros,
      totalPaginas: response.totalPaginas,
      campoOrdenamiento: response.campoOrdenamiento,
      orden: response.orden
    });
    console.table(response.productos);
  }
);

client.ConsultarProductosPaginados(
  {
    pagina: 2,
    limite: 5,
    campoOrdenamiento: "UnitPrice",
    orden: "DESCENDENTE"
  },
  crearMetadataAutorizacion(),
  (error, response) => {
    if (error) {
      console.error("Error en paginación descendente:", error.message);
      return;
    }

    console.log("\nPAGINACIÓN: SEGUNDA PÁGINA, UnitPrice DESCENDENTE");
    console.log({
      pagina: response.pagina,
      limite: response.limite,
      totalRegistros: response.totalRegistros,
      totalPaginas: response.totalPaginas,
      campoOrdenamiento: response.campoOrdenamiento,
      orden: response.orden
    });
    console.table(response.productos);
  }
);

function probarLlamadaConToken(metodo, request, token) {
  const metadata = token
    ? crearMetadataAutorizacion(token)
    : new grpc.Metadata();

  return new Promise(resolve => {
    client[metodo](request, metadata, (error, response) => {
      resolve({ error, response });
    });
  });
}

async function probarAutenticacion() {
  const request = { ProductID: 0 };
  const tokenValido = generateToken({ sub: "grpc-client-auth-test" });
  const tokenIncorrecto = "token.incorrecto";

  const sinToken = await probarLlamadaConToken(
    "ConsultarProductos",
    request,
    null
  );
  console.log(
    "\nJWT SIN TOKEN:",
    sinToken.error && sinToken.error.code === grpc.status.UNAUTHENTICATED
      ? "rechazado correctamente"
      : "resultado inesperado"
  );

  const incorrecto = await probarLlamadaConToken(
    "ConsultarProductos",
    request,
    tokenIncorrecto
  );
  console.log(
    "JWT INCORRECTO:",
    incorrecto.error && incorrecto.error.code === grpc.status.UNAUTHENTICATED
      ? "rechazado correctamente"
      : "resultado inesperado"
  );

  const valido = await probarLlamadaConToken(
    "ConsultarProductos",
    request,
    tokenValido
  );
  if (!valido.error) {
    console.log(
      `JWT VÁLIDO: aceptado; productos consultados: ${valido.response.productos.length}`
    );
  } else if (valido.error.code !== grpc.status.UNAUTHENTICATED) {
    console.log(
      `JWT VÁLIDO: aceptado por autenticación; consulta respondió con gRPC ${valido.error.code}.`
    );
  } else {
    console.log("JWT VÁLIDO: rechazado inesperadamente.");
  }
}

probarAutenticacion();

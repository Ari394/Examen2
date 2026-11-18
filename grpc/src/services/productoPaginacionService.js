const grpc = require("@grpc/grpc-js");

const Producto = require("../models/Producto");

const MAX_PAGE_SIZE = 100;
const DEFAULT_SORT_FIELD = "ProductID";
const SORT_FIELDS = new Set([
  "ProductID",
  "ProductName",
  "SupplierID",
  "CategoryID",
  "QuantityPerUnit",
  "UnitPrice",
  "UnitsInStock",
  "ReorderLevel"
]);
const SORT_DIRECTIONS = new Set(["ASCENDENTE", "DESCENDENTE"]);

async function consultarProductosPaginados(call, callback) {
  const { pagina, limite } = call.request;
  const campoOrdenamiento =
    call.request.campoOrdenamiento || DEFAULT_SORT_FIELD;
  const orden = call.request.orden || "ASCENDENTE";

  if (!Number.isInteger(pagina) || pagina < 1) {
    callback({
      code: grpc.status.INVALID_ARGUMENT,
      message: "pagina debe ser un entero mayor o igual a uno."
    });
    return;
  }

  if (!Number.isInteger(limite) || limite < 1 || limite > MAX_PAGE_SIZE) {
    callback({
      code: grpc.status.INVALID_ARGUMENT,
      message: `limite debe ser un entero entre uno y ${MAX_PAGE_SIZE}.`
    });
    return;
  }

  if (!SORT_FIELDS.has(campoOrdenamiento)) {
    callback({
      code: grpc.status.INVALID_ARGUMENT,
      message: "campoOrdenamiento no está permitido."
    });
    return;
  }

  if (!SORT_DIRECTIONS.has(orden)) {
    callback({
      code: grpc.status.INVALID_ARGUMENT,
      message: "orden debe ser ASCENDENTE o DESCENDENTE."
    });
    return;
  }

  const direccion = orden === "ASCENDENTE" ? 1 : -1;
  const skip = (pagina - 1) * limite;
  const sortOptions = { [campoOrdenamiento]: direccion };
  if (campoOrdenamiento !== "ProductID") {
    sortOptions.ProductID = 1;
  }

  try {
    const [totalRegistros, productos] = await Promise.all([
      Producto.countDocuments({}),
      Producto.find({})
        .sort(sortOptions)
        .skip(skip)
        .limit(limite)
        .lean()
        .exec()
    ]);

    callback(null, {
      productos: productos.map(producto => ({
        ProductID: producto.ProductID,
        ProductName: producto.ProductName,
        SupplierID: producto.SupplierID,
        CategoryID: producto.CategoryID,
        QuantityPerUnit: producto.QuantityPerUnit,
        UnitPrice: producto.UnitPrice,
        UnitsInStock: producto.UnitsInStock,
        ReorderLevel: producto.ReorderLevel
      })),
      pagina,
      limite,
      totalRegistros,
      totalPaginas: Math.ceil(totalRegistros / limite),
      campoOrdenamiento,
      orden
    });
  } catch (error) {
    const errorType = error instanceof Error ? error.name : "Error desconocido";
    console.error(`Error al paginar productos (${errorType}).`);
    callback({
      code: grpc.status.INTERNAL,
      message: "No se pudieron consultar los productos paginados."
    });
  }
}

module.exports = {
  consultarProductosPaginados,
  MAX_PAGE_SIZE,
  SORT_FIELDS
};

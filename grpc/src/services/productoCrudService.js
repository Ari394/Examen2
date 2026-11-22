const grpc = require("@grpc/grpc-js");

const Producto = require("../models/Producto");

const PRODUCT_FIELDS = [
  "ProductID",
  "ProductName",
  "SupplierID",
  "CategoryID",
  "QuantityPerUnit",
  "UnitPrice",
  "UnitsInStock",
  "ReorderLevel"
];

function getProductData(product) {
  return Object.fromEntries(
    PRODUCT_FIELDS.map(field => [field, product[field]])
  );
}

function validateProduct(product) {
  if (!product || !Number.isInteger(product.ProductID) || product.ProductID <= 0) {
    return "ProductID debe ser un entero positivo.";
  }

  if (
    typeof product.ProductName !== "string" ||
    product.ProductName.trim().length === 0
  ) {
    return "ProductName es obligatorio.";
  }

  if (!Number.isInteger(product.SupplierID) || product.SupplierID <= 0) {
    return "SupplierID debe ser un entero positivo.";
  }

  if (!Number.isInteger(product.CategoryID) || product.CategoryID <= 0) {
    return "CategoryID debe ser un entero positivo.";
  }

  if (
    typeof product.QuantityPerUnit !== "string" ||
    product.QuantityPerUnit.trim().length === 0
  ) {
    return "QuantityPerUnit es obligatorio.";
  }

  if (!Number.isFinite(product.UnitPrice) || product.UnitPrice < 0) {
    return "UnitPrice debe ser un número mayor o igual a cero.";
  }

  if (!Number.isInteger(product.UnitsInStock) || product.UnitsInStock < 0) {
    return "UnitsInStock debe ser un entero mayor o igual a cero.";
  }

  if (!Number.isInteger(product.ReorderLevel) || product.ReorderLevel < 0) {
    return "ReorderLevel debe ser un entero mayor o igual a cero.";
  }

  return null;
}

function toProductMessage(product) {
  return getProductData(product);
}

function sendDatabaseError(callback, operation, error) {
  if (error && error.code === 11000) {
    callback({
      code: grpc.status.ALREADY_EXISTS,
      message: "Ya existe un producto con ese ProductID."
    });
    return;
  }

  const errorType = error instanceof Error ? error.name : "Error desconocido";
  console.error(`Error de MongoDB al ${operation} (${errorType}).`);
  callback({
    code: grpc.status.INTERNAL,
    message: `No se pudo ${operation} el producto.`
  });
}

async function crearProducto(call, callback) {
  const product = getProductData(call.request);
  const validationMessage = validateProduct(product);

  if (validationMessage) {
    callback({
      code: grpc.status.INVALID_ARGUMENT,
      message: validationMessage
    });
    return;
  }

  try {
    await Producto.init();
    const existing = await Producto.exists({ ProductID: product.ProductID });

    if (existing) {
      callback({
        code: grpc.status.ALREADY_EXISTS,
        message: "Ya existe un producto con ese ProductID."
      });
      return;
    }

    const created = await Producto.create(product);
    callback(null, {
      exito: true,
      mensaje: "Producto creado correctamente.",
      producto: toProductMessage(created)
    });
  } catch (error) {
    sendDatabaseError(callback, "crear", error);
  }
}

async function consultarProductos(call, callback) {
  const { ProductID } = call.request;

  if (!Number.isInteger(ProductID) || ProductID < 0) {
    callback({
      code: grpc.status.INVALID_ARGUMENT,
      message: "ProductID debe ser cero o un entero positivo."
    });
    return;
  }

  try {
    if (ProductID === 0) {
      const products = await Producto.find({})
        .sort({ ProductID: 1 })
        .lean()
        .exec();

      callback(null, {
        exito: true,
        mensaje: products.length
          ? "Productos consultados correctamente."
          : "No hay productos almacenados en MongoDB.",
        productos: products.map(toProductMessage)
      });
      return;
    }

    const product = await Producto.findOne({ ProductID }).lean().exec();

    if (!product) {
      callback({
        code: grpc.status.NOT_FOUND,
        message: `No existe un producto con ProductID ${ProductID}.`
      });
      return;
    }

    callback(null, {
      exito: true,
      mensaje: "Producto consultado correctamente.",
      productos: [toProductMessage(product)]
    });
  } catch (error) {
    sendDatabaseError(callback, "consultar", error);
  }
}

async function actualizarProducto(call, callback) {
  const product = getProductData(call.request);
  const validationMessage = validateProduct(product);

  if (validationMessage) {
    callback({
      code: grpc.status.INVALID_ARGUMENT,
      message: validationMessage
    });
    return;
  }

  try {
    const existing = await Producto.exists({ ProductID: product.ProductID });

    if (!existing) {
      callback({
        code: grpc.status.NOT_FOUND,
        message: `No existe un producto con ProductID ${product.ProductID}.`
      });
      return;
    }

    const updated = await Producto.findOneAndUpdate(
      { ProductID: product.ProductID },
      { $set: product },
      { new: true, runValidators: true }
    )
      .lean()
      .exec();

    if (!updated) {
      callback({
        code: grpc.status.NOT_FOUND,
        message: `No existe un producto con ProductID ${product.ProductID}.`
      });
      return;
    }

    callback(null, {
      exito: true,
      mensaje: "Producto actualizado correctamente.",
      producto: toProductMessage(updated)
    });
  } catch (error) {
    sendDatabaseError(callback, "actualizar", error);
  }
}

async function eliminarProducto(call, callback) {
  const { ProductID } = call.request;

  if (!Number.isInteger(ProductID) || ProductID <= 0) {
    callback({
      code: grpc.status.INVALID_ARGUMENT,
      message: "ProductID debe ser un entero positivo."
    });
    return;
  }

  try {
    const deleted = await Producto.findOneAndDelete({ ProductID })
      .lean()
      .exec();

    if (!deleted) {
      callback({
        code: grpc.status.NOT_FOUND,
        message: `No existe un producto con ProductID ${ProductID}.`
      });
      return;
    }

    callback(null, {
      exito: true,
      mensaje: "Producto eliminado correctamente.",
      producto: toProductMessage(deleted)
    });
  } catch (error) {
    sendDatabaseError(callback, "eliminar", error);
  }
}

module.exports = {
  crearProducto,
  consultarProductos,
  actualizarProducto,
  eliminarProducto
};

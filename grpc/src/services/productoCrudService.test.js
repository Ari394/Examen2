const test = require("node:test");
const assert = require("node:assert/strict");
const grpc = require("@grpc/grpc-js");

const Producto = require("../models/Producto");
const service = require("./productoCrudService");

const originalMethods = {
  init: Producto.init,
  exists: Producto.exists,
  create: Producto.create,
  find: Producto.find,
  findOne: Producto.findOne,
  findOneAndUpdate: Producto.findOneAndUpdate,
  findOneAndDelete: Producto.findOneAndDelete
};

function createQuery(execute) {
  return {
    sort() {
      return this;
    },
    lean() {
      return this;
    },
    exec: execute
  };
}

function useMemoryStore() {
  const products = new Map();

  Producto.init = async () => Producto;
  Producto.exists = async ({ ProductID }) =>
    products.has(ProductID) ? { ProductID } : null;
  Producto.create = async product => {
    if (products.has(product.ProductID)) {
      throw Object.assign(new Error("duplicate key"), { code: 11000 });
    }

    products.set(product.ProductID, { ...product });
    return { ...product };
  };
  Producto.find = () =>
    createQuery(async () => [...products.values()].map(product => ({ ...product })));
  Producto.findOne = ({ ProductID }) =>
    createQuery(async () => {
      const product = products.get(ProductID);
      return product ? { ...product } : null;
    });
  Producto.findOneAndUpdate = ({ ProductID }, { $set: updates }) =>
    createQuery(async () => {
      const product = products.get(ProductID);
      if (!product) {
        return null;
      }

      const updated = { ...product, ...updates };
      products.set(ProductID, updated);
      return { ...updated };
    });
  Producto.findOneAndDelete = ({ ProductID }) =>
    createQuery(async () => {
      const product = products.get(ProductID);
      products.delete(ProductID);
      return product ? { ...product } : null;
    });

  return products;
}

function invoke(method, request) {
  return new Promise(resolve => {
    service[method]({ request }, (error, response) => resolve({ error, response }));
  });
}

function makeProduct(overrides = {}) {
  return {
    ProductID: 910001,
    ProductName: "Producto de prueba",
    SupplierID: 1,
    CategoryID: 1,
    QuantityPerUnit: "1 unidad",
    UnitPrice: 10,
    UnitsInStock: 5,
    ReorderLevel: 1,
    ...overrides
  };
}

test.afterEach(() => {
  Object.assign(Producto, originalMethods);
});

test("performs a full CRUD cycle through a stubbed product model", async () => {
  useMemoryStore();

  const emptyList = await invoke("consultarProductos", { ProductID: 0 });
  assert.equal(emptyList.error, null);
  assert.deepEqual(emptyList.response.productos, []);

  const created = await invoke("crearProducto", makeProduct());
  assert.equal(created.error, null);
  assert.equal(created.response.exito, true);
  assert.equal(created.response.producto.ProductName, "Producto de prueba");

  const read = await invoke("consultarProductos", { ProductID: 910001 });
  assert.equal(read.error, null);
  assert.equal(read.response.productos.length, 1);
  assert.equal(read.response.productos[0].ProductID, 910001);

  const list = await invoke("consultarProductos", { ProductID: 0 });
  assert.equal(list.error, null);
  assert.equal(list.response.productos.length, 1);

  const updated = await invoke(
    "actualizarProducto",
    makeProduct({ ProductName: "Producto actualizado", UnitPrice: 12 })
  );
  assert.equal(updated.error, null);
  assert.equal(updated.response.producto.ProductName, "Producto actualizado");
  assert.equal(updated.response.producto.UnitPrice, 12);

  const deleted = await invoke("eliminarProducto", { ProductID: 910001 });
  assert.equal(deleted.error, null);
  assert.equal(deleted.response.producto.ProductID, 910001);

  const missing = await invoke("consultarProductos", { ProductID: 910001 });
  assert.equal(missing.error.code, grpc.status.NOT_FOUND);
});

test("rejects duplicate ProductID and invalid product data", async () => {
  useMemoryStore();

  assert.equal((await invoke("crearProducto", makeProduct())).error, null);

  const duplicate = await invoke("crearProducto", makeProduct());
  assert.equal(duplicate.error.code, grpc.status.ALREADY_EXISTS);

  const invalid = await invoke(
    "crearProducto",
    makeProduct({ ProductName: " ", UnitPrice: -1 })
  );
  assert.equal(invalid.error.code, grpc.status.INVALID_ARGUMENT);
});

test("returns NOT_FOUND when updating or deleting an unknown product", async () => {
  useMemoryStore();

  const update = await invoke("actualizarProducto", makeProduct());
  const remove = await invoke("eliminarProducto", { ProductID: 910001 });

  assert.equal(update.error.code, grpc.status.NOT_FOUND);
  assert.equal(remove.error.code, grpc.status.NOT_FOUND);
});

test("returns INTERNAL when MongoDB operations fail", async () => {
  Producto.find = () =>
    createQuery(async () => {
      throw new Error("database detail");
    });

  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    const result = await invoke("consultarProductos", { ProductID: 0 });
    assert.equal(result.error.code, grpc.status.INTERNAL);
    assert.equal(result.error.message, "No se pudo consultar el producto.");
  } finally {
    console.error = originalConsoleError;
  }
});

const test = require("node:test");
const assert = require("node:assert/strict");
const grpc = require("@grpc/grpc-js");

const Producto = require("../models/Producto");
const products = require("../data/Products.json");
const service = require("./productoPaginacionService");

const originalMethods = {
  countDocuments: Producto.countDocuments,
  find: Producto.find
};

function createQuery(records, options) {
  const query = {
    sort(sort) {
      options.sort = sort;
      return this;
    },
    skip(skip) {
      options.skip = skip;
      return this;
    },
    limit(limit) {
      options.limit = limit;
      return this;
    },
    lean() {
      return this;
    },
    async exec() {
      const sortFields = Object.entries(options.sort);
      return [...records]
        .sort((left, right) => {
          for (const [field, direction] of sortFields) {
            const a = left[field];
            const b = right[field];
            const comparison =
              typeof a === "string" ? a.localeCompare(b) : a - b;
            if (comparison !== 0) {
              return comparison * direction;
            }
          }
          return 0;
        })
        .slice(options.skip, options.skip + options.limit);
    }
  };

  return query;
}

function useMemoryProducts(records = products) {
  const options = {};
  Producto.countDocuments = async () => records.length;
  Producto.find = () => createQuery(records, options);
  return options;
}

function invoke(request) {
  return new Promise(resolve => {
    service.consultarProductosPaginados(
      { request },
      (error, response) => resolve({ error, response })
    );
  });
}

test.afterEach(() => {
  Object.assign(Producto, originalMethods);
});

test("returns the requested ascending page and total counts", async () => {
  const options = useMemoryProducts();
  const result = await invoke({
    pagina: 2,
    limite: 10,
    campoOrdenamiento: "ProductID",
    orden: "ASCENDENTE"
  });

  assert.equal(result.error, null);
  assert.deepEqual(result.response.productos.map(row => row.ProductID), [
    11, 12, 13, 14, 15, 16, 17, 18, 19, 20
  ]);
  assert.equal(result.response.totalRegistros, 77);
  assert.equal(result.response.totalPaginas, 8);
  assert.deepEqual(options, { sort: { ProductID: 1 }, skip: 10, limit: 10 });
});

test("supports descending order by an allowed field", async () => {
  const options = useMemoryProducts();
  const result = await invoke({
    pagina: 1,
    limite: 5,
    campoOrdenamiento: "UnitPrice",
    orden: "DESCENDENTE"
  });

  const expected = [...products]
    .sort((left, right) => right.UnitPrice - left.UnitPrice)
    .slice(0, 5)
    .map(product => product.ProductID);

  assert.equal(result.error, null);
  assert.deepEqual(
    result.response.productos.map(product => product.ProductID),
    expected
  );
  assert.equal(result.response.orden, "DESCENDENTE");
  assert.deepEqual(options.sort, { UnitPrice: -1, ProductID: 1 });
});

test("rejects invalid pagination, sort fields and sort directions", async () => {
  useMemoryProducts();

  const invalidPage = await invoke({ pagina: 0, limite: 10 });
  const invalidLimit = await invoke({ pagina: 1, limite: 101 });
  const invalidField = await invoke({
    pagina: 1,
    limite: 10,
    campoOrdenamiento: "notAProductField"
  });
  const invalidDirection = await invoke({
    pagina: 1,
    limite: 10,
    orden: "SIDEWAYS"
  });

  for (const result of [
    invalidPage,
    invalidLimit,
    invalidField,
    invalidDirection
  ]) {
    assert.equal(result.error.code, grpc.status.INVALID_ARGUMENT);
  }
});

test("returns an empty page and zero page count when no products exist", async () => {
  useMemoryProducts([]);
  const result = await invoke({ pagina: 1, limite: 10 });

  assert.equal(result.error, null);
  assert.deepEqual(result.response.productos, []);
  assert.equal(result.response.totalRegistros, 0);
  assert.equal(result.response.totalPaginas, 0);
});

test("returns an empty list for a page beyond the last page", async () => {
  const options = useMemoryProducts();
  const result = await invoke({ pagina: 99, limite: 10 });

  assert.equal(result.error, null);
  assert.deepEqual(result.response.productos, []);
  assert.equal(result.response.totalPaginas, 8);
  assert.deepEqual(options, { sort: { ProductID: 1 }, skip: 980, limit: 10 });
});

test("returns INTERNAL when MongoDB pagination queries fail", async () => {
  Producto.countDocuments = async () => {
    throw new Error("database detail");
  };
  Producto.find = () => createQuery([], {});

  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    const result = await invoke({ pagina: 1, limite: 10 });
    assert.equal(result.error.code, grpc.status.INTERNAL);
  } finally {
    console.error = originalConsoleError;
  }
});

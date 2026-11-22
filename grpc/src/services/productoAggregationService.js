const grpc = require("@grpc/grpc-js");

const Producto = require("../models/Producto");
const Categoria = require("../models/Categoria");
const Proveedor = require("../models/Proveedor");

const productoConCategoriaPipeline = [
  {
    $lookup: {
      from: Categoria.collection.name,
      localField: "CategoryID",
      foreignField: "CategoryID",
      as: "categoria"
    }
  },
  { $unwind: "$categoria" },
  {
    $project: {
      _id: 0,
      ProductID: 1,
      ProductName: 1,
      SupplierID: 1,
      CategoryID: 1,
      QuantityPerUnit: 1,
      UnitPrice: 1,
      UnitsInStock: 1,
      ReorderLevel: 1,
      categoria: {
        CategoryID: "$categoria.CategoryID",
        CategoryName: "$categoria.CategoryName",
        Description: "$categoria.Description"
      }
    }
  }
];

const productoConProveedorPipeline = [
  {
    $lookup: {
      from: Proveedor.collection.name,
      localField: "SupplierID",
      foreignField: "SupplierID",
      as: "proveedor"
    }
  },
  { $unwind: "$proveedor" },
  {
    $project: {
      _id: 0,
      ProductID: 1,
      ProductName: 1,
      SupplierID: 1,
      CategoryID: 1,
      QuantityPerUnit: 1,
      UnitPrice: 1,
      UnitsInStock: 1,
      ReorderLevel: 1,
      proveedor: {
        SupplierID: "$proveedor.SupplierID",
        CompanyName: "$proveedor.CompanyName",
        ContactName: "$proveedor.ContactName",
        ContactTitle: "$proveedor.ContactTitle",
        Country: "$proveedor.Country",
        City: "$proveedor.City",
        Address: "$proveedor.Address"
      }
    }
  }
];

const productoConCategoriaYProveedorPipeline = [
  {
    $lookup: {
      from: Categoria.collection.name,
      localField: "CategoryID",
      foreignField: "CategoryID",
      as: "categoria"
    }
  },
  { $unwind: "$categoria" },
  {
    $lookup: {
      from: Proveedor.collection.name,
      localField: "SupplierID",
      foreignField: "SupplierID",
      as: "proveedor"
    }
  },
  { $unwind: "$proveedor" },
  {
    $project: {
      _id: 0,
      ProductID: 1,
      ProductName: 1,
      SupplierID: 1,
      CategoryID: 1,
      QuantityPerUnit: 1,
      UnitPrice: 1,
      UnitsInStock: 1,
      ReorderLevel: 1,
      categoria: {
        CategoryID: "$categoria.CategoryID",
        CategoryName: "$categoria.CategoryName",
        Description: "$categoria.Description"
      },
      proveedor: {
        SupplierID: "$proveedor.SupplierID",
        CompanyName: "$proveedor.CompanyName",
        ContactName: "$proveedor.ContactName",
        ContactTitle: "$proveedor.ContactTitle",
        Country: "$proveedor.Country",
        City: "$proveedor.City",
        Address: "$proveedor.Address"
      }
    }
  }
];

function createAggregationHandler(pipeline, description) {
  return async (_call, callback) => {
    let productos;

    try {
      productos = await Producto.aggregate(pipeline).exec();
    } catch (error) {
      const errorType = error instanceof Error ? error.name : "Error desconocido";
      console.error(`Error al consultar ${description} (${errorType}).`);
      callback({
        code: grpc.status.INTERNAL,
        message: `No se pudieron consultar ${description}.`
      });
      return;
    }

    callback(null, { productos });
  };
}

module.exports = {
  obtenerProductosConCategoria: createAggregationHandler(
    productoConCategoriaPipeline,
    "productos con categoría"
  ),
  obtenerProductosConProveedor: createAggregationHandler(
    productoConProveedorPipeline,
    "productos con proveedor"
  ),
  obtenerProductosConCategoriaYProveedor: createAggregationHandler(
    productoConCategoriaYProveedorPipeline,
    "productos con categoría y proveedor"
  )
};


const productos = require("../data/productos");
const proveedores = require("../data/proveedores");

// CONSULTA A: Obtener todos los productos
const obtenerProductos = (call, callback) => {
  callback(null, {
    productos: productos
  });
};

// CONSULTA B1: Obtener campos especificos de productos
const obtenerCampos = (call, callback) => {
  const resultado = productos.map(producto => ({
    ProductID: producto.ProductID,
    ProductName: producto.ProductName,
    UnitPrice: producto.UnitPrice
  }));

  callback(null, {
    productos: resultado
  });
};

// CONSULTA B2: Obtener campos especificos de proveedores
const obtenerCamposProveedores = (call, callback) => {
  const resultado = proveedores.map(proveedor => ({
    SupplierID: proveedor.SupplierID,
    CompanyName: proveedor.CompanyName,
    Country: proveedor.Country
  }));

  callback(null, {
    proveedores: resultado
  });
};

// CONSULTA C1: Filtrar productos por categoria
const filtrarProductos = (call, callback) => {
  const categoriaID = call.request.CategoryID;

  const resultado = productos.filter(
    producto => producto.CategoryID === categoriaID
  );

  callback(null, {
    productos: resultado
  });
};

// CONSULTA C2: Filtrar proveedores por pais
const filtrarProveedores = (call, callback) => {
  const pais = call.request.Country;

  const resultado = proveedores.filter(
    proveedor =>
      proveedor.Country.toLowerCase() === pais.toLowerCase()
  );

  callback(null, {
    proveedores: resultado
  });
};

// Exportar todas las consultas
module.exports = {
  obtenerProductos,
  obtenerCampos,
  obtenerCamposProveedores,
  filtrarProductos,
  filtrarProveedores
};

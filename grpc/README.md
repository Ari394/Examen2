# Implementación de gRPC con Node.js y MongoDB

## 1. ¿Qué es gRPC?

gRPC es un framework de comunicación entre aplicaciones que permite ejecutar procedimientos remotos (RPC). Utiliza Protocol Buffers para definir los servicios y la estructura de los mensajes.

A diferencia de una API REST tradicional, gRPC permite que un cliente invoque métodos definidos en un servicio remoto. Además, utiliza HTTP/2 para la comunicación entre el cliente y el servidor.

## 2. Tecnologías utilizadas

- Node.js
- JavaScript
- gRPC (`@grpc/grpc-js`)
- Protocol Buffers (`@grpc/proto-loader`)
- Mongoose
- MongoDB
- Archivos JSON de Northwind

## 3. Instalación y configuración

Se creó un proyecto de Node.js y se instalaron las dependencias necesarias:

```bash
npm install @grpc/grpc-js @grpc/proto-loader
```

Se definió el servicio `ProductoService` en el archivo `productos.proto`, indicando los métodos disponibles y los tipos de datos utilizados.

El servidor gRPC se configuró para escuchar solicitudes en el puerto `50051`.

Las consultas gRPC existentes utilizan los archivos JSON originales de Northwind cargados en memoria. Además, estos mismos datos se pueden importar a MongoDB mediante Mongoose.

## 4. Consultas implementadas

Se implementaron cinco consultas gRPC utilizando productos y proveedores de Northwind.

### Consulta A — Todos los registros

Se implementó el método `ObtenerProductos`, que devuelve los 77 productos de Northwind con los siguientes campos:

- `ProductID`
- `ProductName`
- `CategoryID`
- `UnitPrice`
- `UnitsInStock`

Esta consulta permite obtener todos los productos con la información definida en el mensaje `Producto` del archivo `.proto`.

### Consulta B1 — Campos específicos de productos

Se implementó el método `ObtenerCampos`, que devuelve los 77 productos, pero únicamente con tres campos:

- `ProductID`
- `ProductName`
- `UnitPrice`

A diferencia de la consulta A, esta consulta utiliza `.map()` para seleccionar solamente los campos necesarios, sin devolver la categoría ni las existencias.

### Consulta B2 — Campos específicos de proveedores

Se implementó el método `ObtenerCamposProveedores`, que devuelve los 29 proveedores de Northwind mostrando únicamente:

- `SupplierID`
- `CompanyName`
- `Country`

Se utiliza `.map()` para seleccionar los campos específicos de cada proveedor.

### Consulta C1 — Filtro de productos por categoría

Se implementó el método `FiltrarProductos`, que permite buscar productos según su `CategoryID`.

Para las pruebas se utilizó:

`CategoryID = 1`

Este identificador corresponde a la categoría **Beverages (Bebidas)** de Northwind.

La consulta utiliza `.filter()` y devuelve los 12 productos que pertenecen a esa categoría.

### Consulta C2 — Filtro de proveedores por país

Se implementó el método `FiltrarProveedores`, que permite buscar proveedores mediante el campo `Country`.

Para las pruebas se utilizó:

`Country = "USA"`

La consulta utiliza `.filter()` para seleccionar los proveedores de Estados Unidos, obteniendo cuatro registros.

La comparación del país se realiza sin distinguir entre letras mayúsculas y minúsculas.

## 5. Datos JSON y persistencia en MongoDB

Los datos originales de Northwind se encuentran en tres archivos:

- `Products.json`: contiene los 77 productos.
- `Categories.json`: contiene las 8 categorías de los productos.
- `Suppliers.json`: contiene los 29 proveedores.

Los archivos están en `src/data/`. Los módulos `productos.js`, `categorias.js` y `proveedores.js` siguen cargándolos en memoria para las consultas existentes.

Los modelos Mongoose están en `src/models/` y conservan los nombres y tipos originales de los campos. Los productos mantienen `CategoryID` y `SupplierID` como identificadores numéricos de sus relaciones.

La importación crea o reemplaza registros por su identificador (`ProductID`, `CategoryID` o `SupplierID`), por lo que puede ejecutarse nuevamente sin duplicarlos. Las colecciones son `productos`, `categorias` y `proveedores`.

## 6. Importar los datos a MongoDB

Configura `MONGO_URI` en el archivo `.env` ubicado en la carpeta `grpc`. No publiques ni compartas el valor de esa variable.

Desde PowerShell, abre una terminal en `grpc` y ejecuta:

```powershell
node src/scripts/importJson.js
```

La salida debe indicar los documentos procesados en cada colección y terminar con `Importación de JSON completada.` Para comprobar los conteos desde Node.js sin mostrar la URI:

```powershell
node -e "const mongoose = require('mongoose'); (async () => { try { await require('./src/config/database')(); const Producto = require('./src/models/Producto'); const Categoria = require('./src/models/Categoria'); const Proveedor = require('./src/models/Proveedor'); console.log(JSON.stringify({ productos: await Producto.countDocuments(), categorias: await Categoria.countDocuments(), proveedores: await Proveedor.countDocuments() })); } catch { console.error('Verificación fallida'); process.exitCode = 1; } finally { await mongoose.disconnect().catch(() => { console.error('No se pudo cerrar la conexión'); process.exitCode = 1; }); } })();"
```

Para los JSON actuales se esperan `77` productos, `8` categorías y `29` proveedores.

## 7. Ejecución del proyecto

Para iniciar el servidor gRPC, MongoDB debe estar disponible:

### Iniciar el servidor

```bash
node src/server.js
```

El servidor queda escuchando solicitudes en el puerto `50051`.

### Ejecutar el cliente

En una segunda terminal:

```bash
node src/client.js
```

El cliente realiza las cinco consultas gRPC y muestra los resultados mediante `console.table()`.

## 8. Resultados de las consultas en memoria

Se realizaron pruebas de las cinco consultas utilizando los datos originales de Northwind.

| Consulta | Resultado obtenido |
|---|---|
| A — Todos los productos | 77 productos |
| B1 — Campos específicos de productos | 77 registros con tres campos |
| B2 — Campos específicos de proveedores | 29 proveedores con tres campos |
| C1 — Productos de la categoría Bebidas | 12 productos |
| C2 — Proveedores de USA | 4 proveedores |

Todas las consultas se ejecutaron correctamente y mostraron los resultados esperados en la terminal.

## 9. Alcance de la implementación

Las consultas gRPC existentes obtienen, proyectan y filtran datos desde los módulos JSON en memoria. La importación a MongoDB está disponible para las siguientes operaciones de base de datos.

Las operaciones CRUD, las agregaciones, la paginación, el ordenamiento y la autenticación JWT aún no forman parte de esta implementación.
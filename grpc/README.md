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

## 8. Consultas avanzadas con Aggregation Pipeline

Se añadieron tres RPC a `ProductoService`, implementadas en `src/services/productoAggregationService.js`. Cada consulta parte de `productos` y combina colecciones por sus identificadores numéricos:

- `ObtenerProductosConCategoria`: une `productos.CategoryID` con `categorias.CategoryID`.
- `ObtenerProductosConProveedor`: une `productos.SupplierID` con `proveedores.SupplierID`.
- `ObtenerProductosConCategoriaYProveedor`: realiza ambas uniones.

Cada pipeline utiliza `$lookup` para relacionar las colecciones, `$unwind` para convertir la relación coincidente en un objeto y `$project` para devolver los campos originales seleccionados. Las relaciones se muestran dentro de `categoria` y `proveedor`. Si la consulta no encuentra productos, responde con `productos: []`; si MongoDB falla, responde con un error gRPC `INTERNAL`.

El cliente ejecuta las tres pruebas con:

```powershell
node src/client.js
```

Para demostrarlo, inicia primero el servidor (`node src/server.js`) con MongoDB disponible y los JSON importados. Después ejecuta el cliente. Por ejemplo, el producto `Chai` (`ProductID: 1`) debe mostrar `Beverages` (`CategoryID: 1`) en la consulta de categoría y `Exotic Liquids` (`SupplierID: 1`) en la de proveedor. La consulta combinada muestra ambos objetos.

## 9. Resultados de las consultas en memoria

Se realizaron pruebas de las cinco consultas utilizando los datos originales de Northwind.

| Consulta | Resultado obtenido |
|---|---|
| A — Todos los productos | 77 productos |
| B1 — Campos específicos de productos | 77 registros con tres campos |
| B2 — Campos específicos de proveedores | 29 proveedores con tres campos |
| C1 — Productos de la categoría Bebidas | 12 productos |
| C2 — Proveedores de USA | 4 proveedores |

Todas las consultas se ejecutaron correctamente y mostraron los resultados esperados en la terminal.

## 10. CRUD gRPC sobre MongoDB

Se añadieron los métodos `CrearProducto`, `ConsultarProductos`, `ActualizarProducto` y `EliminarProducto` a `ProductoService`. Están implementados en `src/services/productoCrudService.js` y operan sobre el modelo Mongoose `Producto`.

- `CrearProducto` valida todos los campos del modelo y rechaza `ProductID` duplicados.
- `ConsultarProductos` consulta MongoDB. Envía `ProductID: 0` para listar todos los productos o un identificador positivo para consultar uno.
- `ActualizarProducto` recibe el producto completo, valida sus campos y actualiza el registro existente identificado por `ProductID`.
- `EliminarProducto` elimina por `ProductID`.

Las respuestas indican éxito y describen la operación. Los parámetros inválidos reciben `INVALID_ARGUMENT`, los identificadores duplicados `ALREADY_EXISTS`, los registros inexistentes `NOT_FOUND` y los fallos de MongoDB `INTERNAL`.

### Ejecutar y demostrar el CRUD

Con MongoDB disponible y `MONGO_URI` configurada, desde la carpeta `grpc`:

1. Importa los datos de referencia si todavía no lo hiciste: `node src/scripts/importJson.js`.
2. Inicia el servidor en una terminal: `node src/server.js`.
3. En otra terminal ejecuta `node src/client.js`. El cliente crea un producto con un `ProductID` temporal, lo consulta, lo actualiza, vuelve a consultarlo y finalmente lo elimina. También confirma que consultar el producto eliminado responde `NOT_FOUND`.
4. Ejecuta las pruebas automatizadas: `npm test`. Estas prueban el ciclo CRUD, duplicados, validación y productos inexistentes usando un almacenamiento simulado.

Para documentar la demostración, captura: (1) el servidor conectado a MongoDB y escuchando en el puerto gRPC; (2) la respuesta exitosa de creación y la consulta del producto guardado, con su `ProductID`; (3) la respuesta de actualización y la consulta donde se ve el nombre o precio cambiado; (4) la eliminación exitosa y la respuesta `NOT_FOUND` al consultar el producto después de eliminarlo.

## 11. Paginación y ordenamiento en MongoDB

El RPC `ConsultarProductosPaginados` está implementado en `src/services/productoPaginacionService.js`. `pagina` empieza en 1, `limite` debe estar entre 1 y 100, y el resultado incluye `totalRegistros` y `totalPaginas`. Si no se especifica un campo, ordena por `ProductID`; si no se especifica dirección, utiliza `ASCENDENTE`.

Los únicos campos permitidos para ordenar son `ProductID`, `ProductName`, `SupplierID`, `CategoryID`, `QuantityPerUnit`, `UnitPrice`, `UnitsInStock` y `ReorderLevel`. La dirección debe ser `ASCENDENTE` o `DESCENDENTE`. Para que la paginación sea estable cuando el campo elegido tiene valores repetidos, se utiliza `ProductID` como desempate ascendente.

Ejemplo de solicitud:

```js
{
  pagina: 1,
  limite: 2,
  campoOrdenamiento: "UnitPrice",
  orden: "DESCENDENTE"
}
```

Con los 77 productos importados, una respuesta de ejemplo es:

```js
{
  productos: [
    { ProductID: 38, ProductName: "Côte de Blaye", UnitPrice: 263.5 },
    { ProductID: 29, ProductName: "Thüringer Rostbratwurst", UnitPrice: 123.79 }
  ],
  pagina: 1,
  limite: 2,
  totalRegistros: "77",
  totalPaginas: "39",
  campoOrdenamiento: "UnitPrice",
  orden: "DESCENDENTE"
}
```

Los campos `totalRegistros` y `totalPaginas` son `int64`; con la configuración del cliente se reciben como cadenas. Si la página está fuera del rango, `productos` será una lista vacía y los totales seguirán indicando el tamaño de la colección. Una colección vacía devuelve cero registros y cero páginas.

El cliente prueba página 1 con `ProductID` ascendente y página 2 con `UnitPrice` descendente:

```powershell
node src/client.js
```

Para demostrarlo, inicia MongoDB y el servidor, ejecuta el cliente y muestra en la salida `pagina`, `limite`, `totalRegistros`, `totalPaginas`, el campo y la dirección aplicados junto con las filas ordenadas. Una solicitud con un campo fuera de la lista permitida o con límite mayor a 100 debe responder `INVALID_ARGUMENT`.

## 12. Autenticación JWT en gRPC

El servidor usa un interceptor de `@grpc/grpc-js` (`src/middleware/jwtAuthInterceptor.js`). Para iniciar, configura `JWT_SECRET` con un valor aleatorio privado y `JWT_EXPIRES_IN` con una duración aceptada por `jsonwebtoken`, por ejemplo `15m` o `1h`, en `grpc/.env`. No incluyas el secreto ni los tokens en capturas, commits o mensajes.

`src/services/jwtService.js` exporta `generateToken(payload)` y `verifyToken(token)`. Los tokens se firman con HS256, incluyen la expiración configurada y se validan con el mismo algoritmo.

### Métodos públicos y protegidos

Son públicos las cinco consultas originales de Persona 1: `ObtenerProductos`, `ObtenerCampos`, `ObtenerCamposProveedores`, `FiltrarProductos` y `FiltrarProveedores`.

Requieren un token Bearer las tres consultas avanzadas (`ObtenerProductosConCategoria`, `ObtenerProductosConProveedor`, `ObtenerProductosConCategoriaYProveedor`), los cuatro métodos CRUD y `ConsultarProductosPaginados`. Los métodos no incluidos en la lista pública también requieren autenticación.

El cliente adjunta el token en la metadata gRPC `authorization` con el formato `Bearer <token>`. Sin token, con token inválido o expirado, el servidor responde `UNAUTHENTICATED` sin ejecutar el handler protegido.

### Probar la autenticación

```powershell
npm test
node src/server.js
```

En otra terminal, ejecuta:

```powershell
node src/client.js
```

El cliente muestra las pruebas `JWT SIN TOKEN`, `JWT INCORRECTO` y `JWT VÁLIDO`. La suite `jwtAuth.test.js` levanta un servidor gRPC real en un puerto local temporal y verifica que las solicitudes sin token, inválidas y expiradas sean rechazadas, que las públicas sigan respondiendo y que el token válido llegue al handler protegido. Las llamadas protegidas del cliente generan un token localmente para esta demostración; en producción, nunca distribuyas `JWT_SECRET` con un cliente: este debe obtener tokens de un servicio de autenticación confiable.

## 13. Alcance pendiente

Las cinco consultas gRPC originales siguen usando los módulos JSON en memoria. Las consultas avanzadas, CRUD, paginación, ordenamiento y autenticación JWT están implementadas.
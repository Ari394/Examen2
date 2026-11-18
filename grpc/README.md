# Implementación de gRPC con Node.js — Datos en memoria

## 1. ¿Qué es gRPC?

gRPC es un framework de comunicación entre aplicaciones que permite ejecutar procedimientos remotos (RPC). Utiliza Protocol Buffers para definir los servicios y la estructura de los mensajes.

A diferencia de una API REST tradicional, gRPC permite que un cliente invoque métodos definidos en un servicio remoto. Además, utiliza HTTP/2 para la comunicación entre el cliente y el servidor.

## 2. Tecnologías utilizadas

- Node.js
- JavaScript
- gRPC (`@grpc/grpc-js`)
- Protocol Buffers (`@grpc/proto-loader`)
- Archivos JSON de Northwind

## 3. Instalación y configuración

Se creó un proyecto de Node.js y se instalaron las dependencias necesarias:

```bash
npm install @grpc/grpc-js @grpc/proto-loader
```

Se definió el servicio `ProductoService` en el archivo `productos.proto`, indicando los métodos disponibles y los tipos de datos utilizados.

El servidor gRPC se configuró para escuchar solicitudes en el puerto `50051`.

Para las pruebas se utilizaron los archivos JSON originales de Northwind, cargados directamente en memoria.

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

## 5. Manejo de datos en memoria

Para realizar las consultas se utilizaron tres archivos JSON de Northwind:

- `Products.json`: contiene los 77 productos.
- `Categories.json`: contiene las categorías de los productos.
- `Suppliers.json`: contiene los 29 proveedores.

Los archivos se encuentran dentro de la carpeta `src/data/`.

Se crearon los módulos `productos.js`, `categorias.js` y `proveedores.js` para cargar estos archivos mediante `require()`.

Los registros se almacenan en memoria durante la ejecución del servidor y se consultan utilizando los métodos `.map()` y `.filter()` de JavaScript.

**No se utiliza MongoDB ni ninguna otra conexión a una base de datos.** Esta implementación corresponde únicamente a las consultas gRPC con datos en memoria.

## 6. Ejecución del proyecto

Para ejecutar el proyecto, abrir una terminal dentro de la carpeta `grpc`.

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

## 7. Resultados de las pruebas

Se realizaron pruebas de las cinco consultas utilizando los datos originales de Northwind.

| Consulta | Resultado obtenido |
|---|---|
| A — Todos los productos | 77 productos |
| B1 — Campos específicos de productos | 77 registros con tres campos |
| B2 — Campos específicos de proveedores | 29 proveedores con tres campos |
| C1 — Productos de la categoría Bebidas | 12 productos |
| C2 — Proveedores de USA | 4 proveedores |

Todas las consultas se ejecutaron correctamente y mostraron los resultados esperados en la terminal.

## 8. Alcance de la implementación

Esta implementación corresponde a la configuración inicial de gRPC y al desarrollo de consultas utilizando datos en memoria.

Se desarrollaron los servicios, mensajes y métodos necesarios para obtener registros, seleccionar campos específicos y aplicar filtros.

La conexión a una base de datos, las consultas JOIN, las operaciones CRUD, la paginación y la autenticación JWT corresponden a otras partes del proyecto y no forman parte de esta implementación.
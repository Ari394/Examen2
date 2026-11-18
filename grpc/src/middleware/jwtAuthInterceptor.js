const grpc = require("@grpc/grpc-js");

const { assertJwtConfiguration, verifyToken } = require("../services/jwtService");

const PUBLIC_METHODS = new Set([
  "ObtenerProductos",
  "ObtenerCampos",
  "ObtenerCamposProveedores",
  "FiltrarProductos",
  "FiltrarProveedores"
]);

const PROTECTED_METHODS = new Set([
  "ObtenerProductosConCategoria",
  "ObtenerProductosConProveedor",
  "ObtenerProductosConCategoriaYProveedor",
  "CrearProducto",
  "ConsultarProductos",
  "ActualizarProducto",
  "EliminarProducto",
  "ConsultarProductosPaginados"
]);

function unauthorizedCall(call, code, details) {
  call.sendStatus({ code, details });
}

function createJwtAuthInterceptor() {
  assertJwtConfiguration();

  return (methodDescriptor, call) => {
    const methodName = methodDescriptor.path.split("/").pop();
    const requiresAuthentication =
      PROTECTED_METHODS.has(methodName) || !PUBLIC_METHODS.has(methodName);

    if (!requiresAuthentication) {
      return call;
    }

    return new grpc.ServerInterceptingCall(call, {
      start(next) {
        const listener = new grpc.ServerListenerBuilder()
          .withOnReceiveMetadata((metadata, nextMetadata) => {
            const authorization = metadata.get("authorization");
            const value = authorization.length === 1 ? authorization[0] : null;
            const match =
              typeof value === "string" ? /^Bearer ([^\s]+)$/i.exec(value) : null;

            if (!match) {
              unauthorizedCall(
                call,
                grpc.status.UNAUTHENTICATED,
                "Se requiere un token Bearer."
              );
              return;
            }

            try {
              verifyToken(match[1]);
            } catch (error) {
              const details =
                error instanceof Error && error.name === "TokenExpiredError"
                  ? "El token JWT expiró."
                  : "El token JWT es inválido.";
              unauthorizedCall(call, grpc.status.UNAUTHENTICATED, details);
              return;
            }

            nextMetadata(metadata);
          })
          .build();

        next(listener);
      }
    });
  };
}

module.exports = {
  createJwtAuthInterceptor,
  PUBLIC_METHODS,
  PROTECTED_METHODS
};

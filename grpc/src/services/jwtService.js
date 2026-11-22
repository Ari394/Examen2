const jwt = require("jsonwebtoken");
const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../../.env")
});

function getJwtConfiguration() {
  const { JWT_SECRET, JWT_EXPIRES_IN } = process.env;

  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET no está configurado.");
  }

  if (!JWT_EXPIRES_IN) {
    throw new Error("JWT_EXPIRES_IN no está configurado.");
  }

  return {
    secret: JWT_SECRET,
    expiresIn: JWT_EXPIRES_IN
  };
}

function assertJwtConfiguration() {
  const { secret, expiresIn } = getJwtConfiguration();

  try {
    jwt.sign({ sub: "configuration-check" }, secret, { expiresIn });
  } catch {
    throw new Error("JWT_EXPIRES_IN no es válido.");
  }
}

function generateToken(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new TypeError("El contenido del token debe ser un objeto.");
  }

  const { secret, expiresIn } = getJwtConfiguration();
  return jwt.sign(payload, secret, { expiresIn, algorithm: "HS256" });
}

function verifyToken(token) {
  if (typeof token !== "string" || token.length === 0) {
    throw new jwt.JsonWebTokenError("Token JWT inválido.");
  }

  const { secret } = getJwtConfiguration();
  return jwt.verify(token, secret, { algorithms: ["HS256"] });
}

module.exports = {
  generateToken,
  verifyToken,
  assertJwtConfiguration
};

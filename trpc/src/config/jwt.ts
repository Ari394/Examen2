
import "dotenv/config";
import jwt, { type JwtPayload } from "jsonwebtoken";

const secret = process.env.JWT_SECRET;

if (!secret) {
  throw new Error("Falta configurar JWT_SECRET en .env");
}

const JWT_SECRET: string = secret;

export function generateToken(userId: string, role: string) {
  return jwt.sign(
    { userId, role },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, JWT_SECRET);

  if (typeof decoded === "string") {
    throw new Error("Token inválido");
  }

  return decoded;
}

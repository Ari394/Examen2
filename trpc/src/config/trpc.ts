
import { initTRPC, TRPCError } from "@trpc/server";
import { verifyToken } from "./jwt.js";

type Context = {
  authorization?: string;
};

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(
  async ({ ctx, next }) => {
    const authorization = ctx.authorization;

    if (!authorization?.startsWith("Bearer ")) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Debes proporcionar un token JWT"
      });
    }

    const token = authorization.slice(7);

    try {
      const user = verifyToken(token);

      return next({
        ctx: {
          user
        }
      });
    } catch {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Token inválido o expirado"
      });
    }
  }
);

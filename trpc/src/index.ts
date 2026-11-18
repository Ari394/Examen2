
import { createHTTPServer } from "@trpc/server/adapters/standalone";
import { appRouter } from "./routers/appRouter.js";

const PORT = 3000;

const server = createHTTPServer({
  router: appRouter,
  createContext({ req }) {
    return {
      authorization: req.headers.authorization
    };
  }
});

server.listen(PORT, () => {
  console.log(`tRPC server running on http://localhost:${PORT}`);
});


import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { appRouter } from './routers/appRouter.js';

const PORT = 3000;

const server = createHTTPServer({
  router: appRouter
});

server.listen(PORT, () => {
  console.log(`tRPC server running on http://localhost:${PORT}`);
});

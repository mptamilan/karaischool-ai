import { createServer as createViteServer } from "vite";
import { createServer } from "./index";

async function startDevServer() {
  const port = process.env.PORT || 8080;
  const app = createServer();

  const vite = await createViteServer({
    server: { 
      middlewareMode: true,
      hmr: {
        port: port as number,
      },
     },
    appType: "spa",
  });

  app.use(vite.middlewares);

  app.listen(port, () => {
    console.log(`Dev server running at http://localhost:${port}`);
  });
}

startDevServer();

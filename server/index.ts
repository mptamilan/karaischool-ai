import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleGenerate } from "./routes/generate";

export function createServer() {
  const app = express();

  // CORS
  const allowedOrigin =
    process.env.ALLOWED_ORIGIN || process.env.NETLIFY_SITE_URL;
  app.use(
    cors({
      origin: allowedOrigin ? [allowedOrigin] : true,
      credentials: true,
    }),
  );

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health
  app.get("/", (_req, res) => {
    res.status(200).send("OK");
  });

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // AI generate endpoint
  app.post("/api/generate", handleGenerate);

  return app;
}

import "dotenv/config";
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { handleDemo } from "./routes/demo";
import { handleGenerate } from "./routes/generate";
import { handleLogin, handleLogout, handleMe } from "./routes/auth";
import { handleDevLogin } from "./routes/devAuth";

export function createServer() {
  const app = express();

  // CORS
  const allowedOrigin =
    process.env.ALLOWED_ORIGIN || process.env.NETLIFY_SITE_URL || "*";
  app.use(
    cors({
      origin: allowedOrigin === "*" ? true : [allowedOrigin],
      credentials: true,
    }),
  );

  // Trust proxy when behind a proxy (Netlify functions)
  if (process.env.TRUST_PROXY !== "false") {
    app.set("trust proxy", 1);
  }

  // Middleware
  app.use(cookieParser());
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

  // Auth routes
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/logout", handleLogout);
  app.get("/api/auth/me", handleMe);

  // Dev-only login helper (creates a JWT and sets cookie) for testing
  if (process.env.NODE_ENV !== "production") {
    app.post("/api/auth/devlogin", handleDevLogin as any);
  }

  // AI generate endpoint
  app.post("/api/generate", handleGenerate);

  return app;
}

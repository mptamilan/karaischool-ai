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

  // If the allowed origin is a wildcard, echo the request origin so that
  // Access-Control-Allow-Origin will be set to the actual caller and
  // cookies (credentials) will work. Otherwise use the configured origin.
  const corsOptions =
    allowedOrigin === "*"
      ? {
          origin: (
            origin: string | undefined,
            callback: (err: Error | null, allow?: boolean | string) => void,
          ) => {
            // allow requests with no origin (mobile apps, curl)
            if (!origin) return callback(null, true);
            return callback(null, origin);
          },
          credentials: true,
        }
      : {
          origin: allowedOrigin === "" ? true : [allowedOrigin],
          credentials: true,
        };

  app.use(cors(corsOptions));

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
    // Dev-only debug route
    const { handleAuthDebug } = require("./routes/auth");
    app.get("/api/auth/debug", handleAuthDebug as any);
  }

  // AI generate endpoint
  app.post("/api/generate", handleGenerate);

  return app;
}

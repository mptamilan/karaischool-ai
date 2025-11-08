import "dotenv/config";
import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import SQLiteStoreInit from "connect-sqlite3";
import path from "path";
import { handleDemo } from "./routes/demo";
import { handleGenerate } from "./routes/generate";
import { handleLogin, handleLogout, handleMe } from "./routes/auth";

export function createServer() {
  const app = express();

  // CORS
  const allowedOrigin = process.env.ALLOWED_ORIGIN || process.env.NETLIFY_SITE_URL || "*";
  app.use(
    cors({
      origin: allowedOrigin === "*" ? true : [allowedOrigin],
      credentials: true,
    }),
  );

  // Session store
  const SQLiteStore = SQLiteStoreInit(session as any);
  const sessionDbPath = process.env.SESSION_DB_PATH || path.join(process.cwd(), "data", "sessions.sqlite3");
  app.use(
    session({
      store: new SQLiteStore({ db: sessionDbPath, dir: path.dirname(sessionDbPath) }),
      secret: process.env.SESSION_SECRET || "dev-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      },
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

  // Auth routes
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/logout", handleLogout);
  app.get("/api/auth/me", handleMe);

  // AI generate endpoint
  app.post("/api/generate", handleGenerate);

  return app;
}

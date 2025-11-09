import express from "express";
import cookieParser from "cookie-parser";
import { handleLogin, handleMe, handleLogout, handleAuthDebug } from "./routes/auth";
import { handleDemo } from "./routes/demo";
import { handleGenerate } from "./routes/generate";
import { handleDevLogin } from "./routes/devAuth";

export function createServer() {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());

  // Auth
  app.post("/api/auth/login", handleLogin);
  app.get("/api/auth/me", handleMe);
  app.post("/api/auth/logout", handleLogout);

  if (process.env.NODE_ENV !== "production") {
    app.get("/api/auth/debug", handleAuthDebug);
    app.post("/api/auth/dev-login", handleDevLogin);
  }

  // API
  app.get("/api/ping", (req, res) => res.json({ pong: true }));
  app.get("/api/demo", handleDemo);
  app.post("/api/generate", handleGenerate);

  return app;
}

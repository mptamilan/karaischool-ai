import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import serverless from "serverless-http";
import { handleLogin, handleMe, handleLogout, handleAuthDebug } from "./routes/auth";
import { handleDemo } from "./routes/demo";
import { handleGenerate } from "./routes/generate";
import { handleDevLogin } from "./routes/devAuth";
import { isAuthenticated } from "./middleware/auth";

export function createServer() {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());

  app.use(
    session({
      secret: process.env.SESSION_SECRET || "secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production",
      },
    })
  );

  // Auth
  app.get("/api/auth/login", handleLogin);
  app.post("/api/auth/login", handleLogin);
  app.get("/api/auth/me", handleMe);
  app.post("/api/auth/logout", handleLogout);

  if (process.env.NODE_ENV !== "production") {
    app.get("/api/auth/debug", handleAuthDebug);
    app.post("/api/auth/dev-login", handleDevLogin);
  }

  // API (protected)
  app.get("/api/ping", (req, res) => res.json({ pong: true }));
  app.get("/api/demo", isAuthenticated, handleDemo);
  app.post("/api/generate", isAuthenticated, handleGenerate);

  return app;
}

// Create and export the app for Vercel
const app = createServer();
export default serverless(app);

import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import { handleLogin, handleMe, handleLogout, handleAuthDebug } from "./routes/auth";
import { handleDemo } from "./routes/demo";
import { handleGenerate } from "./routes/generate";
import { handleDevLogin } from "./routes/devAuth";
import { isAuthenticated } from "./middleware/auth";

console.log("Server starting...");

export function createServer() {
  console.log("createServer() called");
  const app = express();
  console.log("Express app created");

  app.use(cookieParser());
  console.log("Cookie parser middleware enabled");

  app.use(express.json());
  console.log("JSON middleware enabled");

  console.log("Configuring session middleware...");
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
  console.log("Session middleware configured");

  // Auth
  console.log("Registering auth routes...");
  app.get("/api/auth/login", handleLogin);
  app.post("/api/auth/login", handleLogin);
  app.get("/api/auth/me", handleMe);
  app.post("/api/auth/logout", handleLogout);
  console.log("Auth routes registered");

  if (process.env.NODE_ENV !== "production") {
    console.log("Registering dev auth routes...");
    app.get("/api/auth/debug", handleAuthDebug);
    app.post("/api/auth/dev-login", handleDevLogin);
    console.log("Dev auth routes registered");
  }

  // API (protected)
  console.log("Registering protected API routes...");
  app.get("/api/ping", (req, res) => res.json({ pong: true }));
  app.get("/api/demo", isAuthenticated, handleDemo);
  app.post("/api/generate", isAuthenticated, handleGenerate);
  console.log("Protected API routes registered");

  console.log("createServer() finished");
  return app;
}

// Create and export the app for Vercel
console.log("Creating server instance...");
const app = createServer();
console.log("Server instance created");

export default app;

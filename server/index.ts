import express from "express";
import cookieParser from "cookie-parser";
import { handleGenerate } from "./routes/generate";

export function createServer() {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());

  // API
  app.post("/api/generate", handleGenerate);

  return app;
}

// Create and export the app for Vercel
const app = createServer();
export default app;

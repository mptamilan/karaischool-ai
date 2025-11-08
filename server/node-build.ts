import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "./index";
import * as express from "express";

// Improve runtime robustness and make path resolution portable
const app = createServer();
const port = Number(process.env.PORT || process.env.PORT_NUMBER || 3000);

// Resolve dist/spa relative to this file reliably
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, "../spa");

// Serve static files if present
try {
  app.use(express.static(distPath));
  console.log(`Serving static files from ${distPath}`);
} catch (e) {
  console.warn("Could not serve static files from dist/spa:", e);
}

// Handle React Router - serve index.html for all non-API routes
app.get("*", (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  const indexPath = path.join(distPath, "index.html");
  return res.sendFile(indexPath, (err) => {
    if (err) {
      console.error("sendFile error:", err);
      res.status(500).send("Server error");
    }
  });
});

// Global error handlers to avoid crashing on unhandled rejections
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

// Start server and catch startup errors
try {
  app
    .listen(port, () => {
      console.log(`🚀 Fusion Starter server running on port ${port}`);
      console.log(`📱 Frontend: http://localhost:${port}`);
      console.log(`🔧 API: http://localhost:${port}/api`);
    })
    .on("error", (err: any) => {
      console.error("Server failed to start:", err);
      process.exit(1);
    });
} catch (err) {
  console.error("Failed to start server:", err);
  process.exit(1);
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});

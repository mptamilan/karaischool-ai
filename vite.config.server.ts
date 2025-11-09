import { defineConfig } from "vite";
import path from "path";

// Server build configuration
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "server/index.ts"),
      name: "server",
      fileName: "server",
      formats: ["es"],
    },
    outDir: "api",
    target: "node18",
    ssr: true,
    rollupOptions: {
      external: [
        "express",
        "cors",
        "sqlite3",
        "jsonwebtoken",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
});

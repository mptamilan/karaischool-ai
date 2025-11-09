import { createServer } from "./index";
import express from "express";
import path from "path";

const port = process.env.PORT || 8080;
const app = createServer();

app.use(express.static("dist/client"));

app.get("*", (req, res) => {
  res.sendFile(path.resolve("dist/client/index.html"));
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

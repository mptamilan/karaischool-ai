import { createServer } from "../server/index";

// Vercel serverless entry point.
// We create a fresh Express app and forward the incoming request/response to it.
// Note: Vercel will invoke this handler for every function call.

const app = createServer();

export default function handler(req: any, res: any) {
  return app(req, res);
}

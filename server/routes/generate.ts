import type { RequestHandler } from "express";
import type { GenerateRequest, GenerateResponse } from "@shared/api";
import jwt from "jsonwebtoken";

// In-memory rate limiting per user/day (not persistent)
const rateMap = new Map<string, { day: string; count: number }>();
const MAX_PER_DAY = Number(process.env.MAX_DAILY_REQUESTS || "20");

function getUtcDayKey() {
  const now = new Date();
  return now.toISOString().slice(0, 10); // YYYY-MM-DD
}

export const handleGenerate: RequestHandler = async (req, res) => {
  try {
    // Require authenticated JWT
    // Accept token from Authorization header or cookie
    const authHeader = (req.headers["authorization"] as string) || "";
    let token = req.cookies?.ghss_token as string | undefined;
    if (authHeader.startsWith("Bearer ")) token = authHeader.slice(7).trim();
    if (!token)
      return res.status(401).json({ error: "Authentication required" });
    
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
      console.error("SESSION_SECRET not configured");
      return res.status(500).json({ error: "Server configuration error" });
    }
    
    let payload: any = null;
    try {
      payload = jwt.verify(token, secret) as any;
    } catch (e) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const userId = payload?.sub || payload?.email || "anon";
    const day = getUtcDayKey();
    const key = `${userId}:${day}`;
    const current = rateMap.get(key) || { day, count: 0 };
    if (current.day !== day) {
      current.day = day;
      current.count = 0;
    }
    if (current.count >= MAX_PER_DAY) {
      return res.status(429).json({
        error: `Daily limit of ${MAX_PER_DAY} requests reached. Try again tomorrow (UTC).`,
      });
    }

    const body = req.body as GenerateRequest;
    if (!body || typeof body.prompt !== "string" || !body.prompt.trim()) {
      return res
        .status(400)
        .json({ error: "Invalid request: 'prompt' is required." });
    }

    // Proxy to external AI server (your Render-hosted Gemini service)
    const target =
      process.env.SCHOOLAI_API_URL ||
      process.env.VITE_AI_API_URL ||
      "https://schoolai-server.onrender.com";
    const url = `${target.replace(/\/$/, "")}/api/generate`;

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: body.prompt, userId }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("External AI error:", resp.status, text);
      return res
        .status(502)
        .json({ error: "AI service error. Please try again later." });
    }

    const data = await resp.json();

    // Increment usage count on success
    current.count += 1;
    rateMap.set(key, current);

    // Normalize response shape - forward if already includes text, usage, timestamp
    const responsePayload: GenerateResponse = {
      text:
        (data && (data.text || data.answer || JSON.stringify(data))) ||
        "(No content)",
      usage: data.usage || {
        remaining: Math.max(0, MAX_PER_DAY - current.count),
        limit: MAX_PER_DAY,
      },
      timestamp: data.timestamp || new Date().toISOString(),
    };

    res.status(200).json(responsePayload);
  } catch (err) {
    console.error("/api/generate error", err);
    res.status(500).json({ error: "Unexpected server error" });
  }
};

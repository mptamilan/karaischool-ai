import type { RequestHandler } from "express";
import type { GenerateRequest, GenerateResponse } from "@shared/api";

// In-memory rate limiting by IP per UTC day (not persistent)
const rateMap = new Map<string, { day: string; count: number }>();
const MAX_PER_DAY = 20;

function getUtcDayKey() {
  const now = new Date();
  return now.toISOString().slice(0, 10); // YYYY-MM-DD
}

export const handleGenerate: RequestHandler = async (req, res) => {
  try {
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.socket.remoteAddress || "unknown";
    const day = getUtcDayKey();
    const key = `${ip}:${day}`;
    const current = rateMap.get(key) || { day, count: 0 };
    if (current.day !== day) {
      current.day = day;
      current.count = 0;
    }
    if (current.count >= MAX_PER_DAY) {
      return res.status(429).json({ error: `Daily limit of ${MAX_PER_DAY} requests reached. Try again tomorrow (UTC).` });
    }

    const body = req.body as GenerateRequest;
    if (!body || typeof body.prompt !== "string" || !body.prompt.trim()) {
      return res.status(400).json({ error: "Invalid request: 'prompt' is required." });
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Server misconfiguration: missing GOOGLE_GEMINI_API_KEY" });
    }

    // Call Google Generative Language API for Gemini 2.0 Flash Exp
    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const genPayload = {
      contents: [
        {
          role: "user",
          parts: [{ text: body.prompt }],
        },
      ],
    };

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(genPayload),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Gemini API error:", resp.status, text);
      return res.status(502).json({ error: "AI service error. Please try again later." });
    }

    const data = (await resp.json()) as any;
    // Extract text from response
    const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text).join("\n\n") || "";

    current.count += 1;
    rateMap.set(key, current);

    const payload: GenerateResponse = {
      text: text || "(No content)",
      usage: { remaining: Math.max(0, MAX_PER_DAY - current.count), limit: MAX_PER_DAY },
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(payload);
  } catch (err) {
    console.error("/api/generate error", err);
    res.status(500).json({ error: "Unexpected server error" });
  }
};

import type { RequestHandler } from "express";
import type { GenerateRequest, GenerateResponse } from "@shared/api";
import jwt from "jsonwebtoken";
// In-memory rate limiting per user/day (not persistent)
const rateMap = new Map<string, { day: string; count: number }>();

// Lazy-loaded Gemini client (dynamic import to avoid build/runtime issues if module missing)
let genAI: any = null;
let genAIAvailable = true;
const MAX_PER_DAY = Number(process.env.MAX_DAILY_REQUESTS || "20");

function getUtcDayKey() {
  const now = new Date();
  return now.toISOString().slice(0, 10); // YYYY-MM-DD
}

async function getGeminiClient() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GEMINI_API_KEY not configured");
  }
  if (!genAI) {
    if (!genAIAvailable) throw new Error("Gemini client not available");
    try {
      const mod = await import("@google/generative-ai");
      const GoogleGenerativeAI = mod.GoogleGenerativeAI || (mod as any).default;
      genAI = new GoogleGenerativeAI(apiKey);
    } catch (e) {
      genAIAvailable = false;
      console.error("Failed to load @google/generative-ai:", e);
      throw new Error("Gemini client unavailable (module missing)");
    }
  }
  return genAI;
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

    // Call Gemini AI directly
    try {
      const gemini = await getGeminiClient();
      const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp";
      const model = gemini.getGenerativeModel({ model: modelName });

      // Educational AI tutor system prompt
      const systemPrompt = `You are an educational AI tutor for GHSS KARAI AI. Your role is to:
- Help students understand concepts through clear explanations and examples
- Break down complex topics into simple, digestible parts
- Encourage learning through questions and interactive engagement
- Provide accurate, curriculum-relevant information
- Be patient, supportive, and encouraging

Keep responses concise, clear, and age-appropriate for high school students.`;

      const prompt = `${systemPrompt}\n\nStudent Question: ${body.prompt.trim()}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text || text.trim().length === 0) {
        throw new Error("Empty response from AI");
      }

      // Increment usage count on success
      current.count += 1;
      rateMap.set(key, current);

      const responsePayload: GenerateResponse = {
        text: text.trim(),
        usage: {
          remaining: Math.max(0, MAX_PER_DAY - current.count),
          limit: MAX_PER_DAY,
        },
        timestamp: new Date().toISOString(),
      };

      res.status(200).json(responsePayload);
    } catch (aiError: any) {
      console.error("Gemini AI error:", aiError);

      // Don't increment rate limit on AI errors
      const errorMessage = aiError.message || "AI service error";

      // Handle specific Gemini errors
      if (errorMessage.includes("API key")) {
        return res.status(500).json({
          error: "AI service configuration error",
          details: "API key not configured properly",
        });
      }

      return res.status(502).json({
        error: "AI service error. Please try again later.",
        details: errorMessage,
      });
    }
  } catch (err) {
    console.error("/api/generate error", err);
    res.status(500).json({ error: "Unexpected server error" });
  }
};

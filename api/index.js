import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";
import connectSqlite3 from "connect-sqlite3";
import path from "path";
import fs from "fs";
import sqlite3 from "sqlite3";
import jwt from "jsonwebtoken";
const dbFile = process.env.SESSION_DB_PATH || path.join(process.cwd(), "data", "app.db");
const dir = path.dirname(dbFile);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
const db = new (sqlite3.verbose()).Database(dbFile);
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_sub TEXT UNIQUE,
    name TEXT,
    email TEXT,
    picture TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )`);
});
async function findOrCreateUserFromGoogle(info) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE google_sub = ? OR email = ?", [info.sub, info.email], (err, row) => {
      if (err) return reject(err);
      if (row) return resolve(row);
      db.run(
        `INSERT INTO users (google_sub, name, email, picture) VALUES (?,?,?,?)`,
        [info.sub, info.name || null, info.email || null, info.picture || null],
        function(e) {
          if (e) return reject(e);
          db.get("SELECT * FROM users WHERE id = ?", [this.lastID], (err2, newRow) => {
            if (err2) return reject(err2);
            resolve(newRow);
          });
        }
      );
    });
  });
}
const handleLogin = async (req, res) => {
  try {
    const idToken = req.body?.id_token || req.body?.credential || req.body?.idToken;
    if (!idToken) return res.status(400).json({ error: "id_token required" });
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
      idToken
    )}`;
    const r = await fetch(url);
    if (!r.ok) {
      const text = await r.text();
      console.error("tokeninfo error:", r.status, text);
      return res.status(401).json({ error: "Invalid ID token", details: text });
    }
    const info = await r.json();
    const expectedClientId = process.env.VITE_GOOGLE_CLIENT_ID;
    if (!expectedClientId) {
      console.error("VITE_GOOGLE_CLIENT_ID not configured");
      return res.status(500).json({ error: "Server configuration error" });
    }
    if (info.aud !== expectedClientId) {
      console.error("Token audience mismatch:", {
        expected: expectedClientId,
        received: info.aud
      });
      return res.status(401).json({
        error: "Invalid token audience",
        details: "Token was not issued for this application"
      });
    }
    if (info.iss !== "https://accounts.google.com" && info.iss !== "accounts.google.com") {
      console.error("Invalid token issuer:", info.iss);
      return res.status(401).json({ error: "Invalid token issuer" });
    }
    const userProfile = {
      sub: info.sub,
      name: info.name,
      email: info.email,
      picture: info.picture
    };
    const user = await findOrCreateUserFromGoogle(userProfile);
    req.session.user = user;
    res.json({ user });
  } catch (err) {
    console.error("/api/auth/login error", err);
    const message = err instanceof Error ? err.message : "An unknown error occurred";
    res.status(500).json({ error: "Server error", details: message });
  }
};
const handleAuthDebug = (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "Not found" });
  }
  try {
    return res.json({
      session: req.session,
      user: req.session.user
    });
  } catch (e) {
    console.error("/api/auth/debug error", e);
    const message = e instanceof Error ? e.message : "An unknown error occurred";
    res.status(500).json({ error: "Server error", details: message });
  }
};
const handleLogout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error", err);
      return res.status(500).json({ error: "Could not log out" });
    }
    res.clearCookie("connect.sid");
    res.json({ ok: true });
  });
};
const handleMe = (req, res) => {
  res.json({ user: req.session.user || null });
};
const handleDemo = (req, res) => {
  const response = {
    message: "Hello from Express server"
  };
  res.status(200).json(response);
};
const rateMap = /* @__PURE__ */ new Map();
let genAI = null;
let genAIAvailable = true;
const MAX_PER_DAY = Number(process.env.MAX_DAILY_REQUESTS || "20");
function getUtcDayKey() {
  const now = /* @__PURE__ */ new Date();
  return now.toISOString().slice(0, 10);
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
      const GoogleGenerativeAI = mod.GoogleGenerativeAI || mod.default;
      genAI = new GoogleGenerativeAI(apiKey);
    } catch (e) {
      genAIAvailable = false;
      console.error("Failed to load @google/generative-ai:", e);
      throw new Error("Gemini client unavailable (module missing)");
    }
  }
  return genAI;
}
const handleGenerate = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"] || "";
    let token = req.cookies?.ghss_token;
    if (authHeader.startsWith("Bearer ")) token = authHeader.slice(7).trim();
    if (!token)
      return res.status(401).json({ error: "Authentication required" });
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
      console.error("SESSION_SECRET not configured");
      return res.status(500).json({ error: "Server configuration error" });
    }
    let payload = null;
    try {
      payload = jwt.verify(token, secret);
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
        error: `Daily limit of ${MAX_PER_DAY} requests reached. Try again tomorrow (UTC).`
      });
    }
    const body = req.body;
    if (!body || typeof body.prompt !== "string" || !body.prompt.trim()) {
      return res.status(400).json({ error: "Invalid request: 'prompt' is required." });
    }
    try {
      const gemini = await getGeminiClient();
      const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash-exp";
      const model = gemini.getGenerativeModel({ model: modelName });
      const systemPrompt = `You are an educational AI tutor for GHSS KARAI AI. Your role is to:
- Help students understand concepts through clear explanations and examples
- Break down complex topics into simple, digestible parts
- Encourage learning through questions and interactive engagement
- Provide accurate, curriculum-relevant information
- Be patient, supportive, and encouraging

Keep responses concise, clear, and age-appropriate for high school students.`;
      const prompt = `${systemPrompt}

Student Question: ${body.prompt.trim()}`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      if (!text || text.trim().length === 0) {
        throw new Error("Empty response from AI");
      }
      current.count += 1;
      rateMap.set(key, current);
      const responsePayload = {
        text: text.trim(),
        usage: {
          remaining: Math.max(0, MAX_PER_DAY - current.count),
          limit: MAX_PER_DAY
        },
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      };
      res.status(200).json(responsePayload);
    } catch (aiError) {
      console.error("Gemini AI error:", aiError);
      const errorMessage = aiError.message || "AI service error";
      if (errorMessage.includes("API key")) {
        return res.status(500).json({
          error: "AI service configuration error",
          details: "API key not configured properly"
        });
      }
      return res.status(502).json({
        error: "AI service error. Please try again later.",
        details: errorMessage
      });
    }
  } catch (err) {
    console.error("/api/generate error", err);
    res.status(500).json({ error: "Unexpected server error" });
  }
};
const handleDevLogin = async (req, res) => {
  if (process.env.NODE_ENV === "production" || process.env.DISABLE_DEV_LOGIN === "true") {
    return res.status(404).json({ error: "Not found" });
  }
  const { sub, name, email, picture } = req.body || {};
  const user = {
    sub: sub || `dev-${Date.now()}`,
    name: name || "Dev User",
    email: email || "dev@example.com",
    picture: picture || ""
  };
  req.session.user = user;
  res.json({ user });
};
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};
const SqliteStore = connectSqlite3(session);
function createServer() {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use(
    session({
      store: new SqliteStore({
        db: "sessions.sqlite",
        concurrentDB: true
      }),
      secret: process.env.SESSION_SECRET || "secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 1e3 * 60 * 60 * 24 * 30,
        // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production"
      }
    })
  );
  app.get("/api/auth/login", handleLogin);
  app.post("/api/auth/login", handleLogin);
  app.get("/api/auth/me", handleMe);
  app.post("/api/auth/logout", handleLogout);
  if (process.env.NODE_ENV !== "production") {
    app.get("/api/auth/debug", handleAuthDebug);
    app.post("/api/auth/dev-login", handleDevLogin);
  }
  app.get("/api/ping", (req, res) => res.json({ pong: true }));
  app.get("/api/demo", isAuthenticated, handleDemo);
  app.post("/api/generate", isAuthenticated, handleGenerate);
  return app;
}
export {
  createServer
};

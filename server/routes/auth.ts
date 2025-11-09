import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { findOrCreateUserFromGoogle } from "../db/sqlite";

// POST /api/auth/login { id_token }
export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const idToken =
      req.body?.id_token || req.body?.credential || req.body?.idToken;
    if (!idToken) return res.status(400).json({ error: "id_token required" });

    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
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
        received: info.aud,
      });
      return res.status(401).json({
        error: "Invalid token audience",
        details: "Token was not issued for this application",
      });
    }

    if (
      info.iss !== "https://accounts.google.com" &&
      info.iss !== "accounts.google.com"
    ) {
      console.error("Invalid token issuer:", info.iss);
      return res.status(401).json({ error: "Invalid token issuer" });
    }

    const payload = {
      sub: info.sub,
      name: info.name,
      email: info.email,
      picture: info.picture,
    };

    try {
      const saved = await findOrCreateUserFromGoogle({
        sub: info.sub,
        name: info.name,
        email: info.email,
        picture: info.picture,
      });
      if (saved && saved.id) payload["id"] = saved.id;
    } catch (e) {
      console.warn("Failed to persist user to DB", e);
    }

    const secret = process.env.SESSION_SECRET;
    if (!secret) {
      console.error("SESSION_SECRET not configured - cannot issue tokens");
      return res.status(500).json({
        error: "Server configuration error",
        details: "Authentication secret not configured",
      });
    }
    const token = jwt.sign(payload, secret, { expiresIn: "7d" });

    const isProd = process.env.NODE_ENV === "production";

    res.cookie("ghss_token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.json({ user: payload, token });
  } catch (err) {
    console.error("/api/auth/login error", err);
    res.status(500).json({ error: "Server error" });
  }
};

// Dev-only debug route to inspect cookies/headers (useful for mobile debugging)
export const handleAuthDebug: RequestHandler = async (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "Not found" });
  }
  try {
    return res.json({
      cookies: req.cookies || {},
      headers: req.headers,
    });
  } catch (e) {
    console.error("/api/auth/debug error", e);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/auth/logout
export const handleLogout: RequestHandler = async (req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("ghss_token", "", {
    maxAge: 0,
    path: "/",
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  });
  res.json({ ok: true });
};

// GET /api/auth/me
export const handleMe: RequestHandler = async (req, res) => {
  try {
    let token = req.cookies?.ghss_token as string | undefined;
    const authHeader = (req.headers["authorization"] as string) || "";
    if (authHeader.startsWith("Bearer ")) token = authHeader.slice(7).trim();
    if (!token) return res.status(200).json({ user: null });

    const secret = process.env.SESSION_SECRET;
    if (!secret) {
      console.error("SESSION_SECRET not configured");
      return res.status(500).json({ error: "Server configuration error" });
    }

    try {
      const payload = jwt.verify(token, secret) as any;
      return res.json({
        user: {
          sub: payload.sub,
          name: payload.name,
          email: payload.email,
          picture: payload.picture,
        },
      });
    } catch (e) {
      return res.status(200).json({ user: null });
    }
  } catch (err) {
    console.error("/api/auth/me error", err);
    res.status(500).json({ error: "Server error" });
  }
};

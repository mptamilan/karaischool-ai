import type { RequestHandler } from "express";
import { findOrCreateUserFromGoogle } from "../db/sqlite";
import { User } from "@shared/api";

interface GoogleTokenInfo {
  aud: string;
  iss: string;
  sub: string;
  name?: string;
  email?: string;
  picture?: string;
}

// POST /api/auth/login { id_token }
export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const idToken =
      req.body?.id_token || req.body?.credential || req.body?.idToken;
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
    const info: GoogleTokenInfo = await r.json();

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

    const userProfile = {
      sub: info.sub,
      name: info.name,
      email: info.email,
      picture: info.picture,
    };

    const user: User = await findOrCreateUserFromGoogle(userProfile);
    req.session.user = user;

    res.json({ user });
  } catch (err: unknown) {
    console.error("/api/auth/login error", err);
    const message = err instanceof Error ? err.message : "An unknown error occurred";
    res.status(500).json({ error: "Server error", details: message });
  }
};

// Dev-only debug route to inspect the session
export const handleAuthDebug: RequestHandler = (req, res) => {
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({ error: "Not found" });
  }
  try {
    return res.json({
      session: req.session,
      user: req.session.user,
    });
  } catch (e: unknown) {
    console.error("/api/auth/debug error", e);
    const message = e instanceof Error ? e.message : "An unknown error occurred";
    res.status(500).json({ error: "Server error", details: message });
  }
};

// POST /api/auth/logout
export const handleLogout: RequestHandler = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error", err);
      return res.status(500).json({ error: "Could not log out" });
    }
    res.clearCookie("connect.sid"); // The default session cookie name
    res.json({ ok: true });
  });
};

// GET /api/auth/me
export const handleMe: RequestHandler = (req, res) => {
  res.json({ user: req.session.user || null });
};

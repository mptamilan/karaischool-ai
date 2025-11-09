import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

// POST /api/auth/login { id_token }
export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const idToken = req.body?.id_token;
    if (!idToken) return res.status(400).json({ error: "id_token required" });

    // Verify token with Google tokeninfo
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
    const r = await fetch(url);
    if (!r.ok) {
      const text = await r.text();
      console.error("tokeninfo error:", r.status, text);
      return res.status(401).json({ error: "Invalid ID token" });
    }
    const info = await r.json();

    const payload = {
      sub: info.sub,
      name: info.name,
      email: info.email,
      picture: info.picture,
    };

    const secret = process.env.SESSION_SECRET || "dev-secret";
    const token = jwt.sign(payload, secret, { expiresIn: "7d" });

    const isProd = process.env.NODE_ENV === "production";

    res.cookie("ghss_token", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.json({ user: payload });
  } catch (err) {
    console.error("/api/auth/login error", err);
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
    const token = req.cookies?.ghss_token;
    if (!token) return res.status(200).json({ user: null });
    const secret = process.env.SESSION_SECRET || "dev-secret";
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

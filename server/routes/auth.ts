import type { RequestHandler } from "express";
import { findOrCreateUserFromGoogle, getUserById } from "../db/sqlite";

// POST /api/auth/login { id_token }
export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const idToken = req.body?.id_token;
    if (!idToken) return res.status(400).json({ error: "id_token required" });

    // Verify token with Google
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
    const r = await fetch(url);
    if (!r.ok) {
      const text = await r.text();
      console.error("tokeninfo error:", r.status, text);
      return res.status(401).json({ error: "Invalid ID token" });
    }
    const info = await r.json();
    // info contains: aud, sub, email, name, picture, exp, iat
    const expectedAud =
      process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID;
    if (expectedAud && info.aud !== expectedAud) {
      console.warn("token audience mismatch", info.aud, expectedAud);
      // don't fail hard, but warn
    }

    // Create or find user in sqlite
    const user = await findOrCreateUserFromGoogle({
      sub: info.sub,
      name: info.name,
      email: info.email,
      picture: info.picture,
    });

    // Create session
    (req.session as any).userId = user.id;

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.picture,
      },
    });
  } catch (err) {
    console.error("/api/auth/login error", err);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/auth/logout
export const handleLogout: RequestHandler = async (req, res) => {
  req.session = null as any;
  res.json({ ok: true });
};

// GET /api/auth/me
export const handleMe: RequestHandler = async (req, res) => {
  try {
    const uid = (req.session as any)?.userId;
    if (!uid) return res.status(200).json({ user: null });
    const user = await getUserById(uid);
    res.json({ user });
  } catch (err) {
    console.error("/api/auth/me error", err);
    res.status(500).json({ error: "Server error" });
  }
};

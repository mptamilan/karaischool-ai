import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

export const handleDevLogin: RequestHandler = async (req, res) => {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.DISABLE_DEV_LOGIN === "true"
  ) {
    return res.status(404).json({ error: "Not found" });
  }
  const { sub, name, email, picture } = req.body || {};
  const payload = {
    sub: sub || `dev-${Date.now()}`,
    name: name || "Dev User",
    email: email || "dev@example.com",
    picture: picture || "",
  };
  
  // Require SESSION_SECRET even for dev to prevent misconfigured staging/preview deployments
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    return res.status(500).json({ 
      error: "SESSION_SECRET not configured",
      details: "Set SESSION_SECRET in your environment variables, even for local development"
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
  // Return token for testing convenience
  res.json({ user: payload, token });
};

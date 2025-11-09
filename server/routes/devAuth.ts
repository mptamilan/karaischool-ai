import type { RequestHandler } from "express";

export const handleDevLogin: RequestHandler = async (req, res) => {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.DISABLE_DEV_LOGIN === "true"
  ) {
    return res.status(404).json({ error: "Not found" });
  }
  const { sub, name, email, picture } = req.body || {};
  const user = {
    sub: sub || `dev-${Date.now()}`,
    name: name || "Dev User",
    email: email || "dev@example.com",
    picture: picture || "",
  };

  req.session.user = user;

  res.json({ user });
};

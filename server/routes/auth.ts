import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";

// POST /api/auth/login { id_token }
export const handleLogin: RequestHandler = async (req, res) => {
  try {
    const idToken = req.body?.id_token;
    console.debug("/api/auth/login called, id_token present:", !!idToken);
    if (!idToken) return res.status(400).json({ error: "id_token required" });

    // Verify token with Google tokeninfo
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
    const r = await fetch(url);
    if (!r.ok) {
      const text = await r.text();
      console.error("tokeninfo error:", r.status, text);
      return res.status(401).json({ error: "Invalid ID token", details: text });
    }
    const info = await r.json();
    console.debug("tokeninfo result:", {
      iss: info.iss,
      aud: info.aud,
      sub: info.sub,
      email: info.email,
    });

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

    // Return token as well so client can persist and send in Authorization header when cookie is unavailable
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
    // Accept token from cookie or Authorization header
    let token = req.cookies?.ghss_token as string | undefined;
    const authHeader = (req.headers["authorization"] as string) || "";
    if (authHeader.startsWith("Bearer ")) token = authHeader.slice(7).trim();
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

// OAuth2 Authorization Code flow start - redirects user to Google consent page
export const handleOauthStart: RequestHandler = async (req, res) => {
  try {
    const clientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
    const redirectBase = process.env.ALLOWED_ORIGIN || process.env.NETLIFY_SITE_URL || req.headers.origin || "";
    const redirectUri = `${redirectBase.replace(/\/$/, "")}/.netlify/functions/api/auth/callback`;
    const state = Math.random().toString(36).slice(2);
    // store state in cookie for verification
    res.cookie("ghss_oauth_state", state, { httpOnly: true, path: "/", maxAge: 5 * 60 * 1000 });
    const scope = encodeURIComponent("openid email profile");
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&response_type=code&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}&access_type=offline&prompt=consent&state=${encodeURIComponent(state)}`;
    return res.redirect(url);
  } catch (e) {
    console.error("/api/auth/oauth start error", e);
    res.status(500).send("OAuth start error");
  }
};

// OAuth2 callback - exchanges code for tokens and creates local session, then returns a small HTML page that notifies opener
export const handleOauthCallback: RequestHandler = async (req, res) => {
  try {
    const { code, state } = req.query as any;
    const savedState = req.cookies?.ghss_oauth_state;
    if (!code || !state || !savedState || state !== savedState) {
      console.error("Invalid OAuth state", { code, state, savedState });
      return res.status(400).send("Invalid state");
    }
    // Exchange code for tokens
    const clientId = process.env.VITE_GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectBase = process.env.ALLOWED_ORIGIN || process.env.NETLIFY_SITE_URL || req.headers.origin || "";
    const redirectUri = `${redirectBase.replace(/\/$/, "")}/.netlify/functions/api/auth/callback`;
    if (!clientSecret) {
      console.error("Missing GOOGLE_CLIENT_SECRET for server-side OAuth code exchange");
      return res.status(500).send("Server misconfiguration");
    }
    const tokenResp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(code),
        client_id: String(clientId),
        client_secret: String(clientSecret),
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenResp.ok) {
      const text = await tokenResp.text();
      console.error("Token exchange failed", tokenResp.status, text);
      return res.status(500).send("Token exchange failed");
    }
    const tokens = await tokenResp.json();
    const idToken = tokens.id_token as string;
    // Verify id_token with tokeninfo
    const infoResp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!infoResp.ok) {
      const t = await infoResp.text();
      console.error("tokeninfo failed", infoResp.status, t);
      return res.status(500).send("Token verification failed");
    }
    const info = await infoResp.json();
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
    // Clear oauth state cookie
    res.cookie("ghss_oauth_state", "", { maxAge: 0, path: "/" });

    // Respond with a small page that notifies the opener and closes itself
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Signed in</title></head><body>
<script>
  (function(){
    try{
      const user = ${JSON.stringify(payload)};
      const token = ${JSON.stringify(token)};
      if (window.opener) {
        window.opener.postMessage({ type: 'oauth_success', user, token }, '*');
      }
    }catch(e){console.error(e)}
    document.write('<p>Sign in successful. You can close this window.</p>');
    setTimeout(()=>{window.close()},1500);
  })();
</script>
</body></html>`;
    res.status(200).send(html);
  } catch (e) {
    console.error("/api/auth/callback error", e);
    res.status(500).send("OAuth callback error");
  }
};

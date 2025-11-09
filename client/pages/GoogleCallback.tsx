import { useEffect } from "react";

function parseHash(hash: string) {
  const clean = hash.startsWith("#") ? hash.slice(1) : hash;
  const parts = clean.split("&");
  const out: Record<string, string> = {};
  for (const p of parts) {
    const [k, v] = p.split("=");
    if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || "");
  }
  return out;
}

export default function GoogleCallback() {
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const h = parseHash(window.location.hash || "");
      const idToken = q.get("id_token") || h["id_token"] || null;
      if (window.opener && idToken) {
        window.opener.postMessage(
          { type: "ghss_google_credential", credential: idToken },
          window.location.origin,
        );
        // close after short delay
        setTimeout(() => window.close(), 300);
      } else {
        // If no opener (direct visit), just show minimal UI
        document.body.innerText = idToken
          ? "Sign-in successful. You can close this window."
          : "No credential found.";
      }
    } catch (e) {
      try {
        window.opener?.postMessage(
          { type: "ghss_google_credential", credential: null },
          window.location.origin,
        );
      } catch {}
    }
  }, []);
  return null;
}

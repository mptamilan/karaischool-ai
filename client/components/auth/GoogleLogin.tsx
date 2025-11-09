import React, { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/auth";
import LoadingDots from "@/components/chat/LoadingDots";

export default function GoogleLogin() {
  const { authLoading, signIn } = useAuth();
  const popupRef = useRef<Window | null>(null);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!e.data) return;
      if (e.data.type === "oauth_success") {
        try {
          const { user, token } = e.data as any;
          // Save to localStorage so AuthProvider can pick it up
          localStorage.setItem("ghss-karaiai-user", JSON.stringify(user));
          localStorage.setItem("ghss_token", token);
          // Force reload so provider hydrates via stored token
          window.location.reload();
        } catch (err) {
          // ignore
        }
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const startOauth = () => {
    const rawApiBase = (import.meta as any).env.VITE_API_BASE_URL || "";
    const apiBase = (() => {
      if (!rawApiBase) return "";
      try {
        const parsed = new URL(rawApiBase);
        if (parsed.origin === window.location.origin) return "";
        return rawApiBase;
      } catch (e) {
        return rawApiBase;
      }
    })();
    const url = `${apiBase}/api/auth/oauth`;
    // open popup
    const w = window.open(url, "_blank", "width=600,height=700");
    if (w) popupRef.current = w;
  };

  return (
    <div className="flex items-center gap-2">
      <button onClick={startOauth} className="btn-secondary" disabled={!!authLoading}>
        {authLoading ? (
          <>
            <LoadingDots />
            <span className="ml-2">Signing in...</span>
          </>
        ) : (
          "Sign in with Google"
        )}
      </button>
    </div>
  );
}

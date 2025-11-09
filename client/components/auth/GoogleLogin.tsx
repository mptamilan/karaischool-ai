import React, { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/auth";
import LoadingDots from "@/components/chat/LoadingDots";

export default function GoogleLogin() {
  const { authLoading, signIn } = useAuth();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Render Google Sign-In button into container if SDK available
    const g = (window as any).google;
    if (g?.accounts?.id && containerRef.current) {
      try {
        g.accounts.id.renderButton(containerRef.current, {
          theme: "outline",
          size: "large",
        });
      } catch (e) {
        // ignore
      }
    }
  }, []);

  return (
    <div className="flex items-center gap-2">
      <div ref={containerRef} aria-hidden={true} />
      <button onClick={() => signIn()} className="btn-secondary" disabled={!!authLoading}>
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

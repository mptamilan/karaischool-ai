import React, { useEffect, useRef } from "react";
import { useAuth } from "@/hooks/auth";
import LoadingDots from "@/components/chat/LoadingDots";

export default function GoogleLogin() {
  const { signIn, authLoading } = useAuth();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Try to render the official Google button into the container.
    const g = (window as any).google;
    if (g?.accounts?.id && containerRef.current) {
      try {
        // Render official button. The callback is handled by AuthProvider initialize.
        g.accounts.id.renderButton(containerRef.current, {
          theme: "outline",
          size: "large",
        });
        return;
      } catch (e) {
        // fallback to custom button
      }
    }
  }, []);

  return (
    <div className="flex items-center gap-2">
      {/* Official Google button will be rendered into this div when possible */}
      <div ref={containerRef} aria-hidden="true" />
      {/* Custom fallback button (styled like app) */}
      <button
        onClick={() => signIn()}
        className="btn-secondary"
        disabled={!!authLoading}
      >
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

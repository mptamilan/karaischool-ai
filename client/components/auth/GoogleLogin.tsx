import { useEffect, useRef } from "react";

export default function GoogleLogin() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID as string | undefined;
      const rawApiBase = (import.meta as any).env.VITE_AUTH_API_URL || (import.meta as any).env.VITE_API_BASE_URL || "";
      const apiBase = rawApiBase ? rawApiBase.replace(/\/$/, "") : window.location.origin;
      if (!clientId) return;

      const onload = document.createElement("div");
      onload.id = "g_id_onload";
      onload.setAttribute("data-client_id", clientId);
      onload.setAttribute("data-login_uri", `${apiBase}/api/auth/login`);
      onload.setAttribute("data-auto_prompt", "false");

      const signin = document.createElement("div");
      signin.className = "g_id_signin";
      signin.setAttribute("data-type", "standard");
      signin.setAttribute("data-shape", "rectangular");
      signin.setAttribute("data-theme", "outline");
      signin.setAttribute("data-text", "signin_with");
      signin.setAttribute("data-size", "large");

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
        containerRef.current.appendChild(onload);
        containerRef.current.appendChild(signin);
      }

      if (!document.querySelector('script[data-google-id]')) {
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.setAttribute("data-google-id", "1");
        document.head.appendChild(script);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  return <div ref={containerRef} aria-hidden={true} />;
}

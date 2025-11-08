import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export interface AuthUser {
  name: string;
  email: string;
  picture?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  initialized: boolean;
  error: string | null;
  signIn: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function decodeJwt(credential: string): any {
  try {
    const [, payload] = credential.split(".");
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

const STORAGE_KEY = "ghss-karaiai-user";

function loadGoogleSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (
      (window as any).google &&
      (window as any).google.accounts &&
      (window as any).google.accounts.id
    ) {
      return resolve();
    }
    const existing = document.querySelector("script[data-google-id]");
    if (existing) {
      const g = (window as any).google;
      if (g && g.accounts && g.accounts.id) return resolve();
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.setAttribute("data-google-id", "1");
    script.onload = () => {
      setTimeout(() => {
        if (
          (window as any).google &&
          (window as any).google.accounts &&
          (window as any).google.accounts.id
        ) {
          resolve();
        } else {
          let attempts = 0;
          const id = setInterval(() => {
            attempts++;
            if (
              (window as any).google &&
              (window as any).google.accounts &&
              (window as any).google.accounts.id
            ) {
              clearInterval(id);
              resolve();
            } else if (attempts > 10) {
              clearInterval(id);
              reject(new Error("Google SDK not available after load"));
            }
          }, 200);
        }
      }, 50);
    };
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {}
    }
  }, []);

  const apiBase = (import.meta as any).env.VITE_API_BASE_URL || "";

  const handleCredential = useCallback(async (credential: string) => {
    // Send id_token to backend to create a session
    try {
      const res = await fetch(`${apiBase}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id_token: credential }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Login failed");
        return;
      }
      if (data?.user) {
        setUser(data.user);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user)); } catch {}
      }
    } catch (e: any) {
      console.error("handleCredential error", e);
      setError("Login failed");
    }
  }, [apiBase]);

  useEffect(() => {
    let mounted = true;
    async function init() {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
      if (!clientId) {
        setError("Missing VITE_GOOGLE_CLIENT_ID");
        setInitialized(true);
        return;
      }
      try {
        await loadGoogleSdk();
        const g = (window as any).google;
        if (!g || !g.accounts || !g.accounts.id) {
          setError("Google SDK not available");
          setInitialized(true);
          return;
        }
        if (!initializedRef.current) {
          g.accounts.id.initialize({ client_id: clientId, callback: (resp: any) => { if (resp?.credential) handleCredential(resp.credential); } });
          initializedRef.current = true;
        }

        // try restore session via backend
        try {
          const me = await fetch(`${apiBase || ""}/api/auth/me`, { credentials: "include" });
          if (me.ok) {
            const j = await me.json();
            if (mounted && j?.user) {
              setUser(j.user);
              try { localStorage.setItem(STORAGE_KEY, JSON.stringify(j.user)); } catch {}
            }
          }
        } catch (err) {
          // ignore
        }

        if (mounted) setInitialized(true);
      } catch (e: any) {
        console.warn("Google init failed", e);
        setError("Failed to load Google SDK");
        setInitialized(true);
      }
    }
    init();
    return () => { mounted = false; };
  }, [handleCredential, apiBase]);

  const signIn = useCallback(() => {
    const g = (window as any).google;
    if (!initializedRef.current || !g?.accounts?.id) {
      setError("Google SDK not ready. Please refresh the page.");
      return;
    }
    try {
      g.accounts.id.prompt();
    } catch (e: any) {
      console.error("Sign in failed", e);
      setError("Sign in failed. Try again later.");
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch(`${apiBase}/api/auth/logout`, { method: "POST", credentials: "include" });
    } catch (e) {
      // ignore
    }
    setUser(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    const g = (window as any).google;
    try { g?.accounts?.id?.cancel && g.accounts.id.cancel(); } catch {}
  }, [apiBase]);

  const value = useMemo(
    () => ({ user, initialized, error, signIn, signOut }),
    [user, initialized, error, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "@/hooks/use-toast";

export interface AuthUser {
  name: string;
  email: string;
  picture?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token?: string | null;
  initialized: boolean;
  error: string | null;
  authLoading?: boolean;
  signOutLoading?: boolean;
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
  const [token, setToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const initializedRef = useRef(false);

  // Hydrate from localStorage immediately so UI shows logged-in state fast
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setUser(JSON.parse(raw));
      }
      const tok = localStorage.getItem("ghss_token");
      if (tok) setToken(tok);
    } catch {}
  }, []);

  // Determine API base: prefer same-origin unless an explicit remote URL is configured
  const rawApiBase =
    (import.meta as any).env.VITE_AUTH_API_URL ||
    (import.meta as any).env.VITE_API_BASE_URL ||
    "";
  const apiBase = (() => {
    if (!rawApiBase) return "";
    try {
      const parsed = new URL(rawApiBase);
      // If the configured API base points to the same origin as the app, use relative paths
      if (parsed.origin === window.location.origin) return "";
      return rawApiBase;
    } catch (e) {
      return rawApiBase;
    }
  })();

  // Helper function to try configured API base with fallback to same-origin
  const fetchWithFallback = useCallback(async (input: string, init?: RequestInit) => {
    const urls: string[] = [];
    if (/^https?:\/\//i.test(input)) {
      urls.push(input);
      try {
        // also try relative path on same origin
        const rel = input.replace(/^https?:\/\/[^/]+/i, "");
        if (rel) urls.push(rel);
      } catch {}
    } else {
      urls.push(input);
    }
    for (const u of urls) {
      try {
        const r = await fetch(u, init);
        if (r.status !== 404) return r;
      } catch (e) {
        // ignore and try next
      }
    }
    // final attempt
    return fetch(input, init);
  }, []);

  const handleCredential = useCallback(
    async (credential: string) => {
      setAuthLoading(true);
      setError(null);
      try {
        const res = await fetchWithFallback(`${apiBase}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id_token: credential }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || "Login failed");
          toast({
            title: "Login failed",
            description: data?.error || "Unable to sign in",
          });
          setAuthLoading(false);
          return;
        }
        if (data?.user) {
          setUser(data.user);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
          } catch {}
        }
        if (data?.token) {
          setToken(data.token);
          try {
            localStorage.setItem("ghss_token", data.token);
          } catch {}
        }
        // Ensure Google does not auto-select next time
        try {
          (window as any).google?.accounts?.id?.disableAutoSelect?.();
        } catch {}
        toast({
          title: "Signed in",
          description: `Welcome ${data?.user?.name || ""}`,
        });
      } catch (e: any) {
        console.error("handleCredential error", e);
        setError("Login failed");
        toast({
          title: "Login error",
          description: "Unexpected error during sign in",
        });
      } finally {
        setAuthLoading(false);
      }
    },
    [apiBase, fetchWithFallback],
  );

  useEffect(() => {
    let mounted = true;
    async function init() {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as
        | string
        | undefined;
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
          g.accounts.id.initialize({
            client_id: clientId,
            callback: (resp: any) => {
              if (resp?.credential) handleCredential(resp.credential);
            },
          });
          initializedRef.current = true;
        }

        // Attempt to restore session via backend using cookie or stored token
        try {
          const headers: Record<string, string> = {};
          const storedToken = localStorage.getItem("ghss_token");
          if (storedToken) headers["Authorization"] = `Bearer ${storedToken}`;
          const me = await fetchWithFallback(`${apiBase || ""}/api/auth/me`, {
            credentials: "include",
            headers,
          });
          if (me.ok) {
            const j = await me.json();
            if (mounted && j?.user) {
              setUser(j.user);
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(j.user));
              } catch {}
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
    return () => {
      mounted = false;
    };
  }, [handleCredential, apiBase, fetchWithFallback]);

  const signIn = useCallback(() => {
    const g = (window as any).google;
    // Prefer Google Identity Services prompt if available
    if (initializedRef.current && g?.accounts?.id) {
      try {
        setAuthLoading(true);
        g.accounts.id.prompt();
        setTimeout(() => setAuthLoading(false), 6000);
        return;
      } catch (e: any) {
        console.warn("GSI prompt failed, falling back to popup", e);
      }
    }

    // Fallback: open OAuth popup to obtain id_token and postMessage it back
    (async () => {
      try {
        setAuthLoading(true);
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
        if (!clientId) {
          setError("Missing VITE_GOOGLE_CLIENT_ID");
          setAuthLoading(false);
          return;
        }
        const redirectUri = `${window.location.origin}/auth/google-callback`;
        const scope = encodeURIComponent("openid email profile");
        const nonce = Math.random().toString(36).slice(2);
        const state = Math.random().toString(36).slice(2);
        const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
          clientId,
        )}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=id_token&scope=${scope}&nonce=${encodeURIComponent(
          nonce,
        )}&prompt=select_account&state=${encodeURIComponent(state)}`;

        const w = window.open(url, "ghss_google_auth", "width=500,height=700");
        if (!w) {
          setError("Popup blocked. Please allow popups and try again.");
          setAuthLoading(false);
          return;
        }

        const listener = (e: MessageEvent) => {
          if (!e.data) return;
          const data = e.data as any;
          if (data?.type === "ghss_google_credential" && data?.credential) {
            try {
              handleCredential(data.credential);
            } finally {
              setAuthLoading(false);
            }
          }
        };

        window.addEventListener("message", listener, false);

        // Failsafe timeout
        const to = setTimeout(() => {
          try {
            window.removeEventListener("message", listener as any);
          } catch {}
          setAuthLoading(false);
          setError("Login timed out. Please try again.");
          try {
            w.close();
          } catch {}
        }, 120000);

        // Poll for window close to cleanup
        const poll = setInterval(() => {
          if (w.closed) {
            clearInterval(poll);
            clearTimeout(to);
            window.removeEventListener("message", listener as any);
            setAuthLoading(false);
          }
        }, 500);
      } catch (e) {
        console.error("Popup sign-in error", e);
        setError("Sign in failed. Try again later.");
        setAuthLoading(false);
      }
    })();
  }, [handleCredential]);

  const signOut = useCallback(async () => {
    setSignOutLoading(true);
    try {
      await fetch(`${apiBase}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (e) {
      // ignore
    }
    // Clear client-side state
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("ghss_token");
    } catch {}
    // End Google auto-select and cancel prompt
    const g = (window as any).google;
    try {
      g?.accounts?.id?.disableAutoSelect && g.accounts.id.disableAutoSelect();
      g?.accounts?.id?.cancel && g.accounts.id.cancel();
    } catch {}
    toast({ title: "Signed out", description: "You are now signed out" });
    setSignOutLoading(false);
  }, [apiBase]);

  const value = useMemo(
    () => ({
      user,
      token,
      initialized,
      error,
      authLoading,
      signOutLoading,
      signIn,
      signOut,
    }),
    [
      user,
      token,
      initialized,
      error,
      authLoading,
      signOutLoading,
      signIn,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

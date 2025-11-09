import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  initialized: boolean;
  error: string | null;
  signIn: () => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "ghss-karaiai-user";

function loadGoogleSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.accounts?.id) {
      return resolve();
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase = useMemo(() => {
    const rawApiBase = import.meta.env.VITE_API_BASE_URL || "";
    return rawApiBase.replace(/\/$/, "");
  }, []);

  const handleCredential = useCallback(
    async (credential: string) => {
      try {
        const res = await fetch(`${apiBase}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ id_token: credential }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Login failed");
        }
        if (data?.user) {
          setUser(data.user);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
        }
        (window as any).google?.accounts?.id?.disableAutoSelect?.();
        toast({ title: "Signed in", description: `Welcome ${data?.user?.name || ""}` });
      } catch (e: any) {
        console.error("handleCredential error", e);
        setError(e.message || "Login failed");
        toast({ title: "Login error", description: e.message || "Unexpected error during sign in", variant: "destructive" });
      }
    },
    [apiBase]
  );

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
    if (!clientId) {
      setError("Missing VITE_GOOGLE_CLIENT_ID");
      setInitialized(true);
      return;
    }

    loadGoogleSdk()
      .then(() => {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: (resp: any) => {
            if (resp?.credential) handleCredential(resp.credential);
          },
          auto_select: false,
        });
      })
      .catch((e) => {
        console.warn("Google init failed", e);
        setError("Failed to load Google SDK");
      })
      .finally(() => setInitialized(true));
  }, [handleCredential]);

  const signIn = useCallback(() => {
    (window as any).google?.accounts?.id?.prompt();
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch(`${apiBase}/api/auth/logout`, { method: "POST", credentials: "include" });
    } catch (e) {
      console.warn("Logout failed", e);
    }
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    (window as any).google?.accounts?.id?.disableAutoSelect?.();
    toast({ title: "Signed out", description: "You are now signed out" });
  }, [apiBase]);

  const value = useMemo(
    () => ({ user, initialized, error, signIn, signOut }),
    [user, initialized, error, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

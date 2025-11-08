import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {}
    }
    setInitialized(true);
  }, []);

  const handleCredential = useCallback((credential: string) => {
    const data = decodeJwt(credential);
    if (!data) {
      setError("Failed to decode Google credential");
      return;
    }
    const u: AuthUser = {
      name: data.name,
      email: data.email,
      picture: data.picture,
    };
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
  }, []);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as
      | string
      | undefined;
    const g = (window as any).google;
    if (!clientId || !g || !g.accounts || !g.accounts.id) return;
    try {
      g.accounts.id.initialize({
        client_id: clientId,
        callback: (resp: any) => handleCredential(resp.credential),
      });
      // Try one-tap silently
      g.accounts.id.prompt();
    } catch (e) {
      console.warn("Google init failed", e);
    }
  }, [handleCredential]);

  const signIn = useCallback(() => {
    const g = (window as any).google;
    if (g?.accounts?.id) {
      g.accounts.id.prompt();
    } else {
      setError("Google SDK not loaded. Please refresh the page.");
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

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

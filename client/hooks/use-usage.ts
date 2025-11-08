import { useCallback, useEffect, useMemo, useState } from "react";

const MAX = 20;

function todayKey(email: string | null) {
  const d = new Date().toISOString().slice(0, 10);
  return `usage:${email ?? 'anon'}:${d}`;
}

export function useDailyUsage(email: string | null) {
  const [count, setCount] = useState(0);

  const load = useCallback(() => {
    const key = todayKey(email);
    const val = localStorage.getItem(key);
    setCount(val ? parseInt(val, 10) || 0 : 0);
  }, [email]);

  useEffect(() => {
    load();
  }, [load]);

  const increment = useCallback(() => {
    const key = todayKey(email);
    const next = Math.min(MAX, count + 1);
    localStorage.setItem(key, String(next));
    setCount(next);
  }, [count, email]);

  const resetIfNewDay = useCallback(() => {
    // Clean up older keys to avoid stale counts
    const prefix = `usage:${email ?? 'anon'}:`;
    Object.keys(localStorage)
      .filter((k) => k.startsWith(prefix) && k !== todayKey(email))
      .forEach((k) => localStorage.removeItem(k));
  }, [email]);

  useEffect(() => {
    resetIfNewDay();
  }, [resetIfNewDay]);

  return useMemo(() => ({ count, remaining: Math.max(0, MAX - count), limit: MAX, increment, reload: load }), [count, load]);
}

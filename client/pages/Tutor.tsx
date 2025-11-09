import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/auth";
import { useDailyUsage } from "@/hooks/use-usage";
import ChatMessage from "@/components/chat/ChatMessage";
import LoadingDots from "@/components/chat/LoadingDots";
import Sidebar from "@/components/layout/Sidebar";
import type { GenerateResponse } from "@shared/api";
import { AlertTriangle, SendHorizonal, Sparkles } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const examples = [
  "Explain Newton's laws with real-world examples.",
  "Help me solve: 2x + 5 = 19",
  "Give a 150-word summary of India's freedom struggle.",
  "Create a quiz about human digestive system (5 questions).",
];

export default function TutorPage() {
  const { user, signIn, token } = useAuth();
  const usage = useDailyUsage(user?.email ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const canSend = useMemo(
    () => !loading && input.trim().length > 0 && usage.remaining > 0 && !!user,
    [loading, input, usage.remaining, user],
  );

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
  })(); // default to same origin (our server)

  const send = async (text: string) => {
    if (!user) {
      signIn();
      return;
    }
    if (usage.remaining <= 0) {
      setError("You've reached today's limit. Try again after midnight UTC.");
      return;
    }
    const m: Message = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, m]);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const resp = await fetch(`${apiBase}/api/generate`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ prompt: text }),
      });
      const data = (await resp.json()) as GenerateResponse;
      if (!resp.ok || (data as any).error) {
        throw new Error((data as any).error || "Request failed");
      }
      usage.increment();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.text, timestamp: data.timestamp },
      ]);
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) send(input.trim());
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-10 grid grid-cols-1 md:grid-cols-[auto,1fr] gap-6">
      <Sidebar onNewChat={() => setMessages([])} />
      <main className="space-y-4">
        <div className="glass rounded-2xl p-4 md:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold mb-4">
            <Sparkles className="h-4 w-4" />
            AI Tutor
          </div>
          {!user && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
              <div className="text-sm">
                Please sign in with Google to use the tutor.
              </div>
            </div>
          )}
          {error && (
            <div className="mb-4 flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-3 text-red-700">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <div className="text-sm">{error}</div>
            </div>
          )}
          {messages.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {examples.map((ex) => (
                <button
                  key={ex}
                  onClick={() => send(ex)}
                  className="rounded-xl border bg-white/70 p-3 text-left shadow-sm hover:shadow transition"
                >
                  <div className="text-sm font-semibold mb-1">Try this</div>
                  <div className="text-slate-600 text-sm">{ex}</div>
                </button>
              ))}
            </div>
          )}
          <div
            ref={scrollRef}
            className="h-[55vh] md:h-[60vh] overflow-y-auto space-y-3 pr-1"
          >
            {messages.map((m, i) => (
              <ChatMessage
                key={i}
                role={m.role}
                content={m.content}
                timestamp={m.timestamp}
              />
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="glass rounded-2xl px-4 py-3">
                  <LoadingDots />
                </div>
              </div>
            )}
          </div>
          <div className="mt-4">
            <div className="flex items-end gap-3">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={
                  user ? "Ask anything..." : "Sign in to start chatting"
                }
                className="min-h-[52px] max-h-40 flex-1 rounded-2xl border bg-white/70 p-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                disabled={!canSend}
                onClick={() => send(input.trim())}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SendHorizonal className="h-4 w-4 mr-2" />
                Send
              </button>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              {usage.remaining} requests remaining today
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

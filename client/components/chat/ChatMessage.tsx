import MarkdownRenderer from "@/components/MarkdownRenderer";

export interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function ChatMessage({
  role,
  content,
  timestamp,
}: ChatMessageProps) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`${isUser ? "bg-primary text-primary-foreground" : "glass"} rounded-2xl px-4 py-3 max-w-[85%] md:max-w-[70%]`}
      >
        {!isUser ? (
          <MarkdownRenderer content={content} />
        ) : (
          <div className="whitespace-pre-wrap">{content}</div>
        )}
        <div
          className={`mt-1 text-[10px] ${isUser ? "text-white/80" : "text-slate-500"}`}
        >
          {new Date(timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}

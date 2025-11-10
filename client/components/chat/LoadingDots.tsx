import { cn } from "@/lib/utils";

const LoadingDots = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex space-x-1", className)}>
      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.3s]" />
      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500 [animation-delay:-0.15s]" />
      <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-500" />
    </div>
  );
};

export default LoadingDots;

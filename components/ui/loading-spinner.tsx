
import { cn } from "@/lib/utils";

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-24 w-24", className)}>
      <div className="absolute inset-0 animate-spin rounded-full border-4 border-solid border-gray-200 border-t-transparent"></div>
      <div
        className="absolute inset-0 animate-spin rounded-full border-4 border-solid border-transparent"
        style={{ animationDelay: "-0.15s", borderTopColor: "#fd0017" }}
      ></div>
      <div
        className="absolute inset-0 animate-spin rounded-full border-4 border-solid border-transparent"
        style={{ animationDelay: "-0.3s", borderTopColor: "#9fe400" }}
      ></div>
      <div
        className="absolute inset-0 animate-spin rounded-full border-4 border-solid border-transparent"
        style={{ animationDelay: "-0.45s", borderTopColor: "#0073fe" }}
      ></div>
    </div>
  );
}

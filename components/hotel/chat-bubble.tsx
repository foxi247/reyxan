import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/utils";
import { CheckCheck } from "lucide-react";

interface ChatBubbleProps {
  message: string;
  sender: "guest" | "admin";
  createdAt: string;
  readAt?: string | null;
  senderLabel?: string;
}

export function ChatBubble({
  message,
  sender,
  createdAt,
  readAt,
  senderLabel,
}: ChatBubbleProps) {
  const isGuest = sender === "guest";

  return (
    <div
      className={cn(
        "flex flex-col gap-1 max-w-[80%]",
        isGuest ? "items-end ml-auto" : "items-start"
      )}
    >
      {!isGuest && senderLabel && (
        <span className="text-xs text-muted-foreground ml-3 font-medium">
          {senderLabel}
        </span>
      )}
      <div
        className={cn(
          "px-4 py-3 text-sm leading-relaxed",
          isGuest
            ? "bubble-guest"
            : "bubble-admin"
        )}
      >
        {message}
      </div>
      <div
        className={cn(
          "flex items-center gap-1 px-1",
          isGuest ? "justify-end" : "justify-start"
        )}
      >
        <span className="text-[10px] text-muted-foreground">
          {formatTime(createdAt)}
        </span>
        {isGuest && (
          <CheckCheck
            className={cn(
              "h-3 w-3",
              readAt ? "text-gold" : "text-muted-foreground"
            )}
          />
        )}
      </div>
    </div>
  );
}

interface DateSeparatorProps {
  label: string;
}

export function DateSeparator({ label }: DateSeparatorProps) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground font-medium px-2">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

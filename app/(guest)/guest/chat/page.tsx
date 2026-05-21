"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Send, Paperclip, Bed, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { MobileShell } from "@/components/hotel/mobile-shell";
import { HotelLogo } from "@/components/hotel/hotel-logo";
import { ThemeToggle } from "@/components/hotel/theme-toggle";
import { GuestBottomNav } from "@/components/hotel/guest-bottom-nav";
import { ChatBubble, DateSeparator } from "@/components/hotel/chat-bubble";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { sendGuestMessage } from "@/lib/actions/guest";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { ChatMessage } from "@/types/app";

// Mock data for demo — real data comes from Supabase
const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    thread_id: "thread-1",
    sender_type: "guest",
    sender_id: "guest-1",
    message: "Здравствуйте, можно вызвать горничную?",
    read_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "2",
    thread_id: "thread-1",
    sender_type: "admin",
    sender_id: null,
    message: "Здравствуйте! Конечно, горничная подойдёт в течение 10 минут.",
    read_at: null,
    created_at: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
  },
];

export default function GuestChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [roomNumber, setRoomNumber] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    // Get thread ID from session (via API) and set up realtime
    const supabase = createClient();
    // In production, fetch real messages from API
  }, []);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || sending) return;
    if (!threadId) {
      toast.error("Чат недоступен", { description: "Обратитесь к администратору" });
      return;
    }

    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      thread_id: threadId,
      sender_type: "guest",
      sender_id: null,
      message: msg,
      read_at: null,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setInput("");
    setSending(true);

    try {
      const result = await sendGuestMessage(threadId, msg);
      if (!result.success) {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        toast.error("Ошибка", { description: result.error });
        setInput(msg);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <MobileShell>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex flex-col items-center gap-1">
          <HotelLogo size="sm" />
          <span className="text-xs text-muted-foreground font-medium">Чат с администратором</span>
        </div>
        <ThemeToggle size="sm" />
      </div>

      {/* Room badge */}
      <div className="flex justify-center py-3 border-b border-border">
        <Badge variant="cream">
          <Bed className="h-3.5 w-3.5" />
          Комната {roomNumber ?? "—"}
        </Badge>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-40 space-y-4 min-h-[60vh]">
        <DateSeparator label="Сегодня" />

        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Send className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">Сообщений пока нет</p>
            <p className="text-xs text-muted-foreground mt-1">
              Напишите нам — мы ответим в ближайшее время
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg.message}
              sender={msg.sender_type}
              createdAt={msg.created_at}
              readAt={msg.read_at}
              senderLabel="Администратор"
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-mobile px-4 z-40"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center gap-2 rounded-full border border-border bg-card/95 backdrop-blur-xl px-4 py-2 shadow-lg">
          <button className="flex-shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors">
            <Paperclip className="h-5 w-5" />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Введите сообщение…"
            maxLength={1000}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="h-9 w-9 rounded-full flex-shrink-0"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <GuestBottomNav />
    </MobileShell>
  );
}

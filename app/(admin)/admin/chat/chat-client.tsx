"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Send,
  Paperclip,
  ConciergeBell,
  MessageCircle,
  Loader2,
  User,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatBubble, DateSeparator } from "@/components/hotel/chat-bubble";
import { sendAdminMessage } from "@/lib/actions/admin";
import { createClient } from "@/lib/supabase/client";
import { timeAgo, formatDate, formatPhone } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/app";

interface Thread {
  id: string;
  guest_id: string;
  last_message_at: string | null;
  guests: { first_name: string; last_name: string; phone: string } | null;
  rooms: { number: string } | null;
}

interface AdminChatClientProps {
  threads: Thread[];
  adminId: string;
}

export function AdminChatClient({ threads, adminId }: AdminChatClientProps) {
  const [selectedThread, setSelectedThread] = useState<Thread | null>(
    threads[0] ?? null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [search, setSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages for selected thread
  useEffect(() => {
    if (!selectedThread) return;
    setLoadingMessages(true);

    const supabase = createClient();
    supabase
      .from("chat_messages")
      .select("*")
      .eq("thread_id", selectedThread.id)
      .order("created_at")
      .then(({ data }) => {
        setMessages(data ?? []);
        setLoadingMessages(false);
      });

    // Realtime subscription
    const channel = supabase
      .channel(`admin-chat:${selectedThread.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `thread_id=eq.${selectedThread.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedThread?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !selectedThread || sending) return;
    const msg = input.trim();
    setInput("");
    setSending(true);

    const optimistic: ChatMessage = {
      id: `temp-${Date.now()}`,
      thread_id: selectedThread.id,
      sender_type: "admin",
      sender_id: adminId,
      message: msg,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    const result = await sendAdminMessage(selectedThread.id, msg);
    if (!result.success) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      toast.error("Ошибка", { description: result.error });
      setInput(msg);
    }
    setSending(false);
  };

  const filteredThreads = threads.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.rooms?.number.includes(q) ||
      `${t.guests?.first_name} ${t.guests?.last_name}`.toLowerCase().includes(q)
    );
  });

  const guest = selectedThread?.guests;
  const room = selectedThread?.rooms;

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Threads sidebar */}
      <div className="w-80 flex-shrink-0 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по комнате или имени…"
              className="pl-9 h-10 rounded-xl"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredThreads.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Нет активных чатов
            </div>
          ) : (
            filteredThreads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => setSelectedThread(thread)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 border-b border-border/50 hover:bg-accent transition-colors text-left",
                  selectedThread?.id === thread.id && "bg-gold/5 border-l-2 border-l-gold"
                )}
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full gold-gradient text-white text-sm font-medium">
                  {thread.guests?.first_name?.[0]}{thread.guests?.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm truncate">
                      Ком. {thread.rooms?.number}
                    </span>
                    {thread.last_message_at && (
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                        {timeAgo(thread.last_message_at)}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate mt-0.5">
                    {thread.guests?.first_name} {thread.guests?.last_name}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      {selectedThread ? (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Chat header */}
          <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full gold-gradient text-white">
                <ConciergeBell className="h-5 w-5" />
              </div>
              <div>
                <div className="font-medium">
                  Комната {room?.number} · {guest?.first_name} {guest?.last_name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {guest?.phone ? formatPhone(guest.phone) : ""}
                </div>
              </div>
            </div>
            <Badge variant="success">
              <span className="h-2 w-2 rounded-full bg-hotel-green mr-1" />
              В сети
            </Badge>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {loadingMessages ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-gold" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">Сообщений пока нет</p>
              </div>
            ) : (
              <>
                <DateSeparator label="Сегодня" />
                {messages.map((msg) => (
                  <ChatBubble
                    key={msg.id}
                    message={msg.message}
                    sender={msg.sender_type === "admin" ? "guest" : "admin"}
                    createdAt={msg.created_at}
                    readAt={msg.read_at}
                    senderLabel={
                      msg.sender_type === "guest"
                        ? `${guest?.first_name}`
                        : "Администратор"
                    }
                  />
                ))}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3">
              <button className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-accent transition-colors">
                <Paperclip className="h-4 w-4" />
              </button>
              <Input
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
                className="flex-1 rounded-2xl"
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="h-10 w-10 rounded-2xl flex-shrink-0"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Будьте вежливы и профессиональны. Все сообщения сохраняются.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
          <MessageCircle className="h-16 w-16 mb-4 opacity-20" />
          <p>Выберите чат из списка</p>
        </div>
      )}
    </div>
  );
}

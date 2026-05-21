"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// ── Sounds ──────────────────────────────────────────────────────

type SoundType = "request" | "message" | "service" | "order";

function playSound(type: SoundType) {
  try {
    const ACtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new ACtx();

    const notes: [number, number, number][] = // [freq, start, duration]
      type === "request"
        ? [[880, 0, 0.18], [1100, 0.18, 0.18], [880, 0.36, 0.25]]
        : type === "message"
        ? [[1200, 0, 0.08], [950, 0.08, 0.18]]
        : type === "order"
        ? [[660, 0, 0.15], [880, 0.15, 0.15], [660, 0.3, 0.2]]
        : [[770, 0, 0.12], [990, 0.12, 0.2]];

    notes.forEach(([freq, start, dur]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = type === "message" ? "sine" : "triangle";
      gain.gain.setValueAtTime(0.2, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + start + dur
      );
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    });
  } catch {
    /* Audio not available */
  }
}

function notify(title: string, body: string) {
  if (typeof window === "undefined") return;
  if (Notification.permission === "granted") {
    try {
      new Notification(title, { body, icon: "/favicon.ico", tag: title });
    } catch {}
  }
}

// ── Component ────────────────────────────────────────────────────

export function AdminRealtimeSync() {
  const router = useRouter();
  const seen = useRef<Set<string>>(new Set());
  const mountedAt = useRef(Date.now());

  // Only notify for events that happened after this component mounted
  const isNew = (id: string, createdAt: string) => {
    if (seen.current.has(id)) return false;
    seen.current.add(id);
    const age = Date.now() - new Date(createdAt).getTime();
    return age < 60_000; // within last 60 seconds
  };

  useEffect(() => {
    if (typeof window !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const supabase = createClient();
    let cleanup: (() => void) | null = null;

    // Wait for auth session before subscribing to Realtime
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;

      const channel = supabase
        .channel("admin-global-sync", {
          config: { broadcast: { ack: false } },
        })
        // New guest registration request
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "guest_access_requests",
          },
          (payload) => {
            const id = payload.new.id as string;
            const at = payload.new.created_at as string;
            if (!isNew(id, at)) return;
            playSound("request");
            notify("Новая заявка", "Гость ожидает подтверждения");
            toast.info("Новая заявка на заселение!", {
              description: "Гость ожидает подтверждения у ресепшена",
              duration: 6000,
            });
            router.refresh();
          }
        )
        // New guest message in chat
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "chat_messages" },
          (payload) => {
            if (payload.new.sender_type !== "guest") return;
            const id = payload.new.id as string;
            const at = payload.new.created_at as string;
            if (!isNew(id, at)) return;
            playSound("message");
            notify("Новое сообщение от гостя", payload.new.message as string ?? "");
            toast.info("Сообщение от гостя", {
              description: (payload.new.message as string)?.slice(0, 80) ?? "",
              duration: 6000,
            });
            router.refresh();
          }
        )
        // New service request
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "service_requests" },
          (payload) => {
            const id = payload.new.id as string;
            const at = payload.new.created_at as string;
            if (!isNew(id, at)) return;
            playSound("service");
            notify(
              "Новая заявка на сервис",
              (payload.new.title as string) ?? "Новый запрос"
            );
            toast.info("Заявка на сервис!", {
              description: (payload.new.title as string) ?? "",
              duration: 6000,
            });
            router.refresh();
          }
        )
        // New food order
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "room_service_orders" },
          (payload) => {
            const id = payload.new.id as string;
            const at = payload.new.created_at as string;
            if (!isNew(id, at)) return;
            playSound("order");
            notify("Новый заказ еды", "Поступил заказ из номера");
            toast.info("Новый заказ еды!", {
              description: "Поступил заказ из номера",
              duration: 6000,
            });
            router.refresh();
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            console.log("[AdminSync] Realtime connected ✓");
          }
        });

      cleanup = () => supabase.removeChannel(channel);
    });

    // Fast polling: refresh page data every 5 seconds regardless of Realtime
    const interval = setInterval(() => router.refresh(), 5_000);

    return () => {
      cleanup?.();
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

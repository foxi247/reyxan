"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

function playNotificationSound(type: "request" | "service" | "order" = "request") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "request") {
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.2);
    } else if (type === "order") {
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
    } else {
      osc.frequency.setValueAtTime(770, ctx.currentTime);
      osc.frequency.setValueAtTime(990, ctx.currentTime + 0.12);
    }

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // Audio unavailable — silent fail
  }
}

function showPushNotification(title: string, body: string) {
  if (typeof window === "undefined") return;
  if (Notification.permission === "granted") {
    try {
      new Notification(title, {
        body,
        icon: "/favicon.ico",
        tag: title,
      });
    } catch {
      // Notification API unavailable
    }
  }
}

export function AdminRealtimeSync() {
  const router = useRouter();
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Request browser notification permission
    if (typeof window !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const supabase = createClient();

    const channel = supabase
      .channel("admin-global-sync")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "guest_access_requests" },
        (payload) => {
          const id = payload.new.id as string;
          if (seenRef.current.has(id)) return;
          seenRef.current.add(id);
          playNotificationSound("request");
          showPushNotification("Новая заявка на заселение", "Гость ожидает подтверждения");
          toast.info("Новая заявка!", { description: "Гость ожидает подтверждения" });
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "service_requests" },
        (payload) => {
          const id = payload.new.id as string;
          if (seenRef.current.has(id)) return;
          seenRef.current.add(id);
          playNotificationSound("service");
          showPushNotification(
            "Новая заявка на сервис",
            (payload.new.title as string) ?? "Новый запрос"
          );
          toast.info("Новая заявка на сервис!", {
            description: (payload.new.title as string) ?? "",
          });
          router.refresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "room_service_orders" },
        (payload) => {
          const id = payload.new.id as string;
          if (seenRef.current.has(id)) return;
          seenRef.current.add(id);
          playNotificationSound("order");
          showPushNotification("Новый заказ еды", "Поступил заказ из номера");
          toast.info("Новый заказ еды!", { description: "Поступил заказ из номера" });
          router.refresh();
        }
      )
      .subscribe();

    // Fallback: refresh every 30s in case Realtime misses events due to RLS
    const interval = setInterval(() => {
      router.refresh();
    }, 30_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [router]);

  return null;
}

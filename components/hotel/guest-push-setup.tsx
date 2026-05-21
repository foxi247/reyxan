"use client";

import { useEffect } from "react";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return new Uint8Array(Array.from(rawData).map((c) => c.charCodeAt(0)));
}

export function GuestPushSetup() {
  useEffect(() => {
    if (!VAPID_PUBLIC) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    const setup = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;

        const existingSub = await reg.pushManager.getSubscription();
        if (existingSub) return; // already subscribed

        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
        });

        const subJson = sub.toJSON();
        await fetch("/api/guest/push-subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subJson),
        });
      } catch {
        // Push setup is optional — ignore errors
      }
    };

    // Delay to not block initial render
    const timer = setTimeout(setup, 3000);
    return () => clearTimeout(timer);
  }, []);

  return null;
}

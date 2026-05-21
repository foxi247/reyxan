"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DoorOpen, Star, CheckCircle2 } from "lucide-react";
import { HotelLogo } from "@/components/hotel/hotel-logo";
import { Button } from "@/components/ui/button";
import { MobileShell } from "@/components/hotel/mobile-shell";

interface WelcomeClientProps {
  firstName: string;
  lastName: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
}

export function WelcomeClient({
  firstName,
  lastName,
  roomNumber,
  checkIn,
  checkOut,
}: WelcomeClientProps) {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const storageKey = `reyxan_welcome_${firstName}_${roomNumber}`;
    if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(storageKey)) {
      router.replace("/guest");
      return;
    }
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(storageKey, "1");
    }

    // Animate in
    const showTimer = setTimeout(() => setVisible(true), 50);

    // Countdown then redirect
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          router.replace("/guest");
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(showTimer);
      clearInterval(interval);
    };
  }, [firstName, roomNumber, router]);

  return (
    <MobileShell>
      <div
        className={`flex min-h-screen flex-col items-center justify-center px-6 py-8 text-center transition-all duration-700 ${
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* Stars */}
        <div className="flex gap-1 mb-6">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star
              key={i}
              className="h-4 w-4 text-gold fill-gold"
              style={{
                opacity: visible ? 1 : 0,
                transition: `opacity 0.4s ease ${0.1 + i * 0.08}s`,
              }}
            />
          ))}
        </div>

        {/* Logo */}
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "scale(1)" : "scale(0.9)",
            transition: "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s",
          }}
        >
          <HotelLogo size="lg" />
        </div>

        {/* Welcome text */}
        <div
          className="mt-8"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(12px)",
            transition: "all 0.5s ease 0.3s",
          }}
        >
          <p className="text-sm font-medium text-gold uppercase tracking-[0.2em] mb-2">
            Добро пожаловать
          </p>
          <h1 className="font-serif text-4xl font-medium leading-tight">
            {firstName}
            <br />
            <span className="text-muted-foreground text-3xl">{lastName}</span>
          </h1>
        </div>

        {/* Room card */}
        <div
          className="mt-8 w-full"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
            transition: "all 0.5s ease 0.5s",
          }}
        >
          <div className="hotel-card px-6 py-5 flex items-center gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl gold-gradient">
              <DoorOpen className="h-7 w-7 text-white" />
            </div>
            <div className="text-left flex-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
                Ваш номер
              </p>
              <p className="font-serif text-3xl font-medium text-gold">
                {roomNumber}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDate(checkIn)} — {formatDate(checkOut)}
              </p>
            </div>
            <CheckCircle2 className="h-6 w-6 text-hotel-green flex-shrink-0" />
          </div>
        </div>

        {/* Message */}
        <p
          className="mt-6 text-sm text-muted-foreground leading-relaxed max-w-xs"
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 0.5s ease 0.65s",
          }}
        >
          Желаем вам приятного пребывания. Мы здесь, чтобы сделать ваш отдых незабываемым.
        </p>

        {/* CTA */}
        <div
          className="mt-8 w-full"
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 0.5s ease 0.75s",
          }}
        >
          <Button
            size="lg"
            className="w-full gold-gradient text-white border-0 h-13 text-base"
            onClick={() => router.replace("/guest")}
          >
            Войти в личный кабинет
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            Автоматический вход через {countdown} сек…
          </p>
        </div>
      </div>
    </MobileShell>
  );
}

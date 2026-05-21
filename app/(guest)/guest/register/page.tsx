"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Phone, ArrowRight, Loader2, Info, Wifi, Battery } from "lucide-react";
import { MobileShell } from "@/components/hotel/mobile-shell";
import { HotelLogo } from "@/components/hotel/hotel-logo";
import { ThemeToggle } from "@/components/hotel/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { guestAccessRequestSchema, type GuestAccessRequestInput } from "@/lib/validations/guest";
import { submitGuestAccessRequest } from "@/lib/actions/guest";
import { toast } from "sonner";

export default function GuestRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GuestAccessRequestInput>({
    resolver: zodResolver(guestAccessRequestSchema),
  });

  const onSubmit = async (data: GuestAccessRequestInput) => {
    setLoading(true);
    try {
      const result = await submitGuestAccessRequest(data.phone);
      if (result.success && result.data) {
        router.push(`/guest/pending?requestId=${result.data.requestId}`);
      } else {
        toast.error("Ошибка", { description: result.error ?? "Попробуйте позже" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileShell>
      {/* Status bar */}
      <div className="status-bar pt-3">
        <span className="font-medium">9:41</span>
        <div className="flex items-center gap-1.5">
          <Wifi className="h-3.5 w-3.5" />
          <Battery className="h-3.5 w-3.5" />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3">
        <div />
        <HotelLogo size="sm" />
        <ThemeToggle size="sm" />
      </div>

      {/* Hero illustration */}
      <div className="relative mx-6 h-44 overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50 dark:from-stone-900 dark:via-stone-800 dark:to-amber-900/30">
        {/* Decorative arch SVG */}
        <svg
          className="absolute inset-0 h-full w-full opacity-20 dark:opacity-10"
          viewBox="0 0 400 200"
          preserveAspectRatio="xMidYMid slice"
        >
          <path
            d="M100 200 Q100 80 200 80 Q300 80 300 200"
            fill="none"
            stroke="hsl(32 46% 51%)"
            strokeWidth="1.5"
          />
          <path
            d="M60 200 Q60 40 200 40 Q340 40 340 200"
            fill="none"
            stroke="hsl(32 46% 51%)"
            strokeWidth="1"
          />
          <line x1="200" y1="40" x2="200" y2="10" stroke="hsl(32 46% 51%)" strokeWidth="1" />
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 45 * Math.PI) / 180;
            const cx = 200 + 8 * Math.cos(angle);
            const cy = 10 + 8 * Math.sin(angle);
            return <circle key={i} cx={cx} cy={cy} r="1" fill="hsl(32 46% 51%)" />;
          })}
          <rect x="160" y="140" width="80" height="60" rx="4" fill="hsl(32 46% 51% / 0.15)" />
          <rect x="175" y="100" width="20" height="40" rx="2" fill="hsl(32 46% 51% / 0.15)" />
          <rect x="205" y="100" width="20" height="40" rx="2" fill="hsl(32 46% 51% / 0.15)" />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="h-14 w-14 rounded-full gold-gradient flex items-center justify-center shadow-lg">
            <Phone className="h-7 w-7 text-white" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pt-6 pb-8">
        <h1 className="font-serif text-4xl font-medium leading-[1.1] tracking-tight">
          Добро<br />пожаловать.
        </h1>
        <p className="mt-3 text-muted-foreground text-base leading-relaxed">
          Для доступа к сервисам отеля введите номер телефона.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Номер телефона</Label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="+7 (___) ___-__-__"
                className="pl-11"
                {...register("phone")}
              />
            </div>
            {errors.phone && (
              <p className="text-sm text-destructive">{errors.phone.message}</p>
            )}
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Отправить заявку
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        {/* Info card */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border bg-secondary/50 px-4 py-3.5">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Эта страница открывается после сканирования QR-кода на ресепшене.
          </p>
        </div>
      </div>
    </MobileShell>
  );
}

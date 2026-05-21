"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Wifi, Loader2, Star } from "lucide-react";
import { MobileShell } from "@/components/hotel/mobile-shell";
import { HotelLogo } from "@/components/hotel/hotel-logo";
import { ThemeToggle } from "@/components/hotel/theme-toggle";
import { GuestBottomNav } from "@/components/hotel/guest-bottom-nav";
import { GuestRoomCard } from "@/components/hotel/guest-room-card";
import { GuestServiceCard } from "@/components/hotel/guest-service-card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { createServiceRequest } from "@/lib/actions/guest";
import { toast } from "sonner";
import type { GuestSession } from "@/types/app";
import type { Service } from "@/types/app";
import { ROUTES } from "@/lib/constants";

interface GuestHomeClientProps {
  session: GuestSession;
  services: Service[];
  dateRange: string;
}

export function GuestHomeClient({
  session,
  services,
  dateRange,
}: GuestHomeClientProps) {
  const router = useRouter();
  const [loadingService, setLoadingService] = useState<string | null>(null);
  const [wifiOpen, setWifiOpen] = useState(false);

  const handleServiceClick = async (service: Service) => {
    if (service.action_type === "chat") {
      router.push(ROUTES.guest.chat);
      return;
    }
    if (service.action_type === "page" && service.action_value) {
      router.push(service.action_value);
      return;
    }
    if (service.action_type === "link" && service.action_value) {
      window.open(service.action_value, "_blank");
      return;
    }
    if (service.action_type === "request") {
      if (service.icon === "Wifi") {
        setWifiOpen(true);
        return;
      }
      setLoadingService(service.id);
      try {
        const result = await createServiceRequest(
          service.id,
          service.title
        );
        if (result.success) {
          toast.success("Заявка создана", {
            description: "Сотрудник отеля свяжется с вами в ближайшее время.",
          });
        } else {
          toast.error("Ошибка", { description: result.error });
        }
      } finally {
        setLoadingService(null);
      }
    }
  };

  return (
    <MobileShell>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <HotelLogo size="sm" />
        <ThemeToggle size="sm" />
      </div>

      {/* Hero */}
      <div className="relative mx-4 overflow-hidden rounded-3xl bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50 dark:from-stone-900/80 dark:via-stone-800/50 dark:to-amber-900/20 px-6 pt-7 pb-20">
        {/* Decorative bg */}
        <svg
          className="absolute right-0 bottom-0 opacity-10 dark:opacity-5"
          width="180"
          height="140"
          viewBox="0 0 180 140"
        >
          <path
            d="M40 140 Q40 40 90 40 Q140 40 140 140"
            fill="none"
            stroke="hsl(32 46% 51%)"
            strokeWidth="1.5"
          />
          <path
            d="M10 140 Q10 10 90 10 Q170 10 170 140"
            fill="none"
            stroke="hsl(32 46% 51%)"
            strokeWidth="1"
          />
        </svg>

        <Badge variant="success" className="mb-4">
          <CheckCircle className="h-3.5 w-3.5" />
          Одобрен
        </Badge>

        <h1 className="font-serif text-4xl font-medium leading-[1.12] tracking-tight">
          Добро<br />пожаловать<br />
          <span className="text-gold">
            в Рейхан,
          </span>
        </h1>
        <p className="mt-2 text-xl font-medium text-muted-foreground">
          {session.firstName} {session.lastName}
        </p>
      </div>

      {/* Room card */}
      <div className="px-4 -mt-12 relative z-10">
        <GuestRoomCard
          roomNumber={session.roomNumber ?? "—"}
          checkIn={session.checkIn}
          checkOut={session.checkOut}
          onClick={() => router.push(ROUTES.guest.profile)}
        />
      </div>

      {/* Services */}
      <div className="px-4 pt-6 pb-32">
        <h2 className="font-serif text-xl font-medium mb-4 px-1">Сервисы отеля</h2>

        {services.length === 0 ? (
          <div className="rounded-3xl border border-border bg-card px-6 py-8 text-center">
            <p className="text-muted-foreground text-sm">Сервисы временно недоступны</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {services.map((service) => (
              <GuestServiceCard
                key={service.id}
                title={service.title}
                icon={service.icon}
                loading={loadingService === service.id}
                onClick={() => handleServiceClick(service)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Rate your stay */}
      <div className="px-4 pb-4 -mt-24">
        <button
          onClick={() => router.push(ROUTES.guest.rate)}
          className="w-full flex items-center gap-3 rounded-2xl border border-amber-200/60 dark:border-amber-800/40 bg-amber-50/80 dark:bg-amber-900/20 px-5 py-4 text-left hover:bg-amber-100/80 dark:hover:bg-amber-900/30 transition-colors"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-800/40">
            <Star className="h-5 w-5 text-amber-500 dark:text-amber-400" />
          </div>
          <div>
            <div className="font-medium text-sm">Оценить пребывание</div>
            <div className="text-xs text-muted-foreground mt-0.5">Поделитесь впечатлениями</div>
          </div>
        </button>
      </div>

      {/* Wi-Fi Modal */}
      <Dialog open={wifiOpen} onOpenChange={setWifiOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5 text-gold" />
              Wi-Fi Рейхан
            </DialogTitle>
            <DialogDescription>
              Данные для подключения к сети отеля
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-border bg-secondary p-4">
              <span className="text-sm text-muted-foreground">Сеть</span>
              <span className="font-medium">Reyxan_Hotel</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border bg-secondary p-4">
              <span className="text-sm text-muted-foreground">Пароль</span>
              <span className="font-medium font-mono">reyxan2024</span>
            </div>
            <p className="text-xs text-center text-muted-foreground pt-1">
              Скорость до 100 Мбит/с · Бесплатно
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <GuestBottomNav />
    </MobileShell>
  );
}

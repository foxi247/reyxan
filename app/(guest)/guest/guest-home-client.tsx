"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Star, Wifi } from "lucide-react";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createServiceRequest } from "@/lib/actions/guest";
import { toast } from "sonner";
import type { GuestSession, Service } from "@/types/app";
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
        const result = await createServiceRequest(service.id, service.title);

        if (result.success) {
          toast.success("Заявка отправлена", {
            description: "Сотрудник отеля свяжется с вами в ближайшее время.",
          });
        } else {
          toast.error("Не удалось отправить заявку", {
            description: result.error,
          });
        }
      } finally {
        setLoadingService(null);
      }
    }
  };

  return (
    <MobileShell>
      <div className="flex items-center justify-between px-6 py-5">
        <HotelLogo size="sm" />
        <ThemeToggle size="sm" />
      </div>

      <div className="px-4">
        <section className="royal-panel relative overflow-hidden rounded-[32px] px-6 pb-20 pt-7">
          <div className="absolute inset-0 opacity-30">
            <div className="absolute right-[-12%] top-[-8%] h-44 w-44 rounded-full border border-gold/18" />
            <div className="absolute left-[-10%] bottom-[-12%] h-36 w-36 rounded-full border border-gold/10" />
          </div>

          <div className="relative">
            <Badge variant="gold" className="mb-4">
              <CheckCircle className="h-3.5 w-3.5" />
              Гость подтверждён
            </Badge>

            <p className="text-xs uppercase tracking-[0.28em] text-gold/80">Добро пожаловать</p>
            <h1 className="mt-3 font-serif text-4xl font-medium leading-[1.08] tracking-tight text-hotel-cream">
              Ваше пребывание
              <span className="block text-gold">в Reyhan Hotel</span>
            </h1>
            <p className="mt-3 text-lg font-medium text-hotel-cream/90">
              {session.firstName} {session.lastName}
            </p>
            <p className="mt-2 max-w-[280px] text-sm leading-6 text-muted-foreground">
              Сервисы отеля, общение с администрацией и все важные детали проживания
              собраны в одном красивом кабинете.
            </p>
          </div>
        </section>
      </div>

      <div className="relative z-10 -mt-12 px-4">
        <GuestRoomCard
          roomNumber={session.roomNumber ?? "—"}
          checkIn={session.checkIn}
          checkOut={session.checkOut}
          onClick={() => router.push(ROUTES.guest.profile)}
        />
      </div>

      <div className="px-4 pb-32 pt-6">
        <div className="mb-4 flex items-end justify-between px-1">
          <div>
            <h2 className="font-serif text-2xl font-medium text-hotel-cream">Сервисы отеля</h2>
            <p className="mt-1 text-xs uppercase tracking-[0.22em] text-muted-foreground">
              доступно во время проживания
            </p>
          </div>
          <span className="text-xs text-muted-foreground">{dateRange}</span>
        </div>

        {services.length === 0 ? (
          <div className="hotel-card px-6 py-8 text-center">
            <p className="text-sm text-muted-foreground">Сервисы временно недоступны</p>
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

      <div className="-mt-24 px-4 pb-4">
        <button
          onClick={() => router.push(ROUTES.guest.rate)}
          className="hotel-card flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:border-gold/30"
        >
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gold/12 text-gold">
            <Star className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-hotel-cream">Оценить пребывание</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              Поделитесь впечатлениями о сервисе и атмосфере отеля
            </div>
          </div>
        </button>
      </div>

      <Dialog open={wifiOpen} onOpenChange={setWifiOpen}>
        <DialogContent className="border-gold/12 bg-card text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-hotel-cream">
              <Wifi className="h-5 w-5 text-gold" />
              Wi-Fi Reyhan Hotel
            </DialogTitle>
            <DialogDescription>
              Данные для подключения к беспроводной сети отеля.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-gold/12 bg-secondary/50 p-4">
              <span className="text-sm text-muted-foreground">Сеть</span>
              <span className="font-medium text-hotel-cream">Reyxan_Hotel</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-gold/12 bg-secondary/50 p-4">
              <span className="text-sm text-muted-foreground">Пароль</span>
              <span className="font-mono font-medium text-hotel-cream">reyxan2024</span>
            </div>
            <p className="pt-1 text-center text-xs text-muted-foreground">
              До 100 Мбит/с, доступно для гостей без дополнительной оплаты.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <GuestBottomNav />
    </MobileShell>
  );
}

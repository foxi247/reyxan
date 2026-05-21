"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User,
  Bed,
  Phone,
  Calendar,
  CheckCircle,
  MessageCircle,
  LogOut,
} from "lucide-react";
import { MobileShell } from "@/components/hotel/mobile-shell";
import { HotelLogo } from "@/components/hotel/hotel-logo";
import { ThemeToggle } from "@/components/hotel/theme-toggle";
import { GuestBottomNav } from "@/components/hotel/guest-bottom-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatPhone } from "@/lib/utils";
import type { GuestSession } from "@/types/app";
import { ROUTES } from "@/lib/constants";
import { toast } from "sonner";

interface GuestProfileClientProps {
  session: GuestSession;
}

export function GuestProfileClient({ session }: GuestProfileClientProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/guest/logout", { method: "POST" });
      router.push(ROUTES.guest.register);
    } catch {
      toast.error("Ошибка выхода");
    }
  };

  const infoRows = [
    { Icon: Bed, label: "Комната", value: session.roomNumber ?? "—" },
    { Icon: Phone, label: "Телефон", value: formatPhone(session.phone) },
    { Icon: Calendar, label: "Дата заезда", value: formatDate(session.checkIn) },
    { Icon: Calendar, label: "Дата выезда", value: formatDate(session.checkOut) },
  ];

  return (
    <MobileShell>
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <HotelLogo size="sm" />
        <ThemeToggle size="sm" />
      </div>

      <div className="px-6 pb-32">
        {/* Avatar & Name */}
        <div className="flex flex-col items-center py-8 gap-3">
          <div className="h-20 w-20 rounded-full gold-gradient flex items-center justify-center shadow-md text-white text-2xl font-serif font-medium">
            {session.firstName[0]}{session.lastName[0]}
          </div>
          <div className="text-center">
            <h1 className="font-serif text-2xl font-medium">
              {session.firstName} {session.lastName}
            </h1>
            <Badge variant="success" className="mt-2">
              <CheckCircle className="h-3.5 w-3.5" />
              Проживает
            </Badge>
          </div>
        </div>

        {/* Info card */}
        <div className="hotel-card divide-y divide-border">
          {infoRows.map(({ Icon, label, value }, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-4">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gold/10 border border-gold/20">
                <Icon className="h-4 w-4 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="font-medium mt-0.5 truncate">{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <Button
            variant="gold"
            size="lg"
            className="w-full"
            onClick={() => router.push(ROUTES.guest.chat)}
          >
            <MessageCircle className="h-4 w-4" />
            Связаться с администратором
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-full text-hotel-red hover:text-hotel-red hover:bg-hotel-red/5"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </Button>
        </div>
      </div>

      <GuestBottomNav />
    </MobileShell>
  );
}

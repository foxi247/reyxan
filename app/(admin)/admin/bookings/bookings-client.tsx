"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarCheck, CalendarX, CheckCircle2, Clock, Loader2, Phone, Mail, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updatePreBookingStatus } from "@/lib/actions/admin";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Booking {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  check_in: string;
  check_out: string;
  room_preference: string | null;
  notes: string | null;
  status: string;
  created_at: string;
}

type BookingStatus = "pending" | "confirmed" | "cancelled" | "arrived";

const STATUS_CONFIG: Record<BookingStatus, { label: string; variant: "warning" | "success" | "destructive" | "cream" }> = {
  pending:   { label: "Ожидает",   variant: "warning" },
  confirmed: { label: "Подтверждён", variant: "success" },
  cancelled: { label: "Отменён",   variant: "destructive" },
  arrived:   { label: "Заселился", variant: "cream" },
};

function BookingCard({ booking }: { booking: Booking }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handle = async (status: BookingStatus) => {
    setLoading(true);
    const result = await updatePreBookingStatus(booking.id, status);
    if (result.success) { toast.success("Статус обновлён"); router.refresh(); }
    else toast.error("Ошибка", { description: result.error });
    setLoading(false);
  };

  const cfg = STATUS_CONFIG[booking.status as BookingStatus] ?? STATUS_CONFIG.pending;
  const nights = Math.round(
    (new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / 86400000
  );

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

  return (
    <div className={cn(
      "hotel-card p-4 flex flex-col gap-3",
      booking.status === "cancelled" && "opacity-60"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium">{booking.first_name} {booking.last_name}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Заявка от {new Date(booking.created_at).toLocaleDateString("ru-RU")}
          </div>
        </div>
        <Badge variant={cfg.variant} className="text-xs flex-shrink-0">{cfg.label}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <CalendarCheck className="h-3.5 w-3.5" />
          <span>{fmt(booking.check_in)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <CalendarX className="h-3.5 w-3.5" />
          <span>{fmt(booking.check_out)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          <span>{nights} {nights === 1 ? "ночь" : nights < 5 ? "ночи" : "ночей"}</span>
        </div>
        {booking.room_preference && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{booking.room_preference}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 text-xs">
        <a href={`tel:${booking.phone}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <Phone className="h-3.5 w-3.5" />
          {booking.phone}
        </a>
        {booking.email && (
          <a href={`mailto:${booking.email}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <Mail className="h-3.5 w-3.5" />
            {booking.email}
          </a>
        )}
      </div>

      {booking.notes && (
        <p className="text-xs italic text-muted-foreground bg-secondary/50 rounded-xl px-3 py-2">
          &ldquo;{booking.notes}&rdquo;
        </p>
      )}

      {booking.status !== "cancelled" && booking.status !== "arrived" && (
        <div className="flex gap-2">
          {booking.status === "pending" && (
            <Button
              size="sm"
              className="h-7 text-xs flex-1 gold-gradient text-white border-0"
              disabled={loading}
              onClick={() => handle("confirmed")}
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <><CheckCircle2 className="h-3 w-3" /> Подтвердить</>}
            </Button>
          )}
          {booking.status === "confirmed" && (
            <Button
              size="sm"
              variant="cream"
              className="h-7 text-xs flex-1"
              disabled={loading}
              onClick={() => handle("arrived")}
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Заселился"}
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs text-hotel-red hover:text-hotel-red"
            disabled={loading}
            onClick={() => handle("cancelled")}
          >
            Отмена
          </Button>
        </div>
      )}
    </div>
  );
}

export function BookingsClient({ bookings }: { bookings: Booking[] }) {
  const [filter, setFilter] = useState<BookingStatus | "all">("all");

  const counts = {
    all: bookings.length,
    pending: bookings.filter((b) => b.status === "pending").length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
    arrived: bookings.filter((b) => b.status === "arrived").length,
  };

  const filtered = filter === "all"
    ? bookings
    : bookings.filter((b) => b.status === filter);

  const FILTERS: { value: BookingStatus | "all"; label: string }[] = [
    { value: "all",       label: `Все (${counts.all})` },
    { value: "pending",   label: `Ожидают (${counts.pending})` },
    { value: "confirmed", label: `Подтверждены (${counts.confirmed})` },
    { value: "arrived",   label: `Заселились (${counts.arrived})` },
    { value: "cancelled", label: `Отменены (${counts.cancelled})` },
  ];

  return (
    <main className="flex-1 overflow-y-auto p-6">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              filter === f.value
                ? "bg-gold/15 text-gold"
                : "text-muted-foreground hover:text-foreground bg-secondary"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="hotel-card p-12 text-center text-muted-foreground">
          <CalendarCheck className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Нет бронирований</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </div>
      )}
    </main>
  );
}

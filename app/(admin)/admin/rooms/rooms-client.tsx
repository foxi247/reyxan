"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BedDouble, Sparkles, Wrench, CheckCircle2, Clock, Loader2, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { updateRoomStatus, scheduleRoomCleaning } from "@/lib/actions/admin";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type RoomStatus = "available" | "occupied" | "maintenance";
type CleanStatus = "pending" | "in_progress" | "done" | "skipped";

interface Room {
  id: string; number: string; floor: number | null; status: RoomStatus;
}

interface Props {
  rooms: Room[];
  guestMap: Record<string, { name: string; checkOut: string; guestId: string }>;
  cleaningMap: Record<string, string>;
}

const ROOM_COLORS: Record<RoomStatus, string> = {
  available: "border-hotel-green/50 bg-hotel-green/5",
  occupied: "border-gold/50 bg-gold/5",
  maintenance: "border-hotel-red/30 bg-hotel-red/5",
};

const CLEAN_ICON: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3.5 w-3.5 text-amber-500" />,
  in_progress: <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />,
  done: <CheckCircle2 className="h-3.5 w-3.5 text-hotel-green" />,
  skipped: <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />,
};

const STATUS_OPTIONS: { value: RoomStatus; label: string }[] = [
  { value: "available", label: "Свободен" },
  { value: "occupied", label: "Занят" },
  { value: "maintenance", label: "Обслуживание" },
];

function RoomCard({
  room, guest, cleanStatus,
}: {
  room: Room;
  guest?: { name: string; checkOut: string };
  cleanStatus?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (status: RoomStatus) => {
    setLoading(true);
    const result = await updateRoomStatus(room.id, status);
    if (result.success) router.refresh();
    else toast.error("Ошибка", { description: result.error });
    setLoading(false);
  };

  const handleScheduleCleaning = async () => {
    setLoading(true);
    const result = await scheduleRoomCleaning(room.id);
    if (result.success) { toast.success("Уборка запланирована"); router.refresh(); }
    else toast.error("Ошибка", { description: result.error });
    setLoading(false);
  };

  return (
    <div className={cn("rounded-2xl border-2 p-4 flex flex-col gap-3 transition-colors", ROOM_COLORS[room.status])}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BedDouble className="h-4 w-4 text-muted-foreground" />
            <span className="font-serif text-2xl font-medium">{room.number}</span>
          </div>
          {room.floor && (
            <span className="text-xs text-muted-foreground">{room.floor} этаж</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {cleanStatus && CLEAN_ICON[cleanStatus]}
          {room.status === "available" && <Badge variant="success" className="text-[10px]">Свободен</Badge>}
          {room.status === "occupied" && <Badge variant="gold" className="text-[10px]">Занят</Badge>}
          {room.status === "maintenance" && <Badge variant="destructive" className="text-[10px]">Сервис</Badge>}
        </div>
      </div>

      {guest && (
        <div className="text-xs font-medium text-foreground/80 bg-background/60 rounded-xl px-3 py-2">
          <div>{guest.name}</div>
          <div className="text-muted-foreground mt-0.5">
            Выезд: {new Date(guest.checkOut).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-auto">
        <Select
          value={room.status}
          onValueChange={(v) => handleStatusChange(v as RoomStatus)}
          disabled={loading}
        >
          <SelectTrigger className="h-7 text-xs rounded-xl flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!cleanStatus && room.status !== "available" && (
          <Button
            size="icon-sm"
            variant="outline"
            className="h-7 w-7 rounded-xl flex-shrink-0"
            disabled={loading}
            onClick={handleScheduleCleaning}
            title="Запланировать уборку"
          >
            <Sparkles className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function RoomsClient({ rooms, guestMap, cleaningMap }: Props) {
  const byFloor = rooms.reduce<Record<string, Room[]>>((acc, r) => {
    const key = r.floor ? `${r.floor} этаж` : "Без этажа";
    (acc[key] ??= []).push(r);
    return acc;
  }, {});

  const stats = {
    available: rooms.filter((r) => r.status === "available").length,
    occupied: rooms.filter((r) => r.status === "occupied").length,
    maintenance: rooms.filter((r) => r.status === "maintenance").length,
    cleaning: Object.values(cleaningMap).filter((s) => s !== "done").length,
  };

  return (
    <main className="flex-1 overflow-y-auto p-6">
      {/* Legend + stats */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="hotel-card px-4 py-3 flex items-center gap-2.5">
          <div className="h-3 w-3 rounded-full bg-hotel-green" />
          <span className="text-sm font-medium">{stats.available} свободных</span>
        </div>
        <div className="hotel-card px-4 py-3 flex items-center gap-2.5">
          <div className="h-3 w-3 rounded-full bg-gold" />
          <span className="text-sm font-medium">{stats.occupied} занятых</span>
        </div>
        <div className="hotel-card px-4 py-3 flex items-center gap-2.5">
          <div className="h-3 w-3 rounded-full bg-hotel-red" />
          <span className="text-sm font-medium">{stats.maintenance} на обслуживании</span>
        </div>
        <div className="hotel-card px-4 py-3 flex items-center gap-2.5">
          <Clock className="h-3 w-3 text-amber-500" />
          <span className="text-sm font-medium">{stats.cleaning} требуют уборки</span>
        </div>
      </div>

      {/* Room grid by floor */}
      {Object.entries(byFloor).sort(([a], [b]) => a.localeCompare(b)).map(([floor, floorRooms]) => (
        <div key={floor} className="mb-8">
          <h2 className="font-serif text-base font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Wrench className="h-3.5 w-3.5 opacity-50" />
            {floor}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {floorRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                guest={guestMap[room.id]}
                cleanStatus={cleaningMap[room.id]}
              />
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, CheckCircle2, Clock, Loader2, Plus, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { updateCleaningStatus, scheduleRoomCleaning } from "@/lib/actions/admin";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CleaningRecord {
  id: string; room_id: string; status: string; notes: string | null;
  completed_at: string | null; created_at: string;
  rooms: { number: string; floor: number | null } | null;
}

type CleanStatus = "pending" | "in_progress" | "done" | "skipped";

const STATUS_CONFIG: Record<CleanStatus, { label: string; color: string; Icon: React.ElementType }> = {
  pending:     { label: "Ожидает",    color: "text-amber-500",    Icon: Clock },
  in_progress: { label: "Убирают",    color: "text-blue-500",     Icon: Loader2 },
  done:        { label: "Убрано",     color: "text-hotel-green",  Icon: CheckCircle2 },
  skipped:     { label: "Пропущено",  color: "text-muted-foreground", Icon: AlertCircle },
};

function RecordCard({ record }: { record: CleaningRecord }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState(record.notes ?? "");
  const [showNotes, setShowNotes] = useState(false);

  const handleStatus = async (status: CleanStatus) => {
    setLoading(true);
    const result = await updateCleaningStatus(record.id, status, notes || undefined);
    if (result.success) { toast.success("Статус обновлён"); router.refresh(); }
    else toast.error("Ошибка", { description: result.error });
    setLoading(false);
  };

  const cfg = STATUS_CONFIG[record.status as CleanStatus] ?? STATUS_CONFIG.pending;
  const Icon = cfg.Icon;

  return (
    <div className={cn(
      "hotel-card p-4 flex flex-col gap-3",
      record.status === "done" && "opacity-70"
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-secondary text-lg font-serif font-medium">
            {record.rooms?.number}
          </div>
          <div>
            <div className="font-medium text-sm">Комната {record.rooms?.number}</div>
            {record.rooms?.floor && (
              <div className="text-xs text-muted-foreground">{record.rooms.floor} этаж</div>
            )}
          </div>
        </div>
        <div className={cn("flex items-center gap-1.5 text-xs font-medium", cfg.color)}>
          <Icon className={cn("h-3.5 w-3.5", record.status === "in_progress" && "animate-spin")} />
          {cfg.label}
        </div>
      </div>

      {record.notes && !showNotes && (
        <p className="text-xs text-muted-foreground italic">&ldquo;{record.notes}&rdquo;</p>
      )}

      {showNotes && (
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Заметки (повреждения, особые задачи…)"
          rows={2}
          className="text-xs"
        />
      )}

      {record.status !== "done" && (
        <div className="flex gap-2 flex-wrap">
          {record.status === "pending" && (
            <Button size="sm" variant="cream" className="h-7 text-xs flex-1" disabled={loading}
              onClick={() => handleStatus("in_progress")}>
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Начать уборку"}
            </Button>
          )}
          {record.status === "in_progress" && (
            <Button size="sm" className="h-7 text-xs flex-1 gold-gradient text-white border-0" disabled={loading}
              onClick={() => handleStatus("done")}>
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <><CheckCircle2 className="h-3 w-3" /> Готово</>}
            </Button>
          )}
          {record.status !== "skipped" && (
            <Button size="sm" variant="outline" className="h-7 text-xs" disabled={loading}
              onClick={() => handleStatus("skipped")}>
              Пропустить
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground"
            onClick={() => setShowNotes(!showNotes)}>
            {showNotes ? "Скрыть" : "Заметка"}
          </Button>
        </div>
      )}
    </div>
  );
}

export function HousekeepingClient({
  records, allRooms,
}: {
  records: CleaningRecord[];
  allRooms: { id: string; number: string; floor: number | null; status: string }[];
  today: string;
}) {
  const router = useRouter();
  const [addingRoom, setAddingRoom] = useState<string | null>(null);

  const scheduledRoomIds = new Set(records.map((r) => r.room_id));
  const unscheduled = allRooms.filter(
    (r) => !scheduledRoomIds.has(r.id) && r.status !== "available"
  );

  const handleAddRoom = async (roomId: string) => {
    setAddingRoom(roomId);
    const result = await scheduleRoomCleaning(roomId);
    if (result.success) { toast.success("Уборка запланирована"); router.refresh(); }
    else toast.error("Ошибка", { description: result.error });
    setAddingRoom(null);
  };

  const counts = {
    pending: records.filter((r) => r.status === "pending").length,
    in_progress: records.filter((r) => r.status === "in_progress").length,
    done: records.filter((r) => r.status === "done").length,
  };

  return (
    <main className="flex-1 overflow-y-auto p-6">
      {/* Progress summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="hotel-card p-4 text-center">
          <div className="font-serif text-3xl font-medium text-amber-500">{counts.pending}</div>
          <div className="text-xs text-muted-foreground mt-1">Ожидают</div>
        </div>
        <div className="hotel-card p-4 text-center">
          <div className="font-serif text-3xl font-medium text-blue-500">{counts.in_progress}</div>
          <div className="text-xs text-muted-foreground mt-1">Убирают</div>
        </div>
        <div className="hotel-card p-4 text-center">
          <div className="font-serif text-3xl font-medium text-hotel-green">{counts.done}</div>
          <div className="text-xs text-muted-foreground mt-1">Готово</div>
        </div>
      </div>

      {/* Progress bar */}
      {records.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Прогресс уборки</span>
            <span>{counts.done} / {records.length}</span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-hotel-green transition-all duration-500"
              style={{ width: `${records.length > 0 ? (counts.done / records.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Scheduled rooms */}
      {records.length === 0 ? (
        <div className="hotel-card p-12 text-center text-muted-foreground">
          <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">На сегодня уборок не запланировано</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
          {records.map((rec) => (
            <RecordCard key={rec.id} record={rec} />
          ))}
        </div>
      )}

      {/* Add unscheduled rooms */}
      {unscheduled.length > 0 && (
        <div>
          <h2 className="font-medium text-sm text-muted-foreground mb-3">
            Добавить в расписание
          </h2>
          <div className="flex flex-wrap gap-2">
            {unscheduled.map((room) => (
              <Button
                key={room.id}
                size="sm"
                variant="outline"
                className="h-8 text-xs gap-1.5"
                disabled={addingRoom === room.id}
                onClick={() => handleAddRoom(room.id)}
              >
                {addingRoom === room.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Plus className="h-3 w-3" />
                )}
                Ком. {room.number}
              </Button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}

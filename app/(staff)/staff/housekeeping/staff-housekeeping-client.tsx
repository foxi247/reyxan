"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Loader2, AlertCircle, LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Task {
  id: string;
  room_id: string;
  status: string;
  notes: string | null;
  assigned_to_id: string | null;
  completed_at: string | null;
  rooms: { number: string; floor: number | null } | null;
}

const STATUS: Record<string, { label: string; color: string; variant: "warning" | "cream" | "success" | "destructive" }> = {
  pending:     { label: "Ожидает",    color: "text-amber-500",  variant: "warning" },
  in_progress: { label: "Убираю",     color: "text-blue-500",   variant: "cream" },
  done:        { label: "Убрано",     color: "text-hotel-green", variant: "success" },
  skipped:     { label: "Пропущено",  color: "text-muted-foreground", variant: "destructive" },
};

export function StaffHousekeepingClient({ tasks, staffName, staffId }: {
  tasks: Task[];
  staffName: string;
  staffId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const updateStatus = async (taskId: string, status: string) => {
    setLoading(taskId);
    try {
      const res = await fetch("/api/staff/cleaning-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(status === "done" ? "Уборка завершена!" : "Статус обновлён");
        router.refresh();
      } else {
        toast.error(data.error ?? "Ошибка");
      }
    } catch {
      toast.error("Произошла ошибка");
    } finally {
      setLoading(null);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/staff/logout", { method: "POST" });
    router.push("/staff/login");
  };

  const counts = {
    pending: tasks.filter((t) => t.status === "pending").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          <div className="font-serif text-lg font-medium">Расписание уборки</div>
          <div className="text-xs text-muted-foreground">{staffName} · {new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}</div>
        </div>
        <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      <div className="p-4 space-y-4">
        {/* Progress */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Ожидают", value: counts.pending, color: "text-amber-500" },
            { label: "Убираю",  value: counts.in_progress, color: "text-blue-500" },
            { label: "Готово",  value: counts.done, color: "text-hotel-green" },
          ].map(({ label, value, color }) => (
            <div key={label} className="hotel-card p-3 text-center">
              <div className={cn("font-serif text-2xl font-medium", color)}>{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {tasks.length > 0 && (
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-hotel-green transition-all duration-500"
              style={{ width: `${(counts.done / tasks.length) * 100}%` }}
            />
          </div>
        )}

        {/* Tasks */}
        {tasks.length === 0 ? (
          <div className="hotel-card p-12 text-center text-muted-foreground">
            <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">На сегодня заданий нет</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const st = STATUS[task.status] ?? STATUS.pending;
              return (
                <div key={task.id} className={cn("hotel-card p-4 space-y-3", task.status === "done" && "opacity-60")}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-secondary font-serif text-lg font-medium">
                        {task.rooms?.number}
                      </div>
                      <div>
                        <div className="font-medium">Комната {task.rooms?.number}</div>
                        {task.rooms?.floor && (
                          <div className="text-xs text-muted-foreground">{task.rooms.floor} этаж</div>
                        )}
                      </div>
                    </div>
                    <Badge variant={st.variant} className="text-xs">{st.label}</Badge>
                  </div>

                  {task.notes && (
                    <p className="text-xs italic text-muted-foreground bg-secondary/50 rounded-xl px-3 py-2">
                      &ldquo;{task.notes}&rdquo;
                    </p>
                  )}

                  {task.status !== "done" && task.status !== "skipped" && (
                    <div className="flex gap-2">
                      {task.status === "pending" && (
                        <Button
                          size="sm"
                          variant="cream"
                          className="flex-1 h-9 text-sm"
                          disabled={loading === task.id}
                          onClick={() => updateStatus(task.id, "in_progress")}
                        >
                          {loading === task.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Начать"}
                        </Button>
                      )}
                      {task.status === "in_progress" && (
                        <Button
                          size="sm"
                          className="flex-1 h-9 text-sm gold-gradient text-white border-0"
                          disabled={loading === task.id}
                          onClick={() => updateStatus(task.id, "done")}
                        >
                          {loading === task.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> Готово</>}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

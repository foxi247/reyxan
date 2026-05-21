"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateServiceRequestStatus } from "@/lib/actions/admin";
import { timeAgo } from "@/lib/utils";
import { toast } from "sonner";

interface ServiceReq {
  id: string;
  title: string;
  status: string;
  created_at: string;
  rooms: { number: string } | null;
}

const STATUS_BADGE: Record<string, React.ReactNode> = {
  new: <Badge variant="warning">Новый</Badge>,
  in_progress: <Badge variant="gold">В работе</Badge>,
  done: <Badge variant="success">Выполнено</Badge>,
  cancelled: <Badge variant="secondary">Отменено</Badge>,
};

export function DashboardServiceRequests({ requests }: { requests: ServiceReq[] }) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);

  const handleUpdate = async (
    id: string,
    status: "new" | "in_progress" | "done" | "cancelled"
  ) => {
    setUpdating(id);
    const result = await updateServiceRequestStatus(id, status);
    if (result.success) {
      toast.success("Статус обновлён");
      router.refresh();
    } else {
      toast.error("Ошибка", { description: result.error });
    }
    setUpdating(null);
  };

  return (
    <div className="hotel-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-lg font-medium">Запросы от гостей</h2>
        <Badge variant="gold">{requests.length}</Badge>
      </div>

      {requests.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground text-sm">
          Нет активных запросов
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="flex flex-col gap-3 rounded-2xl border border-border bg-background p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="font-medium text-sm">
                  Комната {req.rooms?.number}: {req.title}
                </div>
                {STATUS_BADGE[req.status]}
              </div>
              <div className="text-xs text-muted-foreground">
                {timeAgo(req.created_at)}
              </div>
              {req.status !== "done" && req.status !== "cancelled" && (
                <div className="flex gap-2">
                  {req.status === "new" && (
                    <Button
                      size="sm"
                      variant="cream"
                      className="flex-1 h-8 text-xs"
                      disabled={updating === req.id}
                      onClick={() => handleUpdate(req.id, "in_progress")}
                    >
                      В работе
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="gold"
                    className="flex-1 h-8 text-xs"
                    disabled={updating === req.id}
                    onClick={() => handleUpdate(req.id, "done")}
                  >
                    Выполнено
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

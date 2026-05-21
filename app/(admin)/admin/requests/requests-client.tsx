"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateServiceRequestStatus } from "@/lib/actions/admin";
import { timeAgo } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface ServiceReq {
  id: string;
  title: string;
  message: string | null;
  status: string;
  created_at: string;
  guests: { first_name: string; last_name: string } | null;
  rooms: { number: string } | null;
  services: { title: string; icon: string } | null;
}

const STATUS_BADGE: Record<string, React.ReactNode> = {
  new: <Badge variant="warning">Новый</Badge>,
  in_progress: <Badge variant="gold">В работе</Badge>,
  done: <Badge variant="success">Выполнено</Badge>,
  cancelled: <Badge variant="cream">Отменено</Badge>,
};

function RequestCard({
  req,
  onUpdate,
  updating,
}: {
  req: ServiceReq;
  onUpdate: (id: string, status: "new" | "in_progress" | "done" | "cancelled") => void;
  updating: string | null;
}) {
  return (
    <div className="hotel-card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium text-sm">
            Комната {req.rooms?.number}: {req.title}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {req.guests?.first_name} {req.guests?.last_name} · {timeAgo(req.created_at)}
          </div>
          {req.message && (
            <div className="text-xs text-muted-foreground mt-1 italic">
              &ldquo;{req.message}&rdquo;
            </div>
          )}
        </div>
        {STATUS_BADGE[req.status]}
      </div>
      {req.status !== "done" && req.status !== "cancelled" && (
        <div className="flex gap-2">
          {req.status === "new" && (
            <Button
              size="sm"
              variant="cream"
              className="h-8 text-xs flex-1"
              disabled={updating === req.id}
              onClick={() => onUpdate(req.id, "in_progress")}
            >
              {updating === req.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "В работе"}
            </Button>
          )}
          <Button
            size="sm"
            variant="gold"
            className="h-8 text-xs flex-1"
            disabled={updating === req.id}
            onClick={() => onUpdate(req.id, "done")}
          >
            {updating === req.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Выполнено"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            disabled={updating === req.id}
            onClick={() => onUpdate(req.id, "cancelled")}
          >
            Отменить
          </Button>
        </div>
      )}
    </div>
  );
}

export function RequestsClient({ requests }: { requests: ServiceReq[] }) {
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

  const byStatus = (status: string) => requests.filter((r) => r.status === status);

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <Tabs defaultValue="new">
        <TabsList>
          <TabsTrigger value="new">Новые ({byStatus("new").length})</TabsTrigger>
          <TabsTrigger value="in_progress">В работе ({byStatus("in_progress").length})</TabsTrigger>
          <TabsTrigger value="done">Выполненные</TabsTrigger>
          <TabsTrigger value="cancelled">Отменённые</TabsTrigger>
        </TabsList>

        {["new", "in_progress", "done", "cancelled"].map((status) => (
          <TabsContent key={status} value={status}>
            {byStatus(status).length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">
                Нет запросов
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                {byStatus(status).map((req) => (
                  <RequestCard
                    key={req.id}
                    req={req}
                    onUpdate={handleUpdate}
                    updating={updating}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updateServiceRequestStatus } from "@/lib/actions/admin";
import { timeAgo } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2, Clock } from "lucide-react";

interface ServiceReq {
  id: string;
  title: string;
  message: string | null;
  status: string;
  created_at: string;
  guests: { first_name: string; last_name: string } | null;
  rooms: { number: string } | null;
  services: { title: string; icon: string; estimated_wait_minutes?: number } | null;
}

const STATUS_BADGE: Record<string, React.ReactNode> = {
  new: <Badge variant="warning">Новый</Badge>,
  in_progress: <Badge variant="gold">В работе</Badge>,
  done: <Badge variant="success">Выполнено</Badge>,
  cancelled: <Badge variant="cream">Отменено</Badge>,
};

function EtaDialog({
  open,
  onClose,
  req,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  req: ServiceReq | null;
  onConfirm: (etaMinutes: number) => void;
}) {
  const defaultEta = req?.services?.estimated_wait_minutes ?? 30;
  const [eta, setEta] = useState(defaultEta);

  if (!req) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gold" />
            Принять в работу
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Заявка <span className="font-medium text-foreground">«{req.title}»</span> будет принята в работу. Гость получит автоматическое уведомление в чат.
          </p>
          <div className="space-y-1.5">
            <Label>Время ожидания (мин)</Label>
            <Input
              type="number"
              min={1}
              max={999}
              value={eta}
              onChange={(e) => setEta(Number(e.target.value) || defaultEta)}
              className="text-center font-medium text-lg h-12"
            />
            <p className="text-xs text-muted-foreground">
              Гость получит: «Заявка принята, ожидайте ~{eta} мин.»
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Отмена
            </Button>
            <Button className="flex-1 gold-gradient text-white border-0" onClick={() => onConfirm(eta)}>
              Принять
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RequestCard({
  req,
  onUpdate,
  onInProgress,
  updating,
}: {
  req: ServiceReq;
  onUpdate: (id: string, status: "new" | "in_progress" | "done" | "cancelled") => void;
  onInProgress: (req: ServiceReq) => void;
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
              onClick={() => onInProgress(req)}
            >
              {updating === req.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (
                <><Clock className="h-3 w-3" /> В работе</>
              )}
            </Button>
          )}
          <Button
            size="sm"
            variant="gold"
            className="h-8 text-xs flex-1"
            disabled={updating === req.id}
            onClick={() => onUpdate(req.id, "done")}
          >
            {updating === req.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Выполнено ✓"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            disabled={updating === req.id}
            onClick={() => onUpdate(req.id, "cancelled")}
          >
            Отмена
          </Button>
        </div>
      )}
    </div>
  );
}

export function RequestsClient({ requests }: { requests: ServiceReq[] }) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);
  const [etaTarget, setEtaTarget] = useState<ServiceReq | null>(null);

  const handleUpdate = async (
    id: string,
    status: "new" | "in_progress" | "done" | "cancelled",
    etaMinutes?: number
  ) => {
    setUpdating(id);
    const result = await updateServiceRequestStatus(id, status, etaMinutes);
    if (result.success) {
      toast.success(
        status === "done"
          ? "Заявка выполнена! Гость уведомлён."
          : status === "cancelled"
          ? "Заявка отменена"
          : "Заявка принята в работу"
      );
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
                    onInProgress={(r) => setEtaTarget(r)}
                    updating={updating}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <EtaDialog
        open={!!etaTarget}
        onClose={() => setEtaTarget(null)}
        req={etaTarget}
        onConfirm={(eta) => {
          if (etaTarget) {
            setEtaTarget(null);
            handleUpdate(etaTarget.id, "in_progress", eta);
          }
        }}
      />
    </main>
  );
}

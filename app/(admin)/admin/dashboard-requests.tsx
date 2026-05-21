"use client";

import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ApprovalDialog } from "@/components/hotel/approval-dialog";
import { rejectGuestRequest } from "@/lib/actions/admin";
import { formatPhone, timeAgo } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Request {
  id: string;
  phone: string;
  created_at: string;
  status: string;
}

export function DashboardRequests({ requests }: { requests: Request[] }) {
  const router = useRouter();
  const [approving, setApproving] = useState<Request | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);

  const handleReject = async (id: string) => {
    setRejecting(id);
    const result = await rejectGuestRequest(id);
    if (result.success) {
      toast.success("Заявка отклонена");
      router.refresh();
    } else {
      toast.error("Ошибка", { description: result.error });
    }
    setRejecting(null);
  };

  return (
    <>
      <div className="hotel-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg font-medium">Новые заявки</h2>
          <Badge variant="gold">{requests.length}</Badge>
        </div>

        {requests.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            Новых заявок пока нет
          </div>
        ) : (
          <div className="space-y-2">
            {requests.map((req) => (
              <div
                key={req.id}
                className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {formatPhone(req.phone)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {timeAgo(req.created_at)}
                  </div>
                </div>
                <Badge variant="warning">Ожидает</Badge>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="gold"
                    className="h-8 px-3 text-xs"
                    onClick={() => setApproving(req)}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    Одобрить
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-xs text-hotel-red border-hotel-red/30 hover:bg-hotel-red/5"
                    disabled={rejecting === req.id}
                    onClick={() => handleReject(req.id)}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Отклонить
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {approving && (
        <ApprovalDialog
          requestId={approving.id}
          phone={approving.phone}
          open={true}
          onClose={() => setApproving(null)}
          onSuccess={() => router.refresh()}
        />
      )}
    </>
  );
}

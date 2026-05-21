"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { completeGuestStay } from "@/lib/actions/admin";
import { formatDate, formatPhone } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Guest {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  check_in: string;
  check_out: string;
  status: string;
  rooms: { number: string } | null;
}

export function DashboardGuests({ guests }: { guests: Guest[] }) {
  const router = useRouter();
  const [completing, setCompleting] = useState<string | null>(null);

  const handleComplete = async (guestId: string) => {
    setCompleting(guestId);
    const result = await completeGuestStay(guestId);
    if (result.success) {
      toast.success("Проживание завершено");
      router.refresh();
    } else {
      toast.error("Ошибка", { description: result.error });
    }
    setCompleting(null);
  };

  return (
    <div className="hotel-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-serif text-lg font-medium">Активные гости</h2>
        <Badge variant="success">{guests.length}</Badge>
      </div>

      {guests.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground text-sm">
          Нет активных гостей
        </div>
      ) : (
        <div className="space-y-2">
          {guests.map((guest) => (
            <div
              key={guest.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full gold-gradient text-white text-xs font-medium">
                {guest.first_name[0]}{guest.last_name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {guest.first_name} {guest.last_name}
                </div>
                <div className="text-xs text-muted-foreground">
                  Ком. {guest.rooms?.number} · {formatDate(guest.check_out)} выезд
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-3 text-xs flex-shrink-0"
                disabled={completing === guest.id}
                onClick={() => handleComplete(guest.id)}
              >
                {completing === guest.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  "Завершить"
                )}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Users, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { completeGuestStay } from "@/lib/actions/admin";
import { formatDate, formatPhone } from "@/lib/utils";
import { toast } from "sonner";
import { GUEST_STATUS_LABELS } from "@/lib/constants";

interface Guest {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  check_in: string;
  check_out: string;
  status: string;
  rooms: { number: string; floor: number | null } | null;
}

const STATUS_BADGE: Record<string, React.ReactNode> = {
  active: <Badge variant="success">Проживает</Badge>,
  expired: <Badge variant="warning">Истёк</Badge>,
  blocked: <Badge variant="destructive">Заблокирован</Badge>,
  checked_out: <Badge variant="cream">Выехал</Badge>,
};

export function GuestsClient({ guests }: { guests: Guest[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [completing, setCompleting] = useState<string | null>(null);

  const filtered = guests.filter((g) => {
    const q = search.toLowerCase();
    return (
      !q ||
      `${g.first_name} ${g.last_name}`.toLowerCase().includes(q) ||
      g.phone.includes(q) ||
      (g.rooms?.number ?? "").includes(q)
    );
  });

  const handleComplete = async (id: string) => {
    setCompleting(id);
    const result = await completeGuestStay(id);
    if (result.success) {
      toast.success("Проживание завершено");
      router.refresh();
    } else {
      toast.error("Ошибка", { description: result.error });
    }
    setCompleting(null);
  };

  return (
    <main className="flex-1 overflow-y-auto p-6">
      {/* Search */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по имени, телефону, комнате…"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          {filtered.length} {filtered.length === 1 ? "гость" : "гостей"}
        </div>
      </div>

      {/* Table */}
      <div className="hotel-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {["Гость", "Комната", "Телефон", "Заезд", "Выезд", "Статус", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground text-sm">
                    Нет результатов
                  </td>
                </tr>
              ) : (
                filtered.map((guest) => (
                  <tr key={guest.id} className="hover:bg-accent/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full gold-gradient flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                          {guest.first_name[0]}{guest.last_name[0]}
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {guest.first_name} {guest.last_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm">{guest.rooms?.number ?? "—"}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {formatPhone(guest.phone)}
                    </td>
                    <td className="px-5 py-4 text-sm">{formatDate(guest.check_in)}</td>
                    <td className="px-5 py-4 text-sm">{formatDate(guest.check_out)}</td>
                    <td className="px-5 py-4">{STATUS_BADGE[guest.status]}</td>
                    <td className="px-5 py-4">
                      {guest.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs"
                          disabled={completing === guest.id}
                          onClick={() => handleComplete(guest.id)}
                        >
                          {completing === guest.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            "Завершить"
                          )}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

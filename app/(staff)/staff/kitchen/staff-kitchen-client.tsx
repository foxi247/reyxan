"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Utensils, CheckCircle2, Loader2, LogOut, Clock, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  quantity: number;
  menu_items: { name: string } | null;
}

interface Order {
  id: string;
  status: string;
  total: number;
  created_at: string;
  rooms: { number: string } | null;
  room_service_order_items: OrderItem[];
}

export function StaffKitchenClient({ orders: initialOrders, staffName }: {
  orders: Order[];
  staffName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [orders, setOrders] = useState(initialOrders);

  // Auto-refresh every 15s
  useEffect(() => {
    const timer = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(timer);
  }, [router]);

  useEffect(() => { setOrders(initialOrders); }, [initialOrders]);

  const updateStatus = async (orderId: string, status: "preparing" | "delivering") => {
    setLoading(orderId);
    try {
      const res = await fetch("/api/staff/order-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(status === "delivering" ? "Заказ отправлен!" : "Заказ в работе");
        router.refresh();
      } else toast.error(data.error ?? "Ошибка");
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

  const newOrders = orders.filter((o) => o.status === "new");
  const preparingOrders = orders.filter((o) => o.status === "preparing");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div>
          <div className="font-serif text-lg font-medium flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-gold" /> Кухня
          </div>
          <div className="text-xs text-muted-foreground">{staffName}</div>
        </div>
        <div className="flex items-center gap-2">
          {newOrders.length > 0 && (
            <Badge variant="destructive" className="text-xs">{newOrders.length} новых</Badge>
          )}
          <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-accent text-muted-foreground">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {orders.length === 0 && (
          <div className="hotel-card p-12 text-center text-muted-foreground">
            <Utensils className="h-10 w-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Нет активных заказов</p>
          </div>
        )}

        {newOrders.length > 0 && (
          <div>
            <h2 className="font-medium text-sm text-red-500 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Новые заказы ({newOrders.length})
            </h2>
            <div className="space-y-3">
              {newOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  loading={loading === order.id}
                  onPrepare={() => updateStatus(order.id, "preparing")}
                />
              ))}
            </div>
          </div>
        )}

        {preparingOrders.length > 0 && (
          <div>
            <h2 className="font-medium text-sm text-blue-500 mb-3 flex items-center gap-2">
              <ChefHat className="h-4 w-4" /> Готовятся ({preparingOrders.length})
            </h2>
            <div className="space-y-3">
              {preparingOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  loading={loading === order.id}
                  onDeliver={() => updateStatus(order.id, "delivering")}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, loading, onPrepare, onDeliver }: {
  order: Order;
  loading: boolean;
  onPrepare?: () => void;
  onDeliver?: () => void;
}) {
  const age = Math.round((Date.now() - new Date(order.created_at).getTime()) / 60000);

  return (
    <div className={cn("hotel-card p-4 space-y-3", order.status === "new" && "border-l-4 border-l-red-400")}>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">Комната {order.rooms?.number ?? "—"}</div>
          <div className="text-xs text-muted-foreground">{age} мин. назад</div>
        </div>
        <div className="font-medium text-gold">{Number(order.total).toLocaleString("ru-RU")} ₽</div>
      </div>

      <div className="space-y-1">
        {order.room_service_order_items.map((item) => (
          <div key={item.id} className="flex items-center justify-between text-sm">
            <span>{item.menu_items?.name ?? "—"}</span>
            <span className="text-muted-foreground">× {item.quantity}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {onPrepare && (
          <Button
            size="sm"
            variant="cream"
            className="flex-1 h-9"
            disabled={loading}
            onClick={onPrepare}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "В работу"}
          </Button>
        )}
        {onDeliver && (
          <Button
            size="sm"
            className="flex-1 h-9 gold-gradient text-white border-0"
            disabled={loading}
            onClick={onDeliver}
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><CheckCircle2 className="h-3.5 w-3.5" /> Готово, доставить</>}
          </Button>
        )}
      </div>
    </div>
  );
}

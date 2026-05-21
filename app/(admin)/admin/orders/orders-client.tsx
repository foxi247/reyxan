"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateOrderStatus } from "@/lib/actions/admin";
import { formatPrice, timeAgo } from "@/lib/utils";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface OrderItem {
  quantity: number;
  price: number;
  menu_items: { name: string } | null;
}

interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
  guests: { first_name: string; last_name: string } | null;
  rooms: { number: string } | null;
  room_service_order_items: OrderItem[];
}

type OrderStatus = "new" | "preparing" | "delivering" | "delivered" | "cancelled";

const STATUS_BADGE: Record<string, React.ReactNode> = {
  new: <Badge variant="warning">Новый</Badge>,
  preparing: <Badge variant="gold">Готовится</Badge>,
  delivering: <Badge variant="default">Доставляется</Badge>,
  delivered: <Badge variant="success">Доставлен</Badge>,
  cancelled: <Badge variant="cream">Отменён</Badge>,
};

const NEXT_STATUS: Record<string, OrderStatus | null> = {
  new: "preparing",
  preparing: "delivering",
  delivering: "delivered",
  delivered: null,
  cancelled: null,
};

const NEXT_LABEL: Record<string, string> = {
  new: "Начать готовку",
  preparing: "В доставку",
  delivering: "Доставлен",
};

function OrderCard({
  order,
  onUpdate,
  updating,
}: {
  order: Order;
  onUpdate: (id: string, status: OrderStatus) => void;
  updating: string | null;
}) {
  const nextStatus = NEXT_STATUS[order.status];

  return (
    <div className="hotel-card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium text-sm">
            Комната {order.rooms?.number}
          </div>
          <div className="text-xs text-muted-foreground">
            {order.guests?.first_name} {order.guests?.last_name} · {timeAgo(order.created_at)}
          </div>
        </div>
        {STATUS_BADGE[order.status]}
      </div>

      <div className="space-y-1">
        {order.room_service_order_items.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {item.quantity}× {item.menu_items?.name}
            </span>
            <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="font-serif font-medium">{formatPrice(order.total)}</span>
        {nextStatus && (
          <Button
            size="sm"
            variant="gold"
            className="h-8 text-xs"
            disabled={updating === order.id}
            onClick={() => onUpdate(order.id, nextStatus)}
          >
            {updating === order.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              NEXT_LABEL[order.status]
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export function OrdersClient({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);

  const handleUpdate = async (id: string, status: OrderStatus) => {
    setUpdating(id);
    const result = await updateOrderStatus(id, status);
    if (result.success) {
      toast.success("Статус обновлён");
      router.refresh();
    } else {
      toast.error("Ошибка", { description: result.error });
    }
    setUpdating(null);
  };

  const byStatus = (status: string) => orders.filter((o) => o.status === status);
  const active = orders.filter((o) => !["delivered", "cancelled"].includes(o.status));

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Активные ({active.length})</TabsTrigger>
          <TabsTrigger value="delivered">Доставленные</TabsTrigger>
          <TabsTrigger value="cancelled">Отменённые</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {active.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Нет активных заказов
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {active.map((order) => (
                <OrderCard key={order.id} order={order} onUpdate={handleUpdate} updating={updating} />
              ))}
            </div>
          )}
        </TabsContent>

        {["delivered", "cancelled"].map((status) => (
          <TabsContent key={status} value={status}>
            {byStatus(status).length === 0 ? (
              <div className="py-12 text-center text-muted-foreground text-sm">Нет заказов</div>
            ) : (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                {byStatus(status).map((order) => (
                  <OrderCard key={order.id} order={order} onUpdate={handleUpdate} updating={updating} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </main>
  );
}

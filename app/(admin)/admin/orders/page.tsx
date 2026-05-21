import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/hotel/admin-shell";
import { OrdersClient } from "./orders-client";

async function getOrders() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("room_service_orders")
    .select(`
      *,
      guests(first_name, last_name),
      rooms(number),
      room_service_order_items(*, menu_items(name))
    `)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export default async function AdminOrdersPage() {
  const admin = await requireAdmin();
  const orders = await getOrders();

  return (
    <AdminShell email={admin.email ?? undefined} title="Заказы еды" subtitle="Управление заказами в номера">
      <OrdersClient orders={orders as any} />
    </AdminShell>
  );
}

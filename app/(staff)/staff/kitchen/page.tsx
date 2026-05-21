import { getStaffSession } from "@/lib/auth/staff-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { StaffKitchenClient } from "./staff-kitchen-client";

async function getData() {
  const supabase = createAdminClient();
  const { data: orders } = await supabase
    .from("room_service_orders")
    .select("*, room_service_order_items(*, menu_items(name)), rooms(number)")
    .in("status", ["new", "preparing"])
    .order("created_at");
  return { orders: orders ?? [] };
}

export default async function StaffKitchenPage() {
  const session = await getStaffSession();
  if (!session) redirect("/staff/login");
  if (session.role !== "kitchen") redirect("/staff/housekeeping");
  const data = await getData();
  return <StaffKitchenClient orders={data.orders as any} staffName={session.name} />;
}

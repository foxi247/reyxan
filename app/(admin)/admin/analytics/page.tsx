import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminSidebar } from "@/components/hotel/admin-sidebar";
import { AdminTopbar } from "@/components/hotel/admin-topbar";
import { AnalyticsClient } from "./analytics-client";

function groupByDay<T extends { created_at: string }>(
  items: T[],
  days: number
): Record<string, number> {
  const result: Record<string, number> = {};
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    result[d.toISOString().slice(0, 10)] = 0;
  }
  for (const item of items) {
    const day = item.created_at.slice(0, 10);
    if (day in result) result[day] = (result[day] ?? 0) + 1;
  }
  return result;
}

async function getAnalyticsData() {
  const supabase = createAdminClient();
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: guests30 },
    { data: orders30 },
    { data: serviceReqs30 },
    { data: allGuests },
    { data: allOrders },
    { data: allServiceReqs },
    { data: serviceGroups },
    { data: orderStatuses },
  ] = await Promise.all([
    supabase.from("guests").select("id, created_at").gte("created_at", since30),
    supabase.from("room_service_orders").select("id, created_at, total, status").gte("created_at", since30),
    supabase.from("service_requests").select("id, created_at, title, status").gte("created_at", since30),
    supabase.from("guests").select("id", { count: "exact", head: true }),
    supabase.from("room_service_orders").select("id, total").neq("status", "cancelled"),
    supabase.from("service_requests").select("id", { count: "exact", head: true }),
    supabase.from("service_requests").select("title").gte("created_at", since30),
    supabase.from("room_service_orders").select("status").gte("created_at", since30),
  ]);

  // Daily data
  const guestsPerDay = groupByDay(guests30 ?? [], 30);
  const ordersPerDay = groupByDay(orders30 ?? [], 30);
  const serviceReqsPerDay = groupByDay(serviceReqs30 ?? [], 30);

  const daily = Object.keys(guestsPerDay).map((date) => ({
    date,
    guests: guestsPerDay[date] ?? 0,
    orders: ordersPerDay[date] ?? 0,
    serviceRequests: serviceReqsPerDay[date] ?? 0,
  }));

  // Totals
  const totalRevenue = (allOrders ?? []).reduce((s, o) => s + (Number(o.total) || 0), 0);
  const completedOrders = (allOrders ?? []).length;

  // Service type breakdown
  const typeMap: Record<string, number> = {};
  for (const r of serviceGroups ?? []) {
    typeMap[r.title] = (typeMap[r.title] ?? 0) + 1;
  }
  const serviceTypes = Object.entries(typeMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name, count }));

  // Order status breakdown
  const statusMap: Record<string, number> = {};
  for (const o of orderStatuses ?? []) {
    statusMap[o.status] = (statusMap[o.status] ?? 0) + 1;
  }
  const ordersByStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

  return {
    daily,
    totals: {
      totalGuests: (allGuests as unknown as { count: number })?.count ?? 0,
      totalOrders: completedOrders,
      totalServiceRequests: (allServiceReqs as unknown as { count: number })?.count ?? 0,
      totalRevenue,
      avgOrderValue: completedOrders > 0 ? totalRevenue / completedOrders : 0,
    },
    serviceTypes,
    ordersByStatus,
    rawGuests: guests30 ?? [],
    rawOrders: orders30 ?? [],
    rawServiceReqs: serviceReqs30 ?? [],
  };
}

export default async function AnalyticsPage() {
  const admin = await requireAdmin();
  const data = await getAnalyticsData();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar adminEmail={admin.email ?? undefined} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopbar title="Аналитика" subtitle="Статистика и отчёты за последние 30 дней" />
        <AnalyticsClient {...data} />
      </div>
    </div>
  );
}

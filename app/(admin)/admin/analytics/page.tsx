import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/hotel/admin-shell";
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
    { data: allOrdersRev },
    { data: serviceGroups },
    { data: orderStatuses },
    { data: ratings },
    { data: activeGuests },
    { data: rooms },
    { data: allGuestsRaw },
  ] = await Promise.all([
    supabase.from("guests").select("id, created_at").gte("created_at", since30),
    supabase.from("room_service_orders").select("id, created_at, total, status").gte("created_at", since30),
    supabase.from("service_requests").select("id, created_at, title, status").gte("created_at", since30),
    supabase.from("room_service_orders").select("total").neq("status", "cancelled"),
    supabase.from("service_requests").select("title").gte("created_at", since30),
    supabase.from("room_service_orders").select("status").gte("created_at", since30),
    supabase.from("guest_ratings").select("rating, comment, created_at"),
    supabase.from("guests").select("id, check_in, check_out").eq("status", "active"),
    supabase.from("rooms").select("id, status"),
    supabase.from("guests").select("id, check_in, check_out, created_at"),
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

  // Revenue
  const totalRevenue = (allOrdersRev ?? []).reduce((s, o) => s + (Number(o.total) || 0), 0);
  const completedOrders = (allOrdersRev ?? []).length;

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

  // Ratings
  const ratingsList = (ratings ?? []) as { rating: number; comment: string | null; created_at: string }[];
  const avgRating = ratingsList.length
    ? ratingsList.reduce((s, r) => s + r.rating, 0) / ratingsList.length
    : 0;
  const ratingDist = [1, 2, 3, 4, 5].map((star) => ({
    star,
    count: ratingsList.filter((r) => r.rating === star).length,
  }));

  // Occupancy
  const totalRooms = (rooms ?? []).length;
  const occupiedRooms = (rooms ?? []).filter((r: { status: string }) => r.status === "occupied").length;
  const occupancyPct = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  // Avg stay duration from all guests with check_in + check_out
  const allG = (allGuestsRaw ?? []) as { check_in: string; check_out: string }[];
  const stayDurations = allG
    .filter((g) => g.check_in && g.check_out)
    .map((g) =>
      (new Date(g.check_out).getTime() - new Date(g.check_in).getTime()) / 86400000
    )
    .filter((d) => d > 0);
  const avgStayDays =
    stayDurations.length > 0
      ? stayDurations.reduce((s, d) => s + d, 0) / stayDurations.length
      : 0;

  return {
    daily,
    totals: {
      totalGuests: (allGuestsRaw ?? []).length,
      totalOrders: completedOrders,
      totalServiceRequests: (serviceReqs30 ?? []).length,
      totalRevenue,
      avgOrderValue: completedOrders > 0 ? totalRevenue / completedOrders : 0,
      avgRating: Math.round(avgRating * 10) / 10,
      totalRatings: ratingsList.length,
      occupancyPct,
      occupiedRooms,
      totalRooms,
      avgStayDays: Math.round(avgStayDays * 10) / 10,
    },
    serviceTypes,
    ordersByStatus,
    ratingDist,
    rawGuests: guests30 ?? [],
    rawOrders: orders30 ?? [],
    rawServiceReqs: serviceReqs30 ?? [],
  };
}

export default async function AnalyticsPage() {
  const admin = await requireAdmin();
  const data = await getAnalyticsData();

  return (
    <AdminShell email={admin.email ?? undefined} title="Аналитика" subtitle="Статистика и отчёты за последние 30 дней">
      <AnalyticsClient {...data} />
    </AdminShell>
  );
}

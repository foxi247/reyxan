import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/hotel/admin-shell";
import { StatCard } from "@/components/hotel/stat-card";
import { Users, Clock, ConciergeBell, Utensils } from "lucide-react";
import { DashboardRequests } from "./dashboard-requests";
import { DashboardGuests } from "./dashboard-guests";
import { DashboardServiceRequests } from "./dashboard-service-requests";
import { formatPhone } from "@/lib/utils";

async function getDashboardData() {
  const supabase = createAdminClient();

  const [
    { count: activeGuests },
    { count: pendingRequests },
    { count: serviceRequests },
    { count: foodOrders },
    { data: pendingList },
    { data: activeGuestList },
    { data: recentServiceReqs },
  ] = await Promise.all([
    supabase.from("guests").select("*", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("guest_access_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("service_requests").select("*", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("room_service_orders").select("*", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("guest_access_requests").select("id, phone, created_at, status").eq("status", "pending").order("created_at", { ascending: false }).limit(10),
    supabase.from("guests").select("*, rooms(number)").eq("status", "active").order("created_at", { ascending: false }).limit(10),
    supabase.from("service_requests").select("*, guests(first_name, last_name), rooms(number), services(title, icon)").in("status", ["new", "in_progress"]).order("created_at", { ascending: false }).limit(6),
  ]);

  return {
    stats: {
      activeGuests: activeGuests ?? 0,
      pendingRequests: pendingRequests ?? 0,
      serviceRequests: serviceRequests ?? 0,
      foodOrders: foodOrders ?? 0,
    },
    pendingList: pendingList ?? [],
    activeGuestList: activeGuestList ?? [],
    recentServiceReqs: recentServiceReqs ?? [],
  };
}

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const { stats, pendingList, activeGuestList, recentServiceReqs } =
    await getDashboardData();

  return (
    <AdminShell email={admin.email ?? undefined} title="Dashboard" subtitle="Обзор отеля в реальном времени">
        <main className="flex-1 overflow-y-auto p-6">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Активные гости"
              value={stats.activeGuests}
              change="+3 за сегодня"
              changePositive={true}
              Icon={Users}
            />
            <StatCard
              title="Ожидают подтверждения"
              value={stats.pendingRequests}
              change="-1 за сегодня"
              changePositive={undefined}
              Icon={Clock}
            />
            <StatCard
              title="Заявки в сервис"
              value={stats.serviceRequests}
              change="+4 за сегодня"
              changePositive={true}
              Icon={ConciergeBell}
            />
            <StatCard
              title="Заказы еды"
              value={stats.foodOrders}
              change="+6 за сегодня"
              changePositive={true}
              Icon={Utensils}
            />
          </div>

          {/* Content grid */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <DashboardRequests requests={pendingList} />
            <DashboardGuests guests={activeGuestList as any} />
          </div>

          <DashboardServiceRequests requests={recentServiceReqs as any} />
        </main>
    </AdminShell>
  );
}

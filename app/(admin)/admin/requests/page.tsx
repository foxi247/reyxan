import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminSidebar } from "@/components/hotel/admin-sidebar";
import { AdminTopbar } from "@/components/hotel/admin-topbar";
import { RequestsClient } from "./requests-client";

async function getRequests() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("service_requests")
    .select("*, guests(first_name, last_name), rooms(number), services(title, icon)")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export default async function AdminRequestsPage() {
  const admin = await requireAdmin();
  const requests = await getRequests();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar adminEmail={admin.email ?? undefined} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopbar title="Сервисные запросы" subtitle="Заявки от гостей отеля" />
        <RequestsClient requests={requests as any} />
      </div>
    </div>
  );
}

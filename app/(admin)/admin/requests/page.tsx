import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/hotel/admin-shell";
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
    <AdminShell email={admin.email ?? undefined} title="Сервисные запросы" subtitle="Заявки от гостей отеля">
      <RequestsClient requests={requests as any} />
    </AdminShell>
  );
}

import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/hotel/admin-shell";
import { ServicesClient } from "./services-client";

async function getServices() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("services")
    .select("*")
    .order("sort_order");
  return data ?? [];
}

export default async function AdminServicesPage() {
  const admin = await requireAdmin();
  const services = await getServices();

  return (
    <AdminShell email={admin.email ?? undefined} title="Сервисы" subtitle="Управление кнопками гостевой панели">
      <ServicesClient services={services as any} />
    </AdminShell>
  );
}

import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminSidebar } from "@/components/hotel/admin-sidebar";
import { AdminTopbar } from "@/components/hotel/admin-topbar";
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
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar adminEmail={admin.email ?? undefined} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopbar title="Сервисы" subtitle="Управление кнопками гостевой панели" />
        <ServicesClient services={services as any} />
      </div>
    </div>
  );
}

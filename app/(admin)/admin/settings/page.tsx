import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminSidebar } from "@/components/hotel/admin-sidebar";
import { AdminTopbar } from "@/components/hotel/admin-topbar";
import { SettingsClient } from "./settings-client";

async function getSettings() {
  const supabase = createAdminClient();
  const { data } = await supabase.from("hotel_settings").select("*").limit(1).single();
  return data;
}

export default async function AdminSettingsPage() {
  const admin = await requireAdmin();
  const settings = await getSettings();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar adminEmail={admin.email ?? undefined} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopbar title="Настройки" subtitle="Конфигурация отеля" />
        <SettingsClient settings={settings as any} siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ""} />
      </div>
    </div>
  );
}

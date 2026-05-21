import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/hotel/admin-shell";
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
    <AdminShell email={admin.email ?? undefined} title="Настройки" subtitle="Конфигурация отеля">
      <SettingsClient settings={settings as any} siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? ""} />
    </AdminShell>
  );
}

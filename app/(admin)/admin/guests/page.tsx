import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminSidebar } from "@/components/hotel/admin-sidebar";
import { AdminTopbar } from "@/components/hotel/admin-topbar";
import { GuestsClient } from "./guests-client";

async function getGuests() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("guests")
    .select("*, rooms(number, floor)")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export default async function AdminGuestsPage() {
  const admin = await requireAdmin();
  const guests = await getGuests();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar adminEmail={admin.email ?? undefined} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopbar title="Гости" subtitle="Управление проживающими гостями" />
        <GuestsClient guests={guests as any} />
      </div>
    </div>
  );
}

import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/hotel/admin-shell";
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
    <AdminShell email={admin.email ?? undefined} title="Гости" subtitle="Управление проживающими гостями">
      <GuestsClient guests={guests as any} />
    </AdminShell>
  );
}

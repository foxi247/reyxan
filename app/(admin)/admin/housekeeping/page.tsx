import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/hotel/admin-shell";
import { HousekeepingClient } from "./housekeeping-client";

async function getHousekeepingData() {
  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: records }, { data: rooms }, { data: staff }] = await Promise.all([
    supabase
      .from("cleaning_records")
      .select("*, rooms(number, floor)")
      .eq("scheduled_date", today)
      .order("created_at"),
    supabase.from("rooms").select("id, number, floor, status").order("number"),
    supabase.from("staff_members").select("id, name").eq("role", "cleaner").eq("is_active", true),
  ]);

  return {
    records: (records ?? []) as {
      id: string; room_id: string; status: string; notes: string | null;
      completed_at: string | null; created_at: string; assigned_to_id: string | null;
      rooms: { number: string; floor: number | null } | null;
    }[],
    allRooms: (rooms ?? []) as {
      id: string; number: string; floor: number | null; status: string;
    }[],
    staff: (staff ?? []) as { id: string; name: string }[],
    today,
  };
}

export default async function HousekeepingPage() {
  const admin = await requireAdmin();
  const data = await getHousekeepingData();
  return (
    <AdminShell email={admin.email ?? undefined} title="Уборка" subtitle={`Расписание на ${new Date().toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}`}>
      <HousekeepingClient {...data} />
    </AdminShell>
  );
}

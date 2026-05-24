import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/hotel/admin-shell";
import { RoomsClient } from "./rooms-client";

async function getRoomsData() {
  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: rooms }, { data: guests }, { data: cleaning }, { data: stays }] =
    await Promise.all([
      supabase.from("rooms").select("*").order("number"),
      supabase
        .from("guests")
        .select("id, first_name, last_name, check_out, room_id")
        .eq("status", "active"),
      supabase
        .from("cleaning_records")
        .select("room_id, status")
        .eq("scheduled_date", today),
      supabase
        .from("stays")
        .select("id, room_id, tv_state, check_out_scheduled, stay_guests(first_name, last_name, is_primary)")
        .eq("status", "active"),
    ]);

  return {
    rooms: (rooms ?? []) as {
      id: string; number: string; floor: number | null;
      status: "available" | "occupied" | "maintenance";
      description: string | null; amenities: string | null; photo_url: string | null;
    }[],
    guestMap: Object.fromEntries(
      (guests ?? []).map((g) => [
        g.room_id,
        { name: `${g.first_name} ${g.last_name}`, checkOut: g.check_out, guestId: g.id },
      ])
    ) as Record<string, { name: string; checkOut: string; guestId: string }>,
    cleaningMap: Object.fromEntries(
      (cleaning ?? []).map((c) => [c.room_id, c.status])
    ) as Record<string, string>,
    stayMap: Object.fromEntries(
      (stays ?? []).map((s) => {
        const primary =
          (s.stay_guests as { first_name: string; last_name: string; is_primary: boolean }[])?.find(
            (g) => g.is_primary
          ) ?? (s.stay_guests as { first_name: string; last_name: string; is_primary: boolean }[])?.[0];
        return [
          s.room_id,
          {
            stayId: s.id,
            tvState: s.tv_state as string,
            checkOut: s.check_out_scheduled,
            primaryGuest: primary
              ? `${primary.first_name} ${primary.last_name}`
              : null,
          },
        ];
      })
    ) as Record<
      string,
      { stayId: string; tvState: string; checkOut: string; primaryGuest: string | null }
    >,
  };
}

export default async function AdminRoomsPage() {
  const admin = await requireAdmin();
  const data = await getRoomsData();
  return (
    <AdminShell email={admin.email ?? undefined} title="Статус номеров" subtitle="Визуальная сетка всех номеров">
      <RoomsClient {...data} />
    </AdminShell>
  );
}

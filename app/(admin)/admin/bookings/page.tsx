import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/hotel/admin-shell";
import { BookingsClient } from "./bookings-client";

async function getBookingsData() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("pre_bookings")
    .select("*")
    .order("check_in", { ascending: true });

  return {
    bookings: (data ?? []) as {
      id: string;
      first_name: string;
      last_name: string;
      phone: string;
      email: string | null;
      check_in: string;
      check_out: string;
      room_preference: string | null;
      notes: string | null;
      status: string;
      created_at: string;
    }[],
  };
}

export default async function BookingsPage() {
  const admin = await requireAdmin();
  const data = await getBookingsData();
  return (
    <AdminShell
      email={admin.email ?? undefined}
      title="Бронирования"
      subtitle="Предварительные заявки на проживание"
    >
      <BookingsClient {...data} />
    </AdminShell>
  );
}

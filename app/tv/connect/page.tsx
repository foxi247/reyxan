import { createAdminClient } from "@/lib/supabase/admin";
import { TvConnectClient } from "./tv-connect-client";

// Cache for 5 minutes — rooms are pre-rendered into HTML, zero client-side fetch
export const revalidate = 300;

export default async function TvConnectPage() {
  let rooms: { id: string; number: string; floor: number | null; status: string }[] = [];
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("rooms")
      .select("id, number, floor, status")
      .order("number");
    rooms = data ?? [];
  } catch { /* return empty list on error */ }

  return <TvConnectClient rooms={rooms} />;
}

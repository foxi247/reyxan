import { createAdminClient } from "@/lib/supabase/admin";
import { TvConnectClient } from "./tv-connect-client";

export const dynamic = "force-dynamic";

async function getRooms() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("rooms")
    .select("id, number, floor, status, theme_name")
    .order("number");
  return (data ?? []) as {
    id: string;
    number: string;
    floor: number | null;
    status: "available" | "occupied" | "maintenance";
    theme_name: string | null;
  }[];
}

export default async function TvConnectPage() {
  const rooms = await getRooms();
  return <TvConnectClient rooms={rooms} />;
}

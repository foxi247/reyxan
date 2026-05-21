import { redirect } from "next/navigation";
import { getGuestSession } from "@/lib/auth/guest-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { RateClient } from "./rate-client";

export default async function RatePage() {
  const session = await getGuestSession();
  if (!session || !session.guestId) redirect("/");

  // Check if already rated
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("guest_ratings")
    .select("id")
    .eq("guest_id", session.guestId)
    .limit(1)
    .single();

  return (
    <RateClient
      firstName={session.firstName ?? "Гость"}
      roomNumber={session.roomNumber ?? ""}
      checkOut={session.checkOut ?? new Date().toISOString().slice(0, 10)}
      hasRated={!!existing}
    />
  );
}

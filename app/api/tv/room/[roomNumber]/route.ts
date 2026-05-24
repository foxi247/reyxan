import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roomNumber: string }> }
) {
  try {
    const { roomNumber } = await params;
    const supabase = createAdminClient();

    // Use select("*") so it works even if migration 005 columns don't exist yet
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("*")
      .eq("number", roomNumber)
      .maybeSingle();

    if (roomError || !room) {
      return NextResponse.json({ error: "Номер не найден" }, { status: 404 });
    }

    // Try to get active stay — gracefully skip if table doesn't exist yet
    let stay: {
      id: string; tv_state: string; tv_state_updated_at: string;
      check_in: string; check_out_scheduled: string; access_token: string | null;
    } | null = null;

    try {
      const { data } = await supabase
        .from("stays")
        .select("id, tv_state, tv_state_updated_at, check_in, check_out_scheduled, access_token")
        .eq("room_id", room.id)
        .eq("status", "active")
        .maybeSingle();
      stay = data;
    } catch { /* stays table not yet created */ }

    let primaryGuest: { first_name: string; last_name: string } | null = null;
    let allGuests: { first_name: string; last_name: string }[] = [];
    let qrUrl: string | null = null;

    if (stay) {
      try {
        const { data: stayGuests } = await supabase
          .from("stay_guests")
          .select("first_name, last_name, is_primary")
          .eq("stay_id", stay.id)
          .order("is_primary", { ascending: false });

        allGuests = (stayGuests ?? []).map((g) => ({
          first_name: g.first_name,
          last_name: g.last_name,
        }));
        primaryGuest = allGuests[0] ?? null;
      } catch { /* stay_guests table not yet created */ }

      if (stay.tv_state === "welcome" && stay.access_token) {
        const host = request.headers.get("host") ?? "localhost:3000";
        const proto = host.includes("localhost") ? "http" : "https";
        qrUrl = `${proto}://${host}/guest/access?token=${stay.access_token}`;
      }
    }

    const { data: settings } = await supabase
      .from("hotel_settings")
      .select("hotel_name")
      .limit(1)
      .maybeSingle();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r = room as any;
    return NextResponse.json({
      room: {
        id: r.id,
        number: r.number,
        floor: r.floor ?? null,
        theme_name: r.theme_name ?? null,
        theme_type: r.theme_type ?? null,
        theme_description: r.theme_description ?? null,
        theme_video_url: r.theme_video_url ?? null,
        theme_video_duration_seconds: r.theme_video_duration_seconds ?? 120,
        tv_background_url: r.tv_background_url ?? null,
      },
      state: stay?.tv_state ?? "idle",
      stay: stay
        ? {
            id: stay.id,
            check_in: stay.check_in,
            check_out_scheduled: stay.check_out_scheduled,
            tv_state_updated_at: stay.tv_state_updated_at,
          }
        : null,
      primaryGuest,
      allGuests,
      qrUrl,
      hotelName: settings?.hotel_name ?? "Reyhan Hotel",
    });
  } catch (e) {
    console.error("TV API error:", e);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

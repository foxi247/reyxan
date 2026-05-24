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

    // Get room with theme fields
    const { data: room } = await supabase
      .from("rooms")
      .select(
        "id, number, floor, status, theme_name, theme_type, theme_description, theme_video_url, theme_video_duration_seconds, tv_background_url"
      )
      .eq("number", roomNumber)
      .maybeSingle();

    if (!room) {
      return NextResponse.json({ error: "Номер не найден" }, { status: 404 });
    }

    // Get active stay
    const { data: stay } = await supabase
      .from("stays")
      .select("id, tv_state, tv_state_updated_at, check_in, check_out_scheduled, access_token")
      .eq("room_id", room.id)
      .eq("status", "active")
      .maybeSingle();

    let primaryGuest: { first_name: string; last_name: string } | null = null;
    let allGuests: { first_name: string; last_name: string }[] = [];
    let qrUrl: string | null = null;

    if (stay) {
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

      if (stay.tv_state === "welcome" && stay.access_token) {
        const host = request.headers.get("host") ?? "localhost:3000";
        const proto = host.includes("localhost") ? "http" : "https";
        qrUrl = `${proto}://${host}/guest/access?token=${stay.access_token}`;
      }
    }

    // Hotel name from settings
    const { data: settings } = await supabase
      .from("hotel_settings")
      .select("hotel_name")
      .limit(1)
      .maybeSingle();

    return NextResponse.json({
      room: {
        id: room.id,
        number: room.number,
        floor: room.floor,
        theme_name: room.theme_name,
        theme_type: room.theme_type,
        theme_description: room.theme_description,
        theme_video_url: room.theme_video_url,
        theme_video_duration_seconds: room.theme_video_duration_seconds ?? 120,
        tv_background_url: room.tv_background_url,
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

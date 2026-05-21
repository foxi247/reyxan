import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";
import type { Guest, Room, GuestSession } from "@/types/app";
import { COOKIE_NAMES } from "@/lib/constants";

const SECRET =
  process.env.GUEST_SESSION_SECRET ?? "dev-secret-change-in-production";

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}

function buildSessionCookieValue(session: GuestSession): string {
  const payload = JSON.stringify(session);
  const signature = sign(payload);
  return Buffer.from(JSON.stringify({ payload, signature })).toString(
    "base64"
  );
}

export async function GET(request: NextRequest) {
  const requestId = request.nextUrl.searchParams.get("requestId");

  if (!requestId || !/^[0-9a-f-]{36}$/.test(requestId)) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    const { data: req } = await supabase
      .from("guest_access_requests")
      .select("status, guest_id")
      .eq("id", requestId)
      .single();

    if (!req) {
      return NextResponse.json({ status: "not_found" }, { status: 404 });
    }

    const reqData = req as { status: string; guest_id: string | null };

    // Not approved yet — return status only
    if (reqData.status !== "approved" || !reqData.guest_id) {
      return NextResponse.json({ status: reqData.status });
    }

    // Fetch guest details
    const { data: guestRaw } = await supabase
      .from("guests")
      .select("*")
      .eq("id", reqData.guest_id)
      .single();

    const guest = guestRaw as Guest | null;
    if (!guest) {
      return NextResponse.json({ status: "approved" });
    }

    // Fetch room number
    let roomNumber: string | null = null;
    if (guest.room_id) {
      const { data: roomRaw } = await supabase
        .from("rooms")
        .select("number")
        .eq("id", guest.room_id)
        .single();
      const room = roomRaw as Pick<Room, "number"> | null;
      roomNumber = room?.number ?? null;
    }

    // Fetch chat thread
    const { data: threadRaw } = await supabase
      .from("chat_threads")
      .select("id")
      .eq("guest_id", guest.id)
      .eq("status", "open")
      .limit(1)
      .single();
    const thread = threadRaw as { id: string } | null;

    // Build signed session cookie value
    const session: GuestSession = {
      guestId: guest.id,
      phone: guest.phone,
      roomId: guest.room_id,
      roomNumber,
      firstName: guest.first_name,
      lastName: guest.last_name,
      checkIn: guest.check_in,
      checkOut: guest.check_out,
      status: guest.status,
      threadId: thread?.id ?? null,
    };
    const cookieValue = buildSessionCookieValue(session);

    // Cookie expires at check-out + 1 day
    const expires = new Date(guest.check_out);
    expires.setDate(expires.getDate() + 1);

    const response = NextResponse.json({ status: "approved" });
    response.cookies.set(COOKIE_NAMES.guestSession, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires,
    });

    return response;
  } catch {
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

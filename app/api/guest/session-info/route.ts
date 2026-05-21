import { NextResponse } from "next/server";
import { getGuestSession } from "@/lib/auth/guest-session";

export async function GET() {
  const session = await getGuestSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    threadId: session.threadId,
    roomNumber: session.roomNumber,
    firstName: session.firstName,
    lastName: session.lastName,
    guestId: session.guestId,
  });
}

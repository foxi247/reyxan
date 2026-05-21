import { NextResponse } from "next/server";
import { clearGuestSession } from "@/lib/auth/guest-session";

export async function POST() {
  await clearGuestSession();
  return NextResponse.json({ success: true });
}

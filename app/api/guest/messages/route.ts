import { NextResponse } from "next/server";
import { getGuestSession } from "@/lib/auth/guest-session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const session = await getGuestSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  if (!session.threadId) {
    return NextResponse.json({ messages: [], threadId: null });
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("thread_id", session.threadId)
    .order("created_at");

  return NextResponse.json({ messages: data ?? [], threadId: session.threadId });
}

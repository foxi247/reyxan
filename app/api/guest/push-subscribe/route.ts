import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGuestSession } from "@/lib/auth/guest-session";

export async function POST(req: Request) {
  try {
    const session = await getGuestSession();
    if (!session?.guestId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { endpoint, keys } = body as {
      endpoint: string;
      keys: { p256dh: string; auth: string };
    };

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    const supabase = createAdminClient();
    await supabase.from("push_subscriptions").upsert(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {
        guest_id: session.guestId,
        endpoint,
        p256dh: keys.p256dh,
        auth_key: keys.auth,
      } as any,
      { onConflict: "endpoint" }
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { endpoint } = await req.json();
    const supabase = createAdminClient();
    await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}

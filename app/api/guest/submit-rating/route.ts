import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getGuestSession } from "@/lib/auth/guest-session";

export async function POST(req: Request) {
  try {
    const session = await getGuestSession();
    if (!session || !session.guestId) {
      return NextResponse.json({ error: "Нет сессии" }, { status: 401 });
    }

    const body = await req.json();
    const rating = Number(body.rating);
    const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 1000) : null;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Оценка должна быть от 1 до 5" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Prevent duplicate rating
    const { data: existing } = await supabase
      .from("guest_ratings")
      .select("id")
      .eq("guest_id", session.guestId)
      .limit(1)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Вы уже оставили отзыв" }, { status: 409 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from("guest_ratings").insert({
      guest_id: session.guestId,
      rating,
      comment: comment || null,
    } as any);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Произошла ошибка" }, { status: 500 });
  }
}

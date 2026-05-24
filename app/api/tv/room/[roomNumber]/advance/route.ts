import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { advanceTvState } from "@/lib/actions/stays";

const VALID_TV_TRANSITIONS: Record<string, string[]> = {
  welcome: ["intro_video", "guest_panel"],
  intro_video: ["guest_panel"],
  checkout_message: ["session_closing"],
  session_closing: ["idle"],
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomNumber: string }> }
) {
  try {
    await params; // consume params (roomNumber not needed — stayId is authoritative)
    const body = await request.json() as { stayId?: string; fromState?: string; toState?: string };
    const { stayId, fromState, toState } = body;

    if (!stayId || !fromState || !toState) {
      return NextResponse.json({ error: "Отсутствуют параметры" }, { status: 400 });
    }

    const allowed = VALID_TV_TRANSITIONS[fromState] ?? [];
    if (!allowed.includes(toState)) {
      return NextResponse.json({ error: "Недопустимый переход" }, { status: 400 });
    }

    const result = await advanceTvState(stayId, fromState, toState);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}

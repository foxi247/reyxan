import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { first_name, last_name, phone, email, check_in, check_out, room_preference, notes } = body;

    if (!first_name || !last_name || !phone || !check_in || !check_out) {
      return NextResponse.json({ error: "Заполните обязательные поля" }, { status: 400 });
    }

    // Basic date validation
    if (new Date(check_out) <= new Date(check_in)) {
      return NextResponse.json({ error: "Дата выезда должна быть позже даты заезда" }, { status: 400 });
    }

    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("pre_bookings").insert({
      first_name: String(first_name).trim().slice(0, 100),
      last_name: String(last_name).trim().slice(0, 100),
      phone: String(phone).trim().slice(0, 30),
      email: email ? String(email).trim().slice(0, 200) : null,
      check_in,
      check_out,
      room_preference: room_preference ? String(room_preference).trim().slice(0, 200) : null,
      notes: notes ? String(notes).trim().slice(0, 1000) : null,
    } as any);

    if (error) return NextResponse.json({ error: "Не удалось создать бронирование" }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Произошла ошибка" }, { status: 500 });
  }
}

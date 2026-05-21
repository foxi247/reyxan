import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createAdminClient } from "@/lib/supabase/admin";
import { setStaffSessionCookie } from "@/lib/auth/staff-session";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: "Введите логин и пароль" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: staff } = await supabase
      .from("staff_members")
      .select("id, name, role, password_hash, is_active")
      .eq("username", String(username).trim())
      .single();

    if (!staff || !staff.is_active) {
      return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
    }

    const valid = await bcrypt.compare(String(password), staff.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
    }

    await setStaffSessionCookie({
      staffId: staff.id,
      name: staff.name,
      role: staff.role as "cleaner" | "kitchen",
    });

    return NextResponse.json({ success: true, role: staff.role });
  } catch {
    return NextResponse.json({ error: "Произошла ошибка" }, { status: 500 });
  }
}

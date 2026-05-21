import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffSession } from "@/lib/auth/staff-session";

export async function POST(req: Request) {
  try {
    const session = await getStaffSession();
    if (!session || session.role !== "kitchen") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, status } = await req.json();
    if (!orderId || !["preparing", "delivering", "delivered"].includes(status)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("room_service_orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    if (error) return NextResponse.json({ error: "Не удалось обновить заказ" }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Произошла ошибка" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStaffSession } from "@/lib/auth/staff-session";

export async function POST(req: Request) {
  try {
    const session = await getStaffSession();
    if (!session || session.role !== "cleaner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId, status } = await req.json();
    if (!taskId || !["pending", "in_progress", "done", "skipped"].includes(status)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const supabase = createAdminClient();
    const update: Record<string, unknown> = { status };
    if (status === "done") update.completed_at = new Date().toISOString();

    const { error } = await supabase
      .from("cleaning_records")
      .update(update)
      .eq("id", taskId);

    if (error) return NextResponse.json({ error: "Не удалось обновить статус" }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Произошла ошибка" }, { status: 500 });
  }
}

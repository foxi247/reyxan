import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("rooms")
      .select("id, number, floor, status")
      .order("number");
    if (error) return NextResponse.json({ rooms: [] });
    return NextResponse.json({ rooms: data ?? [] });
  } catch {
    return NextResponse.json({ rooms: [] });
  }
}

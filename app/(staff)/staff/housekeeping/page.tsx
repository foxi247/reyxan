import { getStaffSession } from "@/lib/auth/staff-session";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { StaffHousekeepingClient } from "./staff-housekeeping-client";

async function getData(staffId: string) {
  const supabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data: tasks } = await supabase
    .from("cleaning_records")
    .select("*, rooms(number, floor)")
    .eq("scheduled_date", today)
    .or(`assigned_to_id.eq.${staffId},assigned_to_id.is.null`)
    .order("created_at");
  return { tasks: tasks ?? [] };
}

export default async function StaffHousekeepingPage() {
  const session = await getStaffSession();
  if (!session) redirect("/staff/login");
  if (session.role !== "cleaner") redirect("/staff/kitchen");
  const data = await getData(session.staffId);
  return <StaffHousekeepingClient tasks={data.tasks as any} staffName={session.name} staffId={session.staffId} />;
}

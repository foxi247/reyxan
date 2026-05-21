import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/hotel/admin-shell";
import { StaffManagementClient } from "./staff-client";

async function getData() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("staff_members")
    .select("id, name, role, username, is_active, created_at")
    .order("created_at");
  return { staff: data ?? [] };
}

export default async function StaffManagementPage() {
  const admin = await requireAdmin();
  const data = await getData();
  return (
    <AdminShell
      email={admin.email ?? undefined}
      title="Персонал"
      subtitle="Аккаунты уборщиц и кухни"
    >
      <StaffManagementClient staff={data.staff as any} />
    </AdminShell>
  );
}

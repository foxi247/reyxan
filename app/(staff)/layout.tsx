import { redirect } from "next/navigation";
import { getStaffSession } from "@/lib/auth/staff-session";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await getStaffSession();
  if (!session) redirect("/staff/login");
  return <>{children}</>;
}

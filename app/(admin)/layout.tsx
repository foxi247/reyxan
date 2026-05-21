import { AdminRealtimeSync } from "@/components/hotel/admin-realtime-sync";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AdminRealtimeSync />
      {children}
    </>
  );
}

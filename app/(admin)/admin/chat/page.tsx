import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminShell } from "@/components/hotel/admin-shell";
import { AdminChatClient } from "./chat-client";
import { Loader2 } from "lucide-react";

async function getChatData() {
  const supabase = createAdminClient();
  const { data: threads } = await supabase
    .from("chat_threads")
    .select("*, guests(first_name, last_name, phone), rooms(number)")
    .eq("status", "open")
    .order("last_message_at", { ascending: false, nullsFirst: false });

  return { threads: threads ?? [] };
}

export default async function AdminChatPage() {
  const admin = await requireAdmin();
  const { threads } = await getChatData();

  return (
    <AdminShell email={admin.email ?? undefined} title="Чат с гостями" subtitle="Общение и поддержка гостей в реальном времени">
        <Suspense fallback={
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gold" />
          </div>
        }>
          <AdminChatClient threads={threads as any} adminId={admin.id} />
        </Suspense>
    </AdminShell>
  );
}

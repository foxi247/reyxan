import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminSidebar } from "@/components/hotel/admin-sidebar";
import { AdminTopbar } from "@/components/hotel/admin-topbar";
import { MenuClient } from "./menu-client";

async function getMenuData() {
  const supabase = createAdminClient();
  const [{ data: categories }, { data: items }] = await Promise.all([
    supabase.from("menu_categories").select("*").order("sort_order"),
    supabase.from("menu_items").select("*").order("name"),
  ]);
  return {
    categories: (categories ?? []) as {
      id: string; name: string; sort_order: number; is_active: boolean;
    }[],
    items: (items ?? []) as {
      id: string; category_id: string; name: string; description: string | null;
      price: number; image_url: string | null; is_available: boolean;
    }[],
  };
}

export default async function AdminMenuPage() {
  const admin = await requireAdmin();
  const { categories, items } = await getMenuData();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AdminSidebar adminEmail={admin.email ?? undefined} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminTopbar title="Меню" subtitle="Управление категориями и блюдами" />
        <MenuClient categories={categories} items={items} />
      </div>
    </div>
  );
}

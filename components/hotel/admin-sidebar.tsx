"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  MessageCircle,
  ConciergeBell,
  Utensils,
  UtensilsCrossed,
  BarChart3,
  BedDouble,
  Sparkles,
  CalendarPlus,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HotelLogo } from "@/components/hotel/hotel-logo";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/lib/constants";
import { adminLogout } from "@/lib/actions/admin";

const NAV_ITEMS = [
  { href: ROUTES.admin.home, label: "Dashboard", Icon: LayoutDashboard },
  { href: ROUTES.admin.guests, label: "Гости", Icon: Users },
  { href: ROUTES.admin.requests, label: "Запросы", Icon: ClipboardList },
  { href: ROUTES.admin.chat, label: "Чат", Icon: MessageCircle },
  { href: ROUTES.admin.orders, label: "Заказы еды", Icon: Utensils },
  { href: ROUTES.admin.menu, label: "Меню", Icon: UtensilsCrossed },
  { href: ROUTES.admin.services, label: "Сервисы", Icon: ConciergeBell },
  { href: ROUTES.admin.rooms, label: "Номера", Icon: BedDouble },
  { href: ROUTES.admin.housekeeping, label: "Уборка", Icon: Sparkles },
  { href: ROUTES.admin.bookings, label: "Бронирования", Icon: CalendarPlus },
  { href: ROUTES.admin.analytics, label: "Аналитика", Icon: BarChart3 },
  { href: ROUTES.admin.settings, label: "Настройки", Icon: Settings },
];

interface AdminSidebarProps {
  adminEmail?: string;
  onClose?: () => void;
}

export function AdminSidebar({ adminEmail, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[260px] flex-shrink-0 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="relative flex flex-col items-center gap-2 border-b border-border px-6 py-6">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg hover:bg-accent transition-colors md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <HotelLogo size="md" />
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">Админ-панель</span>
          <Badge variant="gold" className="text-[10px] py-0">v1.0</Badge>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive =
            href === ROUTES.admin.home
              ? pathname === href
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gold/10 text-gold border border-gold/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon className={cn("h-4 w-4 stroke-[1.5]", isActive && "stroke-2")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Admin profile */}
      <div className="border-t border-border p-4">
        <div className="hotel-card p-3 flex items-center gap-3">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full gold-gradient text-white text-sm font-medium">
            А
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">Администратор</div>
            <div className="text-xs text-muted-foreground truncate">
              {adminEmail ?? "admin@reyhan.ru"}
            </div>
          </div>
        </div>
        <form action={adminLogout}>
          <button
            type="submit"
            className="mt-2 w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground hover:text-hotel-red hover:bg-hotel-red/5 transition-all duration-200"
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </button>
        </form>
      </div>
    </aside>
  );
}

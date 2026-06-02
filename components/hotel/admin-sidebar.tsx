"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BedDouble,
  CalendarPlus,
  ClipboardList,
  ConciergeBell,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Settings,
  Sparkles,
  UserCog,
  Users,
  Utensils,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HotelLogo } from "@/components/hotel/hotel-logo";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/lib/constants";
import { adminLogout } from "@/lib/actions/admin";

const NAV_ITEMS = [
  { href: ROUTES.admin.home, label: "Главная", Icon: LayoutDashboard },
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
  { href: "/admin/staff", label: "Персонал", Icon: UserCog },
  { href: ROUTES.admin.settings, label: "Настройки", Icon: Settings },
];

interface AdminSidebarProps {
  adminEmail?: string;
  onClose?: () => void;
}

export function AdminSidebar({ adminEmail, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[280px] flex-shrink-0 flex-col border-r border-gold/10 bg-card/92 backdrop-blur-2xl">
      <div className="relative flex flex-col items-center gap-2 border-b border-gold/10 px-6 py-6">
        {onClose ? (
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg border border-gold/10 bg-white/5 transition-colors hover:bg-white/10 md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
        <HotelLogo size="md" />
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
            админ-панель
          </span>
          <Badge variant="gold" className="py-0 text-[10px]">
            Reyhan
          </Badge>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const isActive =
            href === ROUTES.admin.home ? pathname === href : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "border border-gold/20 bg-gold/10 text-gold"
                  : "text-muted-foreground hover:bg-white/5 hover:text-hotel-cream"
              )}
            >
              <Icon className={cn("h-4 w-4 stroke-[1.5]", isActive && "stroke-[2]")} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gold/10 p-4">
        <div className="hotel-card flex items-center gap-3 p-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full gold-gradient text-sm font-medium text-gold-foreground">
            A
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-hotel-cream">Администратор</div>
            <div className="truncate text-xs text-muted-foreground">
              {adminEmail ?? "admin@reyhan.ru"}
            </div>
          </div>
        </div>
        <form action={adminLogout}>
          <button
            type="submit"
            className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-all duration-200 hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </button>
        </form>
      </div>
    </aside>
  );
}

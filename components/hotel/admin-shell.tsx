"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Utensils,
} from "lucide-react";
import { AdminSidebar } from "./admin-sidebar";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

const MOBILE_TABS = [
  { href: ROUTES.admin.home, label: "Главная", Icon: LayoutDashboard },
  { href: ROUTES.admin.chat, label: "Чат", Icon: MessageCircle },
  { href: ROUTES.admin.requests, label: "Запросы", Icon: ClipboardList },
  { href: ROUTES.admin.orders, label: "Заказы", Icon: Utensils },
  { href: ROUTES.admin.analytics, label: "Аналитика", Icon: BarChart3 },
];

interface AdminShellProps {
  email?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function AdminShell({ email, title, subtitle, children }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-transparent text-foreground">
      <div className="hidden flex-shrink-0 md:flex">
        <AdminSidebar adminEmail={email} />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />
          <div
            className="absolute left-0 top-0 h-full shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <AdminSidebar adminEmail={email} onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 flex-shrink-0 items-center justify-between border-b border-gold/10 bg-card/80 px-4 backdrop-blur-2xl md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold/10 bg-white/5 transition-colors hover:bg-white/10"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="max-w-[180px] truncate text-sm font-medium text-hotel-cream">{title}</p>
          <ThemeToggle size="sm" />
        </header>

        <header className="hidden h-16 flex-shrink-0 items-center justify-between border-b border-gold/10 bg-card/75 px-6 backdrop-blur-2xl md:flex">
          <div>
            <h1 className="font-serif text-2xl font-medium text-hotel-cream">{title}</h1>
            {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
          </div>
          <ThemeToggle size="sm" />
        </header>

        <div className="flex flex-1 flex-col overflow-hidden pb-[60px] md:pb-0">
          {children}
        </div>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-gold/10 bg-card/92 backdrop-blur-2xl md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex h-[60px]">
          {MOBILE_TABS.map(({ href, label, Icon }) => {
            const isActive =
              href === ROUTES.admin.home ? pathname === href : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                  isActive ? "text-gold" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2]")} />
                {label}
              </Link>
            );
          })}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground"
          >
            <Menu className="h-5 w-5" />
            Ещё
          </button>
        </div>
      </nav>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  LayoutDashboard,
  MessageCircle,
  ClipboardList,
  Utensils,
  BarChart3,
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
  { href: ROUTES.admin.analytics, label: "Анализ", Icon: BarChart3 },
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
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      {/* Desktop permanent sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <AdminSidebar adminEmail={email} />
      </div>

      {/* Mobile overlay sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="absolute left-0 top-0 h-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <AdminSidebar
              adminEmail={email}
              onClose={() => setSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Mobile header */}
        <header className="flex h-14 flex-shrink-0 items-center justify-between px-4 border-b border-border bg-card md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-accent transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="font-medium text-sm truncate max-w-[180px]">{title}</p>
          <ThemeToggle size="sm" />
        </header>

        {/* Desktop topbar */}
        <header className="hidden md:flex h-16 flex-shrink-0 items-center justify-between px-6 border-b border-border bg-card">
          <div>
            <h1 className="font-serif text-xl font-medium">{title}</h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
            )}
          </div>
          <ThemeToggle size="sm" />
        </header>

        {/* Content — reserve space for mobile bottom nav */}
        <div className="flex-1 overflow-hidden pb-[60px] md:pb-0">
          {children}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-border bg-card/95 backdrop-blur-xl"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex h-[60px]">
          {MOBILE_TABS.map(({ href, label, Icon }) => {
            const isActive =
              href === ROUTES.admin.home
                ? pathname === href
                : pathname.startsWith(href);
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

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Utensils, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

const NAV_ITEMS = [
  { href: ROUTES.guest.home, label: "Главная", Icon: Home },
  { href: ROUTES.guest.chat, label: "Чат", Icon: MessageCircle },
  { href: ROUTES.guest.menu, label: "Меню", Icon: Utensils },
  { href: ROUTES.guest.profile, label: "Профиль", Icon: User },
];

export function GuestBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile z-50"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-3 mb-2 rounded-3xl bg-card/95 backdrop-blur-xl border border-border shadow-lg px-2 py-2">
        <div className="grid grid-cols-4 gap-1">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "nav-item",
                  isActive
                    ? "bg-gold/10 text-gold"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon
                  className={cn(
                    "transition-all duration-200",
                    isActive ? "h-5 w-5 stroke-[1.8]" : "h-5 w-5 stroke-[1.5]"
                  )}
                />
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    isActive ? "text-gold" : "text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

"use client";

import { Bell } from "lucide-react";
import { ThemeToggle } from "@/components/hotel/theme-toggle";
import { Badge } from "@/components/ui/badge";

interface AdminTopbarProps {
  title?: string;
  subtitle?: string;
}

export function AdminTopbar({ title, subtitle }: AdminTopbarProps) {
  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-border bg-card px-6">
      <div>
        {title && <h1 className="font-serif text-xl font-medium">{title}</h1>}
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle size="sm" />
        <button className="relative flex h-9 w-9 items-center justify-center rounded-2xl border border-border bg-background hover:border-gold/40 hover:bg-accent transition-all">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full gold-gradient text-[9px] text-white font-medium">
            3
          </span>
        </button>
      </div>
    </header>
  );
}

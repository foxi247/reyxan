"use client";

import {
  Bath,
  BookOpen,
  ConciergeBell,
  Headphones,
  Headset,
  MessageCircle,
  Phone,
  Settings,
  Shield,
  Star,
  Utensils,
  Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  ConciergeBell,
  Headphones,
  Utensils,
  BookOpen,
  Bath,
  Headset,
  Wifi,
  Shield,
  MessageCircle,
  Phone,
  Settings,
  Star,
};

interface GuestServiceCardProps {
  title: string;
  icon: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function GuestServiceCard({
  title,
  icon,
  onClick,
  disabled,
  loading,
  className,
}: GuestServiceCardProps) {
  const Icon = ICON_MAP[icon] ?? ConciergeBell;

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "service-card w-full text-left disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
    >
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-gold/20 bg-gold/12">
        {loading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gold border-t-transparent" />
        ) : (
          <Icon className="h-5 w-5 text-gold stroke-[1.6]" />
        )}
      </div>
      <div className="space-y-1">
        <span className="block text-sm font-medium leading-tight text-hotel-cream line-clamp-2">
          {title}
        </span>
        <span className="block text-[11px] uppercase tracking-[0.24em] text-gold/70">
          сервис
        </span>
      </div>
    </button>
  );
}

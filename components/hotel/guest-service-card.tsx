"use client";

import {
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
        "service-card w-full text-left",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className
      )}
    >
      {/* Icon circle */}
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gold/10 border border-gold/20 flex-shrink-0">
        {loading ? (
          <div className="h-4 w-4 rounded-full border-2 border-gold border-t-transparent animate-spin" />
        ) : (
          <Icon className="h-5 w-5 text-gold stroke-[1.5]" />
        )}
      </div>
      {/* Label */}
      <span className="text-sm font-medium text-foreground leading-tight line-clamp-2">
        {title}
      </span>
    </button>
  );
}

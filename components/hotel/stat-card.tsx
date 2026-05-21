import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  change?: string;
  changePositive?: boolean;
  Icon: LucideIcon;
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  changePositive,
  Icon,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "hotel-card p-5 flex flex-col gap-3",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {title}
          </span>
          <span className="font-serif text-4xl font-medium">{value}</span>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/10 border border-gold/20">
          <Icon className="h-5 w-5 text-gold stroke-[1.5]" />
        </div>
      </div>
      {change && (
        <span
          className={cn(
            "text-xs font-medium",
            changePositive === true
              ? "text-hotel-green"
              : changePositive === false
              ? "text-hotel-red"
              : "text-muted-foreground"
          )}
        >
          {change}
        </span>
      )}
    </div>
  );
}

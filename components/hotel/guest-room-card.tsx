import { Calendar, ChevronRight, DoorOpen } from "lucide-react";
import { cn, formatDateRange } from "@/lib/utils";

interface GuestRoomCardProps {
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  className?: string;
  onClick?: () => void;
}

export function GuestRoomCard({
  roomNumber,
  checkIn,
  checkOut,
  className,
  onClick,
}: GuestRoomCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "hotel-card flex w-full items-center gap-4 px-5 py-5 text-left transition-all duration-200 active:scale-[0.99] group",
        className
      )}
    >
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl gold-gradient shadow-sm">
        <DoorOpen className="h-6 w-6 text-gold-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="text-xs uppercase tracking-[0.28em] text-gold/70">номер</div>
        <div className="mt-1 font-serif text-2xl font-medium text-hotel-cream">
          {roomNumber}
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground" />
          <span className="truncate text-sm text-muted-foreground">
            {formatDateRange(checkIn, checkOut)}
          </span>
        </div>
      </div>

      <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground transition-colors group-hover:text-gold" />
    </button>
  );
}

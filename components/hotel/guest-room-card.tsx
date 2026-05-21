import { DoorOpen, Calendar, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateRange } from "@/lib/utils";

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
        "w-full hotel-card px-5 py-4 flex items-center gap-4 hover:border-gold/40 transition-all duration-200 active:scale-[0.99] group",
        className
      )}
    >
      {/* Room icon */}
      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl gold-gradient shadow-sm">
        <DoorOpen className="h-6 w-6 text-white" />
      </div>

      {/* Info */}
      <div className="flex-1 text-left min-w-0">
        <div className="font-serif text-xl font-medium">Комната {roomNumber}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <span className="text-sm text-muted-foreground truncate">
            {formatDateRange(checkIn, checkOut)}
          </span>
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-gold transition-colors flex-shrink-0" />
    </button>
  );
}

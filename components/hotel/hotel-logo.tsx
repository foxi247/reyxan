import { cn } from "@/lib/utils";

interface HotelLogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark" | "gold";
}

export function HotelLogo({ className, size = "md", variant = "gold" }: HotelLogoProps) {
  const sizes = {
    sm: { ornament: 20, title: "text-lg", subtitle: "text-[9px]" },
    md: { ornament: 28, title: "text-2xl", subtitle: "text-[10px]" },
    lg: { ornament: 36, title: "text-3xl", subtitle: "text-xs" },
  };

  const colors = {
    gold: "text-gold",
    light: "text-white",
    dark: "text-foreground",
  };

  const s = sizes[size];
  const c = colors[variant];

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      {/* Ornament */}
      <svg
        width={s.ornament}
        height={s.ornament}
        viewBox="0 0 28 28"
        fill="none"
        className={cn("opacity-90", c)}
      >
        {/* 8-petal flower ornament */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 45 * Math.PI) / 180;
          const x1 = 14 + 4 * Math.cos(angle);
          const y1 = 14 + 4 * Math.sin(angle);
          const x2 = 14 + 11 * Math.cos(angle);
          const y2 = 14 + 11 * Math.sin(angle);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          );
        })}
        <circle cx="14" cy="14" r="3" fill="currentColor" />
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = ((i * 45 + 22.5) * Math.PI) / 180;
          const cx = 14 + 7.5 * Math.cos(angle);
          const cy = 14 + 7.5 * Math.sin(angle);
          return (
            <circle key={i} cx={cx} cy={cy} r="0.8" fill="currentColor" />
          );
        })}
      </svg>
      {/* Text */}
      <div className="flex flex-col items-center">
        <span
          className={cn(
            "font-serif font-medium tracking-widest leading-none",
            s.title,
            c
          )}
        >
          Рейхан
        </span>
        <span
          className={cn(
            "tracking-[0.2em] uppercase font-sans font-light",
            s.subtitle,
            variant === "gold" ? "text-muted-foreground" : c
          )}
        >
          Hotel
        </span>
      </div>
    </div>
  );
}

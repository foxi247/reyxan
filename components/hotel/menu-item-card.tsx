"use client";

import { useState } from "react";
import { Bookmark, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MenuItemCardProps {
  id: string;
  name: string;
  description: string | null;
  price: number;
  onOrder?: (id: string) => void;
  ordered?: boolean;
  className?: string;
}

const GRADIENT_COLORS = [
  "from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30",
  "from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30",
  "from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30",
  "from-blue-100 to-sky-100 dark:from-blue-900/30 dark:to-sky-900/30",
  "from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30",
];

function getGradient(id: string) {
  const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return GRADIENT_COLORS[hash % GRADIENT_COLORS.length];
}

export function MenuItemCard({
  id,
  name,
  description,
  price,
  onOrder,
  ordered,
  className,
}: MenuItemCardProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const gradient = getGradient(id);

  return (
    <div
      className={cn(
        "hotel-card flex overflow-hidden transition-all duration-200",
        className
      )}
    >
      {/* Image placeholder */}
      <div
        className={cn(
          "w-28 flex-shrink-0 bg-gradient-to-br flex items-center justify-center",
          gradient
        )}
      >
        <span className="text-3xl opacity-60">
          {name.includes("кофе") || name.includes("чай") || name.includes("напиток")
            ? "☕"
            : name.includes("суп") || name.includes("каша")
            ? "🍲"
            : name.includes("стейк") || name.includes("курин")
            ? "🥩"
            : name.includes("десерт") || name.includes("медовик") || name.includes("сырник")
            ? "🍰"
            : name.includes("омлет") || name.includes("яиц")
            ? "🍳"
            : name.includes("фрукт")
            ? "🍓"
            : "🍽️"}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col justify-between min-w-0 relative">
        <button
          onClick={() => setIsBookmarked(!isBookmarked)}
          className="absolute right-3 top-3 p-1 rounded-full hover:bg-accent transition-colors"
        >
          <Bookmark
            className={cn(
              "h-4 w-4 transition-colors",
              isBookmarked ? "fill-gold text-gold" : "text-muted-foreground"
            )}
          />
        </button>

        <div className="pr-7">
          <h3 className="font-serif font-medium text-base leading-tight">{name}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          <span className="font-serif text-lg font-medium text-gold">
            {formatPrice(price)}
          </span>
          <Button
            size="sm"
            variant={ordered ? "secondary" : "gold"}
            onClick={() => onOrder?.(id)}
            className="h-8 px-3 text-xs rounded-xl"
          >
            {ordered ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Добавлено
              </>
            ) : (
              <>
                <Plus className="h-3.5 w-3.5" />
                Заказать
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

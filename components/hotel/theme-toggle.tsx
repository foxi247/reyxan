"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface ThemeToggleProps {
  className?: string;
  size?: "sm" | "md";
}

export function ThemeToggle({ className, size = "md" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative flex items-center rounded-full border border-border bg-secondary transition-all duration-300 hover:border-gold/40",
        size === "sm" ? "h-8 w-16 px-1" : "h-9 w-18 px-1.5",
        className
      )}
      aria-label="Переключить тему"
    >
      <span
        className={cn(
          "absolute flex items-center justify-center rounded-full bg-card shadow-sm transition-all duration-300",
          size === "sm" ? "h-6 w-6" : "h-7 w-7",
          isDark
            ? size === "sm" ? "translate-x-8" : "translate-x-9"
            : "translate-x-0"
        )}
      >
        {isDark ? (
          <Moon className={cn("text-gold", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
        ) : (
          <Sun className={cn("text-gold", size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
        )}
      </span>
      <Sun
        className={cn(
          "text-muted-foreground transition-opacity",
          size === "sm" ? "h-3 w-3 ml-1" : "h-3.5 w-3.5 ml-1",
          isDark ? "opacity-30" : "opacity-70"
        )}
      />
      <Moon
        className={cn(
          "text-muted-foreground transition-opacity ml-auto",
          size === "sm" ? "h-3 w-3 mr-1" : "h-3.5 w-3.5 mr-1",
          isDark ? "opacity-70" : "opacity-30"
        )}
      />
    </button>
  );
}

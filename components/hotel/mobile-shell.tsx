import { cn } from "@/lib/utils";

interface MobileShellProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileShell({ children, className }: MobileShellProps) {
  return (
    <div className="min-h-screen bg-black/5 dark:bg-black/30 md:flex md:items-start md:justify-center md:py-8">
      <div
        className={cn(
          "mobile-shell mobile-shell-desktop",
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}

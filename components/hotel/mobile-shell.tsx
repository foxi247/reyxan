import { cn } from "@/lib/utils";

interface MobileShellProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileShell({ children, className }: MobileShellProps) {
  return (
    <div className="min-h-screen bg-black/35 md:flex md:items-start md:justify-center md:py-8">
      <div className={cn("mobile-shell mobile-shell-desktop", className)}>
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute left-[-10%] top-[-5%] h-48 w-48 rounded-full bg-gold/10 blur-3xl" />
          <div className="absolute right-[-12%] top-[16%] h-56 w-56 rounded-full bg-hotel-purple-soft/30 blur-3xl" />
        </div>
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}

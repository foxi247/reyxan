import Link from "next/link";
import { HourglassIcon, XCircle, Lock, Phone } from "lucide-react";
import { MobileShell } from "@/components/hotel/mobile-shell";
import { HotelLogo } from "@/components/hotel/hotel-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function GuestExpiredPage() {
  return (
    <MobileShell>
      {/* Header */}
      <div className="flex justify-center px-6 py-5">
        <HotelLogo size="md" />
      </div>

      {/* Hero */}
      <div className="relative mx-4 h-40 overflow-hidden rounded-3xl bg-gradient-to-br from-stone-100 to-amber-50 dark:from-stone-800 dark:to-stone-900">
        <svg
          className="absolute inset-0 h-full w-full opacity-15"
          viewBox="0 0 400 180"
          preserveAspectRatio="xMidYMid slice"
        >
          <path
            d="M80 180 Q80 60 200 60 Q320 60 320 180"
            fill="none"
            stroke="hsl(32 46% 51%)"
            strokeWidth="1.5"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="flex flex-col items-center px-6 py-8 text-center">
        {/* Icon */}
        <div className="relative mb-6">
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-stone-100 to-amber-50 dark:from-stone-800 dark:to-stone-900 border-2 border-border">
            <HourglassIcon className="h-12 w-12 text-muted-foreground stroke-[1.2]" />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-hotel-red text-white shadow-sm">
            <XCircle className="h-4 w-4" />
          </span>
        </div>

        <h1 className="font-serif text-3xl font-medium leading-tight">
          Срок доступа<br />завершён.
        </h1>
        <p className="mt-4 text-muted-foreground leading-relaxed max-w-xs">
          Если вы продлили проживание, обратитесь к администратору на ресепшене.
        </p>

        {/* Badges */}
        <div className="mt-6 flex flex-wrap gap-2 justify-center">
          <Badge variant="outline" className="border-hotel-red/40 text-hotel-red">
            Срок проживания истёк
          </Badge>
          <Badge variant="outline" className="border-border">
            <Lock className="h-3 w-3" />
            Доступ запрещён
          </Badge>
        </div>

        {/* Actions */}
        <div className="mt-8 w-full space-y-3">
          <Button
            size="lg"
            className="w-full"
            asChild
          >
            <a href="tel:+78001234567">
              <Phone className="h-4 w-4" />
              Позвонить администратору
            </a>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            asChild
          >
            <Link href="/guest/register">
              Вернуться на главную
            </Link>
          </Button>
        </div>
      </div>
    </MobileShell>
  );
}

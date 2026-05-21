"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ConciergeBell, Clock, XCircle, Loader2 } from "lucide-react";
import { MobileShell } from "@/components/hotel/mobile-shell";
import { HotelLogo } from "@/components/hotel/hotel-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import Link from "next/link";

type Status = "pending" | "approved" | "rejected" | "checking";

function PendingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId");
  const [status, setStatus] = useState<Status>("pending");

  useEffect(() => {
    if (!requestId) {
      router.push("/guest/register");
      return;
    }

    let stopped = false;

    async function poll() {
      if (stopped) return;
      try {
        const res = await fetch(
          `/api/guest/request-status?requestId=${requestId}`,
          { cache: "no-store" }
        );
        const data = (await res.json()) as { status: string };

        if (data.status === "approved") {
          toast.success("Заявка одобрена!", {
            description: "Добро пожаловать в отель Рейхан!",
          });
          router.push("/guest/welcome");
          return;
        }

        if (data.status === "rejected") {
          setStatus("rejected");
          return;
        }
      } catch {
        // network error — keep polling
      }

      if (!stopped) {
        setTimeout(poll, 3000);
      }
    }

    // Start polling immediately
    poll();

    return () => {
      stopped = true;
    };
  }, [requestId, router]);

  return (
    <MobileShell>
      <div className="flex min-h-screen flex-col">
        {/* Header */}
        <div className="flex justify-center px-6 py-5">
          <HotelLogo size="md" />
        </div>

        {/* Hero */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 text-center">
          {/* Icon */}
          <div className="relative mb-6">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-amber-50 to-stone-100 dark:from-stone-800 dark:to-stone-900 border-2 border-border">
              {status === "rejected" ? (
                <XCircle className="h-12 w-12 text-hotel-red" />
              ) : (
                <ConciergeBell className="h-12 w-12 text-gold stroke-[1.2]" />
              )}
            </div>

            {status === "pending" && (
              <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full gold-gradient shadow-sm">
                <Clock className="h-4 w-4 text-white" />
              </span>
            )}
          </div>

          {status === "rejected" ? (
            <>
              <h1 className="font-serif text-3xl font-medium">
                Заявка отклонена.
              </h1>
              <p className="mt-3 text-muted-foreground leading-relaxed max-w-xs">
                Пожалуйста, обратитесь к администратору на ресепшене.
              </p>
              <Badge variant="destructive" className="mt-6">
                <XCircle className="h-3.5 w-3.5" />
                Заявка отклонена
              </Badge>
              <Button
                variant="outline"
                size="lg"
                className="mt-8 w-full"
                asChild
              >
                <Link href="/guest/register">Попробовать снова</Link>
              </Button>
            </>
          ) : (
            <>
              <h1 className="font-serif text-3xl font-medium leading-tight">
                Заявка отправлена.
              </h1>
              <p className="mt-3 text-muted-foreground leading-relaxed max-w-xs">
                Ожидайте подтверждения администратора. Страница обновляется
                автоматически.
              </p>

              {/* Status card */}
              <div className="mt-8 w-full hotel-card px-5 py-4 flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 flex-shrink-0">
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-medium text-sm">
                    Ожидает подтверждения
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Проверка каждые 3 секунды
                  </div>
                </div>
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground flex-shrink-0" />
              </div>

              {/* Dots animation */}
              <div className="mt-8 flex gap-2">
                {[0, 0.2, 0.4].map((delay, i) => (
                  <div
                    key={i}
                    className="h-2 w-2 rounded-full bg-gold/60 animate-bounce"
                    style={{ animationDelay: `${delay}s` }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </MobileShell>
  );
}

export default function GuestPendingPage() {
  return (
    <Suspense
      fallback={
        <MobileShell>
          <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
          </div>
        </MobileShell>
      }
    >
      <PendingContent />
    </Suspense>
  );
}

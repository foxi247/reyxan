"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Tv2 } from "lucide-react";

export function TvConnectButton() {
  const [savedRoom, setSavedRoom] = useState<string | null>(null);

  useEffect(() => {
    const room = localStorage.getItem("reyxan_tv_room_number");
    setSavedRoom(room);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
      <Link
        href="/tv/connect"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-border hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
      >
        <Tv2 className="h-4 w-4" />
        Подключить телевизор
      </Link>

      {savedRoom && (
        <Link
          href={`/tv/room/${savedRoom}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border-2 border-amber-400/40 text-amber-600 dark:text-amber-400 hover:bg-amber-400/10 transition-colors"
        >
          <Tv2 className="h-4 w-4" />
          Открыть TV · Номер {savedRoom}
        </Link>
      )}
    </div>
  );
}

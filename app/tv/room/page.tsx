"use client";

import { useEffect, useState } from "react";
import { TvDisplay } from "./[roomNumber]/tv-display";

// This page is STATIC (served from CDN edge, zero cold-start).
// Room number comes from localStorage set by /tv/connect.
export default function TvRoomStaticPage() {
  const [roomNumber, setRoomNumber] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const n = localStorage.getItem("reyxan_tv_room_number");
    if (!n) {
      window.location.replace("/tv/connect");
      return;
    }
    setRoomNumber(n);
    setReady(true);
  }, []);

  if (!ready || !roomNumber) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  return <TvDisplay roomNumber={roomNumber} />;
}

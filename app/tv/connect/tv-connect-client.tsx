"use client";

import { useEffect, useState } from "react";
import { Tv2, BedDouble, Loader2 } from "lucide-react";

type RoomStatus = "available" | "occupied" | "maintenance";

const STATUS_CONFIG: Record<RoomStatus, { label: string; dot: string }> = {
  available:   { label: "Свободен",     dot: "bg-emerald-400" },
  occupied:    { label: "Занят",        dot: "bg-amber-400"   },
  maintenance: { label: "Обслуживание", dot: "bg-red-400"     },
};

interface Room {
  id: string;
  number: string;
  floor: number | null;
  status: RoomStatus;
}

export function ClientPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFetchError(true);
      setLoading(false);
    }, 8000);

    fetch("/api/tv/rooms")
      .then((r) => r.json())
      .then(({ rooms: data }) => {
        clearTimeout(timer);
        setRooms(data ?? []);
        setLoading(false);
      })
      .catch(() => {
        clearTimeout(timer);
        setFetchError(true);
        setLoading(false);
      });

    return () => clearTimeout(timer);
  }, []);

  const handleConnect = (roomNumber: string) => {
    try { localStorage.setItem("reyxan_tv_room_number", roomNumber); } catch { /* ignore */ }
    window.location.href = "/tv/room";
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">

      {/* Header */}
      <div className="flex flex-col items-center justify-center pt-16 pb-10 px-8 text-center">
        <div className="flex items-center gap-3 mb-6">
          <Tv2 className="h-10 w-10 text-amber-400" />
          <span className="font-serif text-4xl font-light tracking-wide">Reyhan Hotel</span>
        </div>
        <h1 className="text-5xl font-serif font-light mb-4">Подключение телевизора</h1>
        <p className="text-xl text-white/50 max-w-lg leading-relaxed">
          Выберите номер, к которому подключён этот телевизор
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-8 pb-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-white/40">
            <Loader2 className="h-12 w-12 animate-spin" />
            <p className="text-xl">Загрузка номеров…</p>
          </div>

        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center h-64 gap-6 text-center">
            <p className="text-2xl text-white/50">Не удалось загрузить список номеров</p>
            <button
              onClick={() => window.location.reload()}
              className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xl transition-colors"
            >
              Попробовать снова
            </button>
          </div>

        ) : rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-white/30 gap-4">
            <BedDouble className="h-16 w-16" />
            <p className="text-2xl">Нет доступных номеров</p>
          </div>

        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {rooms.map((room) => {
              const st = STATUS_CONFIG[room.status];
              return (
                <button
                  key={room.id}
                  onClick={() => handleConnect(room.number)}
                  className="
                    group flex flex-col gap-4 p-6 rounded-3xl
                    bg-white/5 border-2 border-white/10
                    hover:bg-amber-400/10 hover:border-amber-400/50
                    focus:bg-amber-400/10 focus:border-amber-400/70
                    active:scale-95 active:bg-amber-400/20
                    transition-all duration-150 text-left
                    outline-none focus:ring-4 focus:ring-amber-400/30
                    cursor-pointer
                  "
                >
                  <div className="font-serif text-7xl font-light leading-none text-white/90 group-hover:text-amber-300 group-focus:text-amber-300 transition-colors">
                    {room.number}
                  </div>

                  {room.floor ? (
                    <div className="text-base text-white/30">{room.floor} этаж</div>
                  ) : null}

                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full flex-shrink-0 ${st.dot}`} />
                    <span className="text-base text-white/50">{st.label}</span>
                  </div>

                  <div className="mt-auto pt-2 text-base font-medium text-amber-400 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                    Подключить →
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { Tv2, BedDouble } from "lucide-react";

type RoomStatus = "available" | "occupied" | "maintenance";

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  available:   { label: "Свободен",     dot: "bg-emerald-400" },
  occupied:    { label: "Занят",        dot: "bg-amber-400"   },
  maintenance: { label: "Обслуживание", dot: "bg-red-400"     },
};

interface Room {
  id: string;
  number: string;
  floor: number | null;
  status: string;
}

export function TvConnectClient({ rooms }: { rooms: Room[] }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">

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

      <div className="flex-1 max-w-5xl mx-auto w-full px-8 pb-16">
        {rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-white/30 gap-4">
            <BedDouble className="h-16 w-16" />
            <p className="text-2xl">Нет доступных номеров</p>
            <p className="text-lg">Добавьте номера в админ-панели</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {rooms.map((room) => {
              const st = STATUS_CONFIG[room.status] ?? STATUS_CONFIG.available;
              return (
                /* Plain <a href> — works without any JavaScript */
                <a
                  key={room.id}
                  href={`/tv/room/${room.number}`}
                  className="
                    flex flex-col gap-4 p-6 rounded-3xl no-underline
                    bg-white/5 border-2 border-white/10
                    hover:bg-amber-400/10 hover:border-amber-400/50
                    focus:bg-amber-400/10 focus:border-amber-400/70
                    active:bg-amber-400/20
                    transition-all duration-150
                    outline-none focus:ring-4 focus:ring-amber-400/30
                  "
                >
                  <div className="font-serif text-7xl font-light leading-none text-white/90">
                    {room.number}
                  </div>

                  {room.floor ? (
                    <div className="text-base text-white/30">{room.floor} этаж</div>
                  ) : null}

                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full flex-shrink-0 ${st.dot}`} />
                    <span className="text-base text-white/50">{st.label}</span>
                  </div>

                  <div className="mt-auto pt-2 text-base font-medium text-amber-400">
                    Подключить →
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


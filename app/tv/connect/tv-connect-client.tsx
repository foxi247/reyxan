"use client";

import { useRouter } from "next/navigation";
import { Tv2, BedDouble, Sparkles } from "lucide-react";

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
  theme_name: string | null;
}

export function TvConnectClient({ rooms }: { rooms: Room[] }) {
  const router = useRouter();

  const handleConnect = (roomNumber: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("reyxan_tv_room_number", roomNumber);
    }
    router.push(`/tv/room/${roomNumber}`);
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

      {/* Room grid */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-8 pb-16">
        {rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-white/30 gap-4">
            <BedDouble className="h-16 w-16" />
            <p className="text-2xl">Номера не найдены</p>
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
                    bg-white/5 border border-white/10
                    hover:bg-amber-400/10 hover:border-amber-400/40
                    active:scale-95
                    transition-all duration-150 text-left
                    focus:outline-none focus:ring-2 focus:ring-amber-400/60
                  "
                >
                  {/* Room number */}
                  <div className="font-serif text-6xl font-light leading-none text-white/90 group-hover:text-amber-300 transition-colors">
                    {room.number}
                  </div>

                  {/* Theme name */}
                  {room.theme_name ? (
                    <div className="flex items-center gap-1.5 text-sm text-amber-400/80">
                      <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="leading-snug">{room.theme_name}</span>
                    </div>
                  ) : (
                    room.floor && (
                      <div className="text-sm text-white/30">{room.floor} этаж</div>
                    )
                  )}

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${st.dot}`} />
                    <span className="text-sm text-white/50">{st.label}</span>
                  </div>

                  {/* Connect label */}
                  <div className="mt-auto pt-2 text-sm font-medium text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
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

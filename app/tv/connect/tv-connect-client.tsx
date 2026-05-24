"use client";

import { useState } from "react";
import { Tv2 } from "lucide-react";

export function ClientPage() {
  const [roomNumber, setRoomNumber] = useState("");
  const [error, setError] = useState("");

  const handleConnect = () => {
    const n = roomNumber.trim();
    if (!n) { setError("Введите номер комнаты"); return; }
    try { localStorage.setItem("reyxan_tv_room_number", n); } catch { /* ignore */ }
    window.location.href = "/tv/room";
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleConnect();
  };

  const appendDigit = (d: string) => {
    setError("");
    setRoomNumber((prev) => (prev.length < 4 ? prev + d : prev));
  };

  const deleteLast = () => {
    setError("");
    setRoomNumber((prev) => prev.slice(0, -1));
  };

  const DIGITS = ["1","2","3","4","5","6","7","8","9","0"];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center px-8 gap-10">

      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Tv2 className="h-10 w-10 text-amber-400" />
          <span className="font-serif text-4xl font-light">Reyhan Hotel</span>
        </div>
        <h1 className="text-5xl font-serif font-light mb-3">Подключение телевизора</h1>
        <p className="text-xl text-white/50">Введите номер вашей комнаты</p>
      </div>

      {/* Display */}
      <div className="w-full max-w-sm">
        <div className="bg-white/5 border-2 border-white/20 rounded-3xl px-8 py-6 text-center mb-4">
          <span className="font-serif text-8xl font-light tracking-widest text-white">
            {roomNumber || <span className="text-white/20">—</span>}
          </span>
        </div>
        {error && (
          <p className="text-center text-red-400 text-lg mb-2">{error}</p>
        )}

        {/* Hidden text input (for TV keyboard) */}
        <input
          type="number"
          inputMode="numeric"
          value={roomNumber}
          onChange={(e) => { setError(""); setRoomNumber(e.target.value.slice(0, 4)); }}
          onKeyDown={handleKey}
          placeholder="Номер комнаты"
          className="w-full bg-white/5 border border-white/20 rounded-2xl px-5 py-4 text-2xl text-center text-white placeholder:text-white/30 outline-none focus:border-amber-400/60 mb-6"
          autoFocus
        />

        {/* On-screen numpad (for TV remote) */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {DIGITS.map((d) => (
            <button
              key={d}
              onClick={() => appendDigit(d)}
              className="bg-white/8 hover:bg-white/15 active:bg-amber-400/30 border border-white/10 rounded-2xl py-5 text-3xl font-light transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            >
              {d}
            </button>
          ))}
          <button
            onClick={deleteLast}
            className="bg-white/5 hover:bg-white/10 active:bg-red-400/20 border border-white/10 rounded-2xl py-5 text-2xl transition-colors focus:outline-none focus:ring-2 focus:ring-white/30 col-span-2"
          >
            ← Стереть
          </button>
        </div>

        {/* Connect button */}
        <button
          onClick={handleConnect}
          className="w-full bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-semibold text-2xl rounded-2xl py-5 transition-colors focus:outline-none focus:ring-4 focus:ring-amber-400/50"
        >
          Подключить →
        </button>
      </div>
    </div>
  );
}

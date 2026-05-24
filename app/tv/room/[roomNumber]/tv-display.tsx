"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type TvState = "idle" | "welcome" | "intro_video" | "guest_panel" | "checkout_message" | "session_closing";

interface TvData {
  room: {
    number: string;
    floor: number | null;
    theme_name: string | null;
    theme_video_url: string | null;
    theme_video_duration_seconds: number;
    tv_background_url: string | null;
  };
  state: TvState;
  stay: {
    id: string;
    check_in: string;
    check_out_scheduled: string;
    tv_state_updated_at: string;
  } | null;
  primaryGuest: { first_name: string; last_name: string } | null;
  allGuests: { first_name: string; last_name: string }[];
  qrUrl: string | null;
  hotelName: string;
}

// ---------------------------------------------------------------------------
// Timing constants (ms)
// ---------------------------------------------------------------------------
const WELCOME_DURATION = 3 * 60 * 1000;        // 3 min
const CHECKOUT_MSG_DURATION = 30 * 1000;        // 30 s
const SESSION_CLOSING_DURATION = 10 * 1000;     // 10 s

// ---------------------------------------------------------------------------
// Clock
// ---------------------------------------------------------------------------
function Clock() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }));
      setDate(
        now.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-right">
      <div className="text-6xl font-light tracking-tight">{time}</div>
      <div className="text-xl text-white/60 mt-1 capitalize">{date}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Idle screen
// ---------------------------------------------------------------------------
function IdleScreen({ hotelName, bgUrl }: { hotelName: string; bgUrl?: string | null }) {
  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-center gap-8"
      style={bgUrl ? { backgroundImage: `url(${bgUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
    >
      {bgUrl && <div className="absolute inset-0 bg-black/50" />}
      <div className="relative z-10 text-center">
        <div className="text-8xl font-serif font-light tracking-widest mb-4">✦</div>
        <div className="text-5xl font-serif font-light tracking-wide">{hotelName}</div>
        <div className="text-xl text-white/50 mt-4 tracking-widest uppercase">Добро пожаловать</div>
      </div>
      <div className="relative z-10 absolute bottom-12">
        <Clock />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Welcome screen
// ---------------------------------------------------------------------------
function WelcomeScreen({
  data, timeLeft,
}: {
  data: TvData;
  timeLeft: number; // ms remaining
}) {
  const guest = data.primaryGuest;
  const checkOut = data.stay
    ? new Date(data.stay.check_out_scheduled).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })
    : "";
  const secLeft = Math.max(0, Math.round(timeLeft / 1000));

  return (
    <div
      className="relative w-full h-full flex"
      style={
        data.room.tv_background_url
          ? { backgroundImage: `url(${data.room.tv_background_url})`, backgroundSize: "cover", backgroundPosition: "center" }
          : {}
      }
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />

      {/* Left content */}
      <div className="relative z-10 flex flex-col justify-center pl-20 pr-8 flex-1">
        <div className="text-white/50 text-2xl tracking-widest uppercase mb-4">
          {data.hotelName}
        </div>
        <h1 className="text-7xl font-serif font-light leading-tight mb-6">
          Добро пожаловать,
          <br />
          <span className="text-amber-300">{guest?.first_name ?? "Уважаемый гость"}</span>!
        </h1>
        {data.allGuests.length > 1 && (
          <p className="text-xl text-white/60 mb-6">
            {data.allGuests.slice(1).map((g) => `${g.first_name} ${g.last_name}`).join(", ")}
          </p>
        )}
        <div className="flex gap-8 text-lg text-white/70">
          <div>
            <div className="text-white/40 text-sm uppercase tracking-wider mb-1">Номер</div>
            <div className="text-3xl font-serif">{data.room.number}</div>
          </div>
          {data.room.floor && (
            <div>
              <div className="text-white/40 text-sm uppercase tracking-wider mb-1">Этаж</div>
              <div className="text-3xl font-serif">{data.room.floor}</div>
            </div>
          )}
          <div>
            <div className="text-white/40 text-sm uppercase tracking-wider mb-1">Выезд</div>
            <div className="text-2xl font-serif">{checkOut}</div>
          </div>
        </div>
      </div>

      {/* Right: QR code */}
      {data.qrUrl && (
        <div className="relative z-10 flex flex-col items-center justify-center pr-20 pl-8">
          <div className="bg-white rounded-3xl p-6 shadow-2xl">
            <QRCodeSVG value={data.qrUrl} size={220} level="M" />
          </div>
          <p className="text-white/70 text-center mt-5 text-lg max-w-[240px] leading-snug">
            Сканируйте для доступа к сервисам отеля
          </p>
          {secLeft > 0 && (
            <p className="text-white/30 text-sm mt-2">
              Переход через {secLeft} сек.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Intro video screen
// ---------------------------------------------------------------------------
function IntroVideoScreen({
  videoUrl, onEnded,
}: {
  videoUrl: string;
  onEnded: () => void;
}) {
  return (
    <div className="w-full h-full bg-black">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        src={videoUrl}
        className="w-full h-full object-cover"
        autoPlay
        muted={false}
        onEnded={onEnded}
        onError={onEnded}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Guest panel
// ---------------------------------------------------------------------------
const SERVICES = [
  { icon: "🍽️", label: "Ресторан", sub: "6:00 – 22:00" },
  { icon: "🧹", label: "Уборка", sub: "По запросу" },
  { icon: "🛎️", label: "Консьерж", sub: "Круглосуточно" },
  { icon: "🚗", label: "Такси", sub: "Вызов на ресепшене" },
  { icon: "💆", label: "СПА", sub: "9:00 – 21:00" },
  { icon: "🏊", label: "Бассейн", sub: "8:00 – 22:00" },
];

function GuestPanelScreen({ data }: { data: TvData }) {
  return (
    <div
      className="relative w-full h-full flex flex-col"
      style={
        data.room.tv_background_url
          ? { backgroundImage: `url(${data.room.tv_background_url})`, backgroundSize: "cover", backgroundPosition: "center" }
          : {}
      }
    >
      <div className="absolute inset-0 bg-black/70" />

      <div className="relative z-10 flex flex-col h-full p-16">
        {/* Header */}
        <div className="flex items-start justify-between mb-12">
          <div>
            <div className="text-white/40 text-lg tracking-widest uppercase">{data.hotelName}</div>
            <div className="text-4xl font-serif mt-2">
              Номер {data.room.number}
              {data.primaryGuest && (
                <span className="text-white/60 text-2xl ml-4">
                  · {data.primaryGuest.first_name} {data.primaryGuest.last_name}
                </span>
              )}
            </div>
          </div>
          <Clock />
        </div>

        {/* Services grid */}
        <div className="grid grid-cols-3 gap-5 flex-1">
          {SERVICES.map((s) => (
            <div
              key={s.label}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 flex flex-col gap-3 border border-white/10"
            >
              <div className="text-5xl">{s.icon}</div>
              <div className="text-2xl font-medium">{s.label}</div>
              <div className="text-white/50 text-lg">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-white/30 text-lg">
          Свяжитесь с ресепшеном · 📞 101
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Checkout / farewell screen
// ---------------------------------------------------------------------------
function CheckoutScreen({ data, timeLeft }: { data: TvData; timeLeft: number }) {
  const secLeft = Math.max(0, Math.round(timeLeft / 1000));
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-center gap-8 px-20">
      <div className="text-9xl">🌟</div>
      <h1 className="text-7xl font-serif font-light leading-tight">
        Спасибо за ваш выбор,
        <br />
        <span className="text-amber-300">{data.primaryGuest?.first_name ?? "дорогой гость"}</span>!
      </h1>
      <p className="text-2xl text-white/60 max-w-2xl leading-relaxed">
        Надеемся, что ваше пребывание было комфортным. Ждём вас снова в&nbsp;{data.hotelName}!
      </p>
      {secLeft > 0 && (
        <p className="text-white/30 text-lg mt-4">
          Комната освобождается через {secLeft} сек.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Session closing screen
// ---------------------------------------------------------------------------
function SessionClosingScreen({ timeLeft }: { timeLeft: number }) {
  const secLeft = Math.max(0, Math.round(timeLeft / 1000));
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-center gap-6">
      <div className="text-7xl animate-pulse">🧹</div>
      <p className="text-3xl text-white/50">Подготовка номера…</p>
      {secLeft > 0 && (
        <p className="text-white/20 text-xl">{secLeft} сек.</p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main TvDisplay
// ---------------------------------------------------------------------------
export function TvDisplay({ roomNumber }: { roomNumber: string }) {
  const [data, setData] = useState<TvData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stateEntered, setStateEntered] = useState<number>(Date.now());
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const advancingRef = useRef(false);

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/tv/room/${roomNumber}`, { cache: "no-store" });
      if (!res.ok) { setError("Номер не найден"); return; }
      const json = await res.json() as TvData;
      setData((prev) => {
        if (prev?.state !== json.state || prev?.stay?.id !== json.stay?.id) {
          setStateEntered(
            json.stay?.tv_state_updated_at
              ? new Date(json.stay.tv_state_updated_at).getTime()
              : Date.now()
          );
          advancingRef.current = false;
        }
        return json;
      });
    } catch {
      // network error — keep showing last state
    }
  }, [roomNumber]);

  // Poll every 5s
  useEffect(() => {
    fetchState();
    const id = setInterval(fetchState, 5000);
    return () => clearInterval(id);
  }, [fetchState]);

  // Determine state duration limit
  const stateDuration = data
    ? data.state === "welcome"
      ? WELCOME_DURATION
      : data.state === "checkout_message"
      ? CHECKOUT_MSG_DURATION
      : data.state === "session_closing"
      ? SESSION_CLOSING_DURATION
      : 0
    : 0;

  // Countdown timer
  useEffect(() => {
    if (!stateDuration) return;
    const id = setInterval(() => {
      const elapsed = Date.now() - stateEntered;
      const left = Math.max(0, stateDuration - elapsed);
      setTimeLeft(left);
    }, 500);
    return () => clearInterval(id);
  }, [stateEntered, stateDuration]);

  // Auto-advance when timer expires
  useEffect(() => {
    if (!data?.stay || !stateDuration || advancingRef.current) return;
    const elapsed = Date.now() - stateEntered;
    if (elapsed < stateDuration) return;

    advancingRef.current = true;

    const getNext = (): string | null => {
      if (data.state === "welcome") {
        return data.room.theme_video_url ? "intro_video" : "guest_panel";
      }
      if (data.state === "checkout_message") return "session_closing";
      if (data.state === "session_closing") return "idle";
      return null;
    };

    const next = getNext();
    if (!next) return;

    fetch(`/api/tv/room/${roomNumber}/advance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stayId: data.stay.id, fromState: data.state, toState: next }),
    }).then(() => fetchState());
  });

  if (error) {
    return (
      <div className="w-screen h-screen bg-black flex flex-col items-center justify-center gap-8 text-white">
        <div className="text-5xl">📺</div>
        <p className="text-3xl text-white/60">{error}</p>
        <button
          onClick={() => { localStorage.removeItem("reyxan_tv_room_number"); window.location.href = "/tv/connect"; }}
          className="px-8 py-4 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xl hover:bg-amber-400/30 transition-colors"
        >
          Выбрать другой номер
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-screen h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  const handleVideoEnded = () => {
    if (!data.stay || advancingRef.current) return;
    advancingRef.current = true;
    fetch(`/api/tv/room/${roomNumber}/advance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stayId: data.stay.id, fromState: "intro_video", toState: "guest_panel" }),
    }).then(() => fetchState());
  };

  const handleChangeRoom = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("reyxan_tv_room_number");
    }
    window.location.href = "/tv/connect";
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-black text-white font-sans select-none relative">
      {data.state === "idle" && (
        <IdleScreen hotelName={data.hotelName} bgUrl={data.room.tv_background_url} />
      )}
      {data.state === "welcome" && (
        <WelcomeScreen data={data} timeLeft={timeLeft} />
      )}
      {data.state === "intro_video" && data.room.theme_video_url && (
        <IntroVideoScreen videoUrl={data.room.theme_video_url} onEnded={handleVideoEnded} />
      )}
      {(data.state === "intro_video" && !data.room.theme_video_url) && (
        <GuestPanelScreen data={data} />
      )}
      {data.state === "guest_panel" && (
        <GuestPanelScreen data={data} />
      )}
      {data.state === "checkout_message" && (
        <CheckoutScreen data={data} timeLeft={timeLeft} />
      )}
      {data.state === "session_closing" && (
        <SessionClosingScreen timeLeft={timeLeft} />
      )}

      {/* Change room button — always visible in corner */}
      <button
        onClick={handleChangeRoom}
        className="absolute bottom-5 right-5 z-50 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-white/30 hover:text-white/70 text-sm transition-all duration-200"
      >
        Сменить номер
      </button>
    </div>
  );
}

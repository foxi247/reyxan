import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";

export const revalidate = 8;

interface Guest { first_name: string; last_name: string; is_primary: boolean }

function Clock() {
  const now = new Date();
  const time = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow" });
  const date = now.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Moscow" });
  return (
    <div className="text-right">
      <div className="text-6xl font-light">{time}</div>
      <div className="text-xl text-white/50 mt-1 capitalize">{date}</div>
    </div>
  );
}

function IdleScreen({ hotelName, roomNumber }: { hotelName: string; roomNumber: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-slate-950">
      <div className="text-7xl font-serif font-light tracking-widest text-white/20">✦</div>
      <div className="text-6xl font-serif font-light text-white">{hotelName}</div>
      <div className="text-2xl text-white/30 tracking-widest uppercase mt-2">Добро пожаловать</div>
      <div className="absolute bottom-8 right-10 opacity-30 text-white text-sm">Номер {roomNumber}</div>
    </div>
  );
}

function WelcomeScreen({ hotelName, roomNumber, guest, checkOut, qrUrl }: {
  hotelName: string; roomNumber: string;
  guest: Guest | null; checkOut: string | null; qrUrl: string | null;
}) {
  const checkOutFmt = checkOut
    ? new Date(checkOut).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })
    : null;

  return (
    <div className="w-full h-full flex bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Left */}
      <div className="flex-1 flex flex-col justify-center pl-20 pr-10">
        <div className="text-white/40 text-xl tracking-widest uppercase mb-6">{hotelName}</div>
        <h1 className="text-7xl font-serif font-light leading-tight mb-6">
          Добро пожаловать,<br />
          <span className="text-amber-300">{guest?.first_name ?? "Дорогой гость"}</span>!
        </h1>
        <div className="flex gap-10 text-white/60 text-lg mt-4">
          <div>
            <div className="text-white/30 text-sm uppercase tracking-wider mb-1">Номер</div>
            <div className="text-4xl font-serif text-white">{roomNumber}</div>
          </div>
          {checkOutFmt && (
            <div>
              <div className="text-white/30 text-sm uppercase tracking-wider mb-1">Выезд</div>
              <div className="text-3xl font-serif text-white">{checkOutFmt}</div>
            </div>
          )}
        </div>
      </div>
      {/* Right — QR */}
      {qrUrl && (
        <div className="flex flex-col items-center justify-center pr-20 pl-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrUrl)}`}
            alt="QR"
            width={220}
            height={220}
            className="rounded-2xl bg-white p-3"
          />
          <p className="text-white/50 text-center mt-4 text-lg max-w-[240px] leading-snug">
            Сканируйте для доступа к сервисам
          </p>
        </div>
      )}
    </div>
  );
}

function GuestPanelScreen({ hotelName, roomNumber, guest }: {
  hotelName: string; roomNumber: string; guest: Guest | null;
}) {
  const SERVICES = [
    { icon: "🍽️", label: "Ресторан",    sub: "6:00 – 22:00" },
    { icon: "🧹", label: "Уборка",      sub: "По запросу" },
    { icon: "🛎️", label: "Консьерж",    sub: "Круглосуточно" },
    { icon: "🚗", label: "Такси",       sub: "На ресепшене" },
    { icon: "💆", label: "СПА",         sub: "9:00 – 21:00" },
    { icon: "☎️", label: "Ресепшен",    sub: "📞 101" },
  ];
  return (
    <div className="w-full h-full flex flex-col bg-slate-900 p-16">
      <div className="flex items-start justify-between mb-12">
        <div>
          <div className="text-white/30 text-lg tracking-widest uppercase">{hotelName}</div>
          <div className="text-4xl font-serif mt-2">
            Номер {roomNumber}
            {guest && <span className="text-white/50 text-2xl ml-4">· {guest.first_name} {guest.last_name}</span>}
          </div>
        </div>
        <Clock />
      </div>
      <div className="grid grid-cols-3 gap-5 flex-1">
        {SERVICES.map((s) => (
          <div key={s.label} className="bg-white/5 rounded-2xl p-6 flex flex-col gap-3 border border-white/10">
            <div className="text-5xl">{s.icon}</div>
            <div className="text-2xl font-medium">{s.label}</div>
            <div className="text-white/40 text-lg">{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CheckoutScreen({ guest }: { guest: Guest | null }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-center gap-8 px-20">
      <div className="text-8xl">🌟</div>
      <h1 className="text-7xl font-serif font-light leading-tight">
        Спасибо,<br />
        <span className="text-amber-300">{guest?.first_name ?? "дорогой гость"}</span>!
      </h1>
      <p className="text-2xl text-white/50 max-w-xl">Ждём вас снова. Хорошей дороги!</p>
    </div>
  );
}

function ChangeRoomLink({ roomNumber }: { roomNumber: string }) {
  return (
    <a
      href="/tv/connect"
      className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/20 hover:text-white/50 text-sm transition-colors no-underline"
    >
      Сменить номер
    </a>
  );
}

export default async function TvRoomPage({
  params,
}: {
  params: Promise<{ roomNumber: string }>;
}) {
  const { roomNumber } = await params;
  const supabase = createAdminClient();

  const { data: room } = await supabase
    .from("rooms").select("*").eq("number", roomNumber).maybeSingle();

  if (!room) {
    return (
      <div className="w-screen h-screen bg-black flex flex-col items-center justify-center gap-8 text-white">
        <p className="text-4xl text-white/40">Номер {roomNumber} не найден</p>
        <a href="/tv/connect" className="px-8 py-4 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xl no-underline">
          Выбрать номер
        </a>
      </div>
    );
  }

  let state = "idle";
  let primaryGuest: Guest | null = null;
  let checkOut: string | null = null;
  let accessToken: string | null = null;

  try {
    const { data: stay } = await supabase
      .from("stays").select("id, tv_state, check_out_scheduled, access_token")
      .eq("room_id", room.id).eq("status", "active").maybeSingle();

    if (stay) {
      state = stay.tv_state ?? "idle";
      checkOut = stay.check_out_scheduled ?? null;
      accessToken = stay.access_token ?? null;

      const { data: guests } = await supabase
        .from("stay_guests").select("first_name, last_name, is_primary")
        .eq("stay_id", stay.id);
      const list = (guests ?? []) as Guest[];
      primaryGuest = list.find((g) => g.is_primary) ?? list[0] ?? null;
    }
  } catch { /* stays table may not exist yet */ }

  const { data: settings } = await supabase
    .from("hotel_settings").select("hotel_name").limit(1).maybeSingle();
  const hotelName = (settings?.hotel_name as string | null) ?? "Reyhan Hotel";

  let qrUrl: string | null = null;
  if (state === "welcome" && accessToken) {
    const hdrs = await headers();
    const host = hdrs.get("host") ?? "reyxan.vercel.app";
    qrUrl = `https://${host}/guest/access?token=${accessToken}`;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white font-sans select-none">
      {/* Reload every 8 seconds — simplest possible JS, works on any browser */}
      {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
      <script dangerouslySetInnerHTML={{ __html: "setTimeout(function(){location.reload();},8000);" }} />

      {(state === "idle") && (
        <IdleScreen hotelName={hotelName} roomNumber={roomNumber} />
      )}
      {(state === "welcome") && (
        <WelcomeScreen hotelName={hotelName} roomNumber={roomNumber} guest={primaryGuest} checkOut={checkOut} qrUrl={qrUrl} />
      )}
      {(state === "intro_video" || state === "guest_panel") && (
        <GuestPanelScreen hotelName={hotelName} roomNumber={roomNumber} guest={primaryGuest} />
      )}
      {(state === "checkout_message" || state === "session_closing") && (
        <CheckoutScreen guest={primaryGuest} />
      )}

      <ChangeRoomLink roomNumber={roomNumber} />
    </div>
  );
}

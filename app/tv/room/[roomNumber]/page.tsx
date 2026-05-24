import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";

export const revalidate = 8;

interface Guest { first_name: string; last_name: string; is_primary: boolean }

function Ornament({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className="text-amber-400">
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * 45 * Math.PI) / 180;
        return (
          <line key={i}
            x1={14 + 4 * Math.cos(a)} y1={14 + 4 * Math.sin(a)}
            x2={14 + 11 * Math.cos(a)} y2={14 + 11 * Math.sin(a)}
            stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"
          />
        );
      })}
      <circle cx="14" cy="14" r="3" fill="currentColor" />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = ((i * 45 + 22.5) * Math.PI) / 180;
        return <circle key={i} cx={14 + 7.5 * Math.cos(a)} cy={14 + 7.5 * Math.sin(a)} r="0.8" fill="currentColor" />;
      })}
    </svg>
  );
}

function Stars() {
  return (
    <div className="flex gap-2">
      {[0,1,2,3,4].map(i => (
        <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-amber-400">
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
        </svg>
      ))}
    </div>
  );
}

function Clock() {
  const now = new Date();
  const time = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow" });
  const date = now.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Moscow" });
  return (
    <div className="text-right">
      <div className="text-6xl font-serif font-light text-white">{time}</div>
      <div className="text-lg text-white/40 mt-1 capitalize tracking-wide">{date}</div>
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-4 w-full max-w-xs">
      <div className="flex-1 h-px bg-amber-400/30" />
      <div className="text-amber-400/50 text-xs">✦</div>
      <div className="flex-1 h-px bg-amber-400/30" />
    </div>
  );
}

function IdleScreen({ hotelName, roomNumber }: { hotelName: string; roomNumber: string }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-8"
      style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(180,130,40,0.07) 0%, transparent 60%), #020209" }}
    >
      <Stars />
      <Ornament size={72} />

      <div className="flex flex-col items-center gap-3 mt-2">
        <div className="font-serif text-7xl font-light tracking-widest text-white leading-none">
          {hotelName}
        </div>
        <div className="tracking-[0.4em] text-sm uppercase text-white/30 font-light mt-1">
          Добро пожаловать
        </div>
      </div>

      <Divider />

      <p className="text-white/20 text-sm tracking-[0.3em] uppercase">
        Ожидание гостя
      </p>

      <div className="absolute bottom-8 right-10">
        <div className="text-white/15 text-sm tracking-widest uppercase">Номер {roomNumber}</div>
      </div>
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
    <div className="w-full h-full flex"
      style={{ background: "radial-gradient(ellipse at 20% 50%, rgba(180,130,40,0.08) 0%, transparent 55%), #020209" }}
    >
      {/* Left */}
      <div className="flex-1 flex flex-col justify-center pl-24 pr-12 gap-8">
        <div className="flex items-center gap-3">
          <Ornament size={32} />
          <span className="text-amber-400/60 text-lg tracking-widest uppercase font-light">{hotelName}</span>
        </div>

        <div>
          <p className="text-white/40 text-xl tracking-[0.25em] uppercase mb-5">Добро пожаловать</p>
          <h1 className="font-serif font-light leading-none text-white">
            <span className="text-8xl">{guest?.first_name ?? "Дорогой"}</span>
            <br />
            <span className="text-5xl text-white/45 mt-3 block">{guest?.last_name ?? "гость"}</span>
          </h1>
        </div>

        <div className="flex items-end gap-10 mt-2">
          <div>
            <div className="text-white/30 text-xs uppercase tracking-[0.2em] mb-2">Номер</div>
            <div className="font-serif text-5xl font-light text-amber-400">{roomNumber}</div>
          </div>
          {checkOutFmt && (
            <div>
              <div className="text-white/30 text-xs uppercase tracking-[0.2em] mb-2">Выезд</div>
              <div className="font-serif text-4xl font-light text-white">{checkOutFmt}</div>
            </div>
          )}
        </div>

        <Stars />

        <p className="text-white/30 text-lg leading-relaxed max-w-md">
          Желаем вам приятного пребывания. Мы здесь, чтобы сделать ваш отдых незабываемым.
        </p>
      </div>

      {/* Right — QR */}
      {qrUrl && (
        <div className="flex flex-col items-center justify-center pr-24 pl-10 gap-6">
          <div className="text-white/30 text-sm tracking-widest uppercase text-center mb-2">
            Доступ к сервисам
          </div>
          <div className="bg-white rounded-3xl p-4 shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrUrl)}&bgcolor=ffffff&color=0a0a0a&margin=0`}
              alt="QR"
              width={240}
              height={240}
              className="rounded-xl"
            />
          </div>
          <p className="text-white/40 text-center text-base max-w-[220px] leading-relaxed">
            Сканируйте камерой телефона
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
    <div className="w-full h-full flex flex-col p-14"
      style={{ background: "radial-gradient(ellipse at 80% 10%, rgba(180,130,40,0.05) 0%, transparent 50%), #020209" }}
    >
      <div className="flex items-start justify-between mb-8">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Ornament size={26} />
            <span className="text-amber-400/50 text-base tracking-widest uppercase">{hotelName}</span>
          </div>
          <div className="font-serif text-4xl font-light text-white mt-1">
            Номер {roomNumber}
            {guest && (
              <span className="text-white/30 text-2xl ml-5 font-serif">
                · {guest.first_name} {guest.last_name}
              </span>
            )}
          </div>
        </div>
        <Clock />
      </div>

      <div className="h-px bg-amber-400/10 mb-8" />

      <div className="grid grid-cols-3 gap-5 flex-1">
        {SERVICES.map((s) => (
          <div key={s.label}
            className="rounded-2xl p-7 flex flex-col gap-4 border border-white/[0.06]"
            style={{ background: "rgba(255,255,255,0.025)" }}
          >
            <div className="text-5xl">{s.icon}</div>
            <div className="text-2xl font-medium text-white">{s.label}</div>
            <div className="text-white/35 text-lg">{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CheckoutScreen({ hotelName, guest }: { hotelName: string; guest: Guest | null }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-10 text-center px-20"
      style={{ background: "radial-gradient(ellipse at 50% 60%, rgba(180,130,40,0.07) 0%, transparent 55%), #020209" }}
    >
      <Ornament size={80} />

      <div>
        <p className="text-white/35 text-xl tracking-[0.25em] uppercase mb-6">Спасибо за ваш выбор</p>
        <h1 className="font-serif font-light leading-none text-white">
          <span className="text-8xl">{guest?.first_name ?? "Дорогой"}</span>
          <br />
          <span className="text-5xl text-white/35 mt-3 block">{guest?.last_name ?? "гость"}</span>
        </h1>
      </div>

      <Divider />

      <p className="text-2xl text-white/45 max-w-lg leading-relaxed">
        Ждём вас снова. Хорошей дороги!
      </p>

      <Stars />

      <div className="text-white/20 text-sm tracking-[0.3em] uppercase">{hotelName}</div>
    </div>
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
      <div className="w-screen h-screen flex flex-col items-center justify-center gap-8 text-white"
        style={{ background: "#020209" }}
      >
        <Ornament size={64} />
        <p className="text-4xl text-white/30 font-serif font-light">Номер {roomNumber} не найден</p>
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
      {/* Refresh every 8 seconds */}
      {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
      <script dangerouslySetInnerHTML={{ __html: "setTimeout(function(){location.reload();},8000);" }} />

      {state === "idle" && (
        <IdleScreen hotelName={hotelName} roomNumber={roomNumber} />
      )}
      {state === "welcome" && (
        <WelcomeScreen hotelName={hotelName} roomNumber={roomNumber} guest={primaryGuest} checkOut={checkOut} qrUrl={qrUrl} />
      )}
      {(state === "intro_video" || state === "guest_panel") && (
        <GuestPanelScreen hotelName={hotelName} roomNumber={roomNumber} guest={primaryGuest} />
      )}
      {(state === "checkout_message" || state === "session_closing") && (
        <CheckoutScreen hotelName={hotelName} guest={primaryGuest} />
      )}
    </div>
  );
}

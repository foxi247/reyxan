import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import QRCode from "qrcode";

export const revalidate = 8;

interface Guest {
  first_name: string;
  last_name: string;
  is_primary: boolean;
}

const TV_CSS = `
  @keyframes tvFadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes tvFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes tvGlow {
    0%, 100% { opacity: .65; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.03); }
  }

  @keyframes tvFloat {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
  }

  .tv-fade-1 { animation: tvFadeUp .75s cubic-bezier(.22,1,.36,1) both .05s; }
  .tv-fade-2 { animation: tvFadeUp .75s cubic-bezier(.22,1,.36,1) both .18s; }
  .tv-fade-3 { animation: tvFadeUp .75s cubic-bezier(.22,1,.36,1) both .30s; }
  .tv-fade-4 { animation: tvFadeUp .75s cubic-bezier(.22,1,.36,1) both .42s; }
  .tv-fade-5 { animation: tvFadeUp .75s cubic-bezier(.22,1,.36,1) both .54s; }
  .tv-fade-in { animation: tvFadeIn 1.1s ease both; }
  .tv-glow { animation: tvGlow 4.2s ease-in-out infinite; }
  .tv-float { animation: tvFloat 4.4s ease-in-out infinite; }
`;

const TV_COLORS = {
  bg: "#0d211b",
  bgSoft: "#16332b",
  panel: "rgba(28, 18, 47, 0.78)",
  panelSolid: "#241634",
  panelSoft: "rgba(18, 39, 32, 0.92)",
  gold: "#c8a255",
  goldSoft: "rgba(200, 162, 85, 0.22)",
  cream: "#f4ead7",
  textSoft: "rgba(244, 234, 215, 0.72)",
  textFaint: "rgba(244, 234, 215, 0.42)",
  line: "rgba(200, 162, 85, 0.18)",
};

function formatGuestName(guest?: Guest | null) {
  if (!guest) return "Дорогой гость";
  return `${guest.first_name} ${guest.last_name}`.trim();
}

function formatGuestList(guests: Guest[]) {
  return guests.map((guest) => `${guest.first_name} ${guest.last_name}`.trim()).join(" • ");
}

function formatCheckout(checkOut: string | null) {
  if (!checkOut) return null;
  return new Date(checkOut).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
}

function BrandOrnament({ size = 78 }: { size?: number }) {
  const half = size / 2;

  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" style={{ display: "block" }}>
      <circle cx="40" cy="40" r="9" fill={TV_COLORS.gold} />
      {Array.from({ length: 8 }).map((_, index) => {
        const angle = (index * Math.PI) / 4;
        const innerX = half + 16 * Math.cos(angle);
        const innerY = half + 16 * Math.sin(angle);
        const outerX = half + 30 * Math.cos(angle);
        const outerY = half + 30 * Math.sin(angle);

        return (
          <line
            key={index}
            x1={innerX}
            y1={innerY}
            x2={outerX}
            y2={outerY}
            stroke={TV_COLORS.gold}
            strokeWidth="3"
            strokeLinecap="round"
          />
        );
      })}
      {Array.from({ length: 8 }).map((_, index) => {
        const angle = ((index * 45 + 22.5) * Math.PI) / 180;
        return (
          <circle
            key={`dot-${index}`}
            cx={half + 22 * Math.cos(angle)}
            cy={half + 22 * Math.sin(angle)}
            r="2.5"
            fill={TV_COLORS.gold}
            opacity="0.8"
          />
        );
      })}
    </svg>
  );
}

function SectionDivider() {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 14,
      }}
    >
      <div
        style={{
          flex: 1,
          height: 1,
          background: `linear-gradient(to right, transparent, ${TV_COLORS.line}, transparent)`,
        }}
      />
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: TV_COLORS.gold,
          boxShadow: `0 0 0 6px ${TV_COLORS.goldSoft}`,
        }}
      />
      <div
        style={{
          flex: 1,
          height: 1,
          background: `linear-gradient(to right, transparent, ${TV_COLORS.line}, transparent)`,
        }}
      />
    </div>
  );
}

function ClockBlock() {
  const now = new Date();
  const time = now.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Moscow",
  });
  const date = now.toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Moscow",
  });

  return (
    <div className="tv-fade-2" style={{ textAlign: "right" }}>
      <div
        style={{
          fontFamily: "var(--font-playfair, serif)",
          fontSize: "4.3rem",
          fontWeight: 400,
          lineHeight: 1,
          color: TV_COLORS.cream,
        }}
      >
        {time}
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: "1rem",
          color: TV_COLORS.textSoft,
          textTransform: "capitalize",
          letterSpacing: "0.08em",
        }}
      >
        {date}
      </div>
    </div>
  );
}

function ScreenShell({
  children,
  backgroundUrl,
}: {
  children: React.ReactNode;
  backgroundUrl?: string | null;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: backgroundUrl
          ? `linear-gradient(135deg, rgba(8,22,18,.86), rgba(24,14,41,.90)), url(${backgroundUrl}) center/cover no-repeat`
          : `radial-gradient(circle at 15% 20%, rgba(200,162,85,.14), transparent 22%),
             radial-gradient(circle at 85% 10%, rgba(81, 47, 114, .30), transparent 26%),
             linear-gradient(145deg, ${TV_COLORS.bgSoft} 0%, ${TV_COLORS.bg} 52%, #241634 100%)`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "4.5%",
          borderRadius: 42,
          border: `1px solid ${TV_COLORS.line}`,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,.02)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at center, rgba(255,255,255,.02), transparent 48%)",
        }}
      />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          height: "100%",
          padding: "5% 6%",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function IdleScreen({
  hotelName,
  roomNumber,
}: {
  hotelName: string;
  roomNumber: string;
}) {
  return (
    <ScreenShell>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 24,
        }}
      >
        <div className="tv-fade-1 tv-glow tv-float">
          <BrandOrnament size={90} />
        </div>
        <div className="tv-fade-2">
          <div
            style={{
              fontSize: "1rem",
              letterSpacing: "0.55em",
              textTransform: "uppercase",
              color: TV_COLORS.gold,
              marginBottom: 20,
            }}
          >
            Добро пожаловать
          </div>
          <div
            style={{
              fontFamily: "var(--font-playfair, serif)",
              fontSize: "5.7rem",
              lineHeight: 1.04,
              fontWeight: 400,
              color: TV_COLORS.cream,
            }}
          >
            {hotelName}
          </div>
        </div>

        <div className="tv-fade-3" style={{ width: 320 }}>
          <SectionDivider />
        </div>

        <div
          className="tv-fade-4"
          style={{
            fontSize: "1.2rem",
            letterSpacing: "0.36em",
            textTransform: "uppercase",
            color: TV_COLORS.textSoft,
          }}
        >
          Ожидание гостя
        </div>

        <div
          className="tv-fade-5"
          style={{
            maxWidth: 700,
            fontSize: "1.35rem",
            lineHeight: 1.8,
            color: TV_COLORS.textFaint,
          }}
        >
          Телевизор подготовлен к заселению и оформлен в фирменном стиле Reyhan Hotel.
        </div>
      </div>

      <div
        className="tv-fade-in"
        style={{
          position: "absolute",
          bottom: "6%",
          left: "7%",
          fontSize: "0.95rem",
          textTransform: "uppercase",
          letterSpacing: "0.28em",
          color: TV_COLORS.textFaint,
        }}
      >
        Номер {roomNumber}
      </div>
    </ScreenShell>
  );
}

function WelcomeScreen({
  hotelName,
  roomNumber,
  guests,
  checkOut,
  qrDataUrl,
  qrUrl,
}: {
  hotelName: string;
  roomNumber: string;
  guests: Guest[];
  checkOut: string | null;
  qrDataUrl: string | null;
  qrUrl: string | null;
}) {
  const primaryGuest = guests.find((guest) => guest.is_primary) ?? guests[0] ?? null;
  const guestList = formatGuestList(guests);
  const checkoutLabel = formatCheckout(checkOut);

  return (
    <ScreenShell>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          width: "100%",
          height: "100%",
          gap: 36,
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div className="tv-fade-1" style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <BrandOrnament size={34} />
            <span
              style={{
                fontSize: "0.92rem",
                textTransform: "uppercase",
                letterSpacing: "0.38em",
                color: TV_COLORS.gold,
              }}
            >
              {hotelName}
            </span>
          </div>

          <div
            className="tv-fade-2"
            style={{
              fontSize: "1rem",
              textTransform: "uppercase",
              letterSpacing: "0.3em",
              color: TV_COLORS.textSoft,
            }}
          >
            Добро пожаловать
          </div>

          <div className="tv-fade-3">
            <div
              style={{
                fontFamily: "var(--font-playfair, serif)",
                fontSize: "5.2rem",
                lineHeight: 1.02,
                fontWeight: 400,
                color: TV_COLORS.cream,
              }}
            >
              {primaryGuest?.first_name ?? "Дорогой"}
            </div>
            <div
              style={{
                marginTop: 6,
                fontFamily: "var(--font-playfair, serif)",
                fontSize: "3.2rem",
                lineHeight: 1.06,
                color: TV_COLORS.gold,
              }}
            >
              {primaryGuest?.last_name ?? "гость"}
            </div>
          </div>

          {guestList ? (
            <div
              className="tv-fade-4"
              style={{
                maxWidth: 760,
                fontSize: "1.22rem",
                lineHeight: 1.7,
                color: TV_COLORS.textSoft,
              }}
            >
              {guestList}
            </div>
          ) : null}

          <div className="tv-fade-4" style={{ maxWidth: 560 }}>
            <SectionDivider />
          </div>

          <div className="tv-fade-5" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              { label: "Номер", value: roomNumber },
              { label: "Выезд", value: checkoutLabel ?? "По запросу" },
              { label: "Статус", value: "Заселение активно" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  minWidth: 180,
                  padding: "18px 22px",
                  borderRadius: 22,
                  border: `1px solid ${TV_COLORS.line}`,
                  background: TV_COLORS.panelSoft,
                  boxShadow: "0 20px 40px -30px rgba(0,0,0,.55)",
                }}
              >
                <div
                  style={{
                    fontSize: "0.82rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.22em",
                    color: TV_COLORS.textFaint,
                    marginBottom: 8,
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-playfair, serif)",
                    fontSize: "2rem",
                    lineHeight: 1.1,
                    color: TV_COLORS.cream,
                  }}
                >
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="tv-fade-3"
          style={{
            justifySelf: "end",
            width: "100%",
            maxWidth: 440,
            padding: 28,
            borderRadius: 30,
            background: TV_COLORS.panel,
            border: `1px solid ${TV_COLORS.line}`,
            boxShadow: "0 34px 80px -38px rgba(0,0,0,.65)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: 18,
          }}
        >
          <div
            style={{
              fontSize: "0.9rem",
              textTransform: "uppercase",
              letterSpacing: "0.32em",
              color: TV_COLORS.gold,
            }}
          >
            Доступ к сервисам
          </div>

          {qrDataUrl ? (
            <div
              className="tv-glow"
              style={{
                borderRadius: 28,
                padding: 18,
                background: "#ffffff",
                boxShadow: "0 24px 60px -24px rgba(0,0,0,.45)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt="QR-код"
                width={260}
                height={260}
                style={{ display: "block", borderRadius: 14, imageRendering: "pixelated" }}
              />
            </div>
          ) : (
            <div
              style={{
                width: 296,
                borderRadius: 28,
                padding: 28,
                background: "rgba(255,255,255,.08)",
                color: TV_COLORS.textSoft,
                lineHeight: 1.7,
              }}
            >
              QR-код пока недоступен. Обратитесь на ресепшен.
            </div>
          )}

          <div
            style={{
              maxWidth: 320,
              fontSize: "1rem",
              lineHeight: 1.7,
              color: TV_COLORS.textSoft,
            }}
          >
            Сканируйте QR-код, чтобы открыть личный кабинет гостя и перейти к сервисам.
          </div>

          {qrUrl ? (
            <a
              href={qrUrl}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                minWidth: 280,
                padding: "16px 24px",
                borderRadius: 18,
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "1rem",
                color: "#1b1409",
                background: `linear-gradient(135deg, ${TV_COLORS.gold} 0%, #a97c37 100%)`,
                boxShadow: "0 18px 38px -18px rgba(200,162,85,.55)",
              }}
            >
              Перейти к сервисам
            </a>
          ) : null}
        </div>
      </div>
    </ScreenShell>
  );
}

function GuestPanelScreen({
  hotelName,
  roomNumber,
  guests,
}: {
  hotelName: string;
  roomNumber: string;
  guests: Guest[];
}) {
  const services = [
    { icon: "🍽", title: "Ресторан", sub: "6:00 – 22:00" },
    { icon: "🧹", title: "Уборка", sub: "По запросу" },
    { icon: "🛎", title: "Консьерж", sub: "Круглосуточно" },
    { icon: "💬", title: "Чат", sub: "Связь с ресепшеном" },
    { icon: "ℹ️", title: "Информация", sub: "Услуги и правила" },
    { icon: "🚪", title: "Выезд", sub: "Поддержка при checkout" },
  ];

  return (
    <ScreenShell>
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 28,
            gap: 32,
          }}
        >
          <div>
            <div className="tv-fade-1" style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <BrandOrnament size={30} />
              <span
                style={{
                  fontSize: "0.9rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.34em",
                  color: TV_COLORS.gold,
                }}
              >
                {hotelName}
              </span>
            </div>

            <div
              className="tv-fade-2"
              style={{
                marginTop: 18,
                fontFamily: "var(--font-playfair, serif)",
                fontSize: "3.2rem",
                lineHeight: 1.08,
                color: TV_COLORS.cream,
              }}
            >
              Сервисы для гостей
            </div>

            <div
              className="tv-fade-3"
              style={{
                marginTop: 10,
                fontSize: "1.1rem",
                lineHeight: 1.8,
                color: TV_COLORS.textSoft,
              }}
            >
              Номер {roomNumber}
              {guests.length > 0 ? ` • ${formatGuestList(guests)}` : ""}
            </div>
          </div>

          <ClockBlock />
        </div>

        <div className="tv-fade-3" style={{ marginBottom: 24 }}>
          <SectionDivider />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 18,
            flex: 1,
          }}
        >
          {services.map((service, index) => (
            <div
              key={service.title}
              className={index < 3 ? "tv-fade-4" : "tv-fade-5"}
              style={{
                borderRadius: 26,
                padding: "24px 24px 22px",
                background: index % 2 === 0 ? TV_COLORS.panel : TV_COLORS.panelSoft,
                border: `1px solid ${TV_COLORS.line}`,
                boxShadow: "0 28px 70px -42px rgba(0,0,0,.65)",
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <div style={{ fontSize: "2.9rem", lineHeight: 1 }}>{service.icon}</div>
              <div
                style={{
                  fontFamily: "var(--font-playfair, serif)",
                  fontSize: "2rem",
                  lineHeight: 1.08,
                  color: TV_COLORS.cream,
                }}
              >
                {service.title}
              </div>
              <div
                style={{
                  fontSize: "1rem",
                  lineHeight: 1.7,
                  color: TV_COLORS.textSoft,
                }}
              >
                {service.sub}
              </div>
            </div>
          ))}
        </div>

        <div
          className="tv-fade-in"
          style={{
            marginTop: 22,
            textAlign: "center",
            fontSize: "1rem",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: TV_COLORS.textFaint,
          }}
        >
          Для перехода к сервисам используйте QR-код на приветственном экране
        </div>
      </div>
    </ScreenShell>
  );
}

function CheckoutScreen({
  hotelName,
  guests,
}: {
  hotelName: string;
  guests: Guest[];
}) {
  const primaryGuest = guests.find((guest) => guest.is_primary) ?? guests[0] ?? null;

  return (
    <ScreenShell>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 22,
        }}
      >
        <div className="tv-fade-1 tv-glow">
          <BrandOrnament size={86} />
        </div>

        <div
          className="tv-fade-2"
          style={{
            fontSize: "1rem",
            textTransform: "uppercase",
            letterSpacing: "0.42em",
            color: TV_COLORS.gold,
          }}
        >
          Благодарим за визит
        </div>

        <div className="tv-fade-3">
          <div
            style={{
              fontFamily: "var(--font-playfair, serif)",
              fontSize: "5rem",
              lineHeight: 1.04,
              color: TV_COLORS.cream,
            }}
          >
            {primaryGuest?.first_name ?? "Дорогой"}
          </div>
          <div
            style={{
              marginTop: 6,
              fontFamily: "var(--font-playfair, serif)",
              fontSize: "3rem",
              lineHeight: 1.06,
              color: TV_COLORS.gold,
            }}
          >
            {primaryGuest?.last_name ?? "гость"}
          </div>
        </div>

        <div className="tv-fade-4" style={{ width: 320 }}>
          <SectionDivider />
        </div>

        <div
          className="tv-fade-5"
          style={{
            maxWidth: 860,
            fontSize: "1.55rem",
            lineHeight: 1.75,
            color: TV_COLORS.textSoft,
          }}
        >
          Спасибо, что выбрали {hotelName}. Желаем вам хорошей дороги и будем рады видеть вас снова.
        </div>
      </div>
    </ScreenShell>
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
    .from("rooms")
    .select("id, number")
    .eq("number", roomNumber)
    .maybeSingle();

  if (!room) {
    return (
      <ScreenShell>
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: 24,
          }}
        >
          <BrandOrnament size={72} />
          <div
            style={{
              fontFamily: "var(--font-playfair, serif)",
              fontSize: "3.4rem",
              color: TV_COLORS.cream,
            }}
          >
            Номер {roomNumber} не найден
          </div>
          <div
            style={{
              fontSize: "1.2rem",
              lineHeight: 1.7,
              color: TV_COLORS.textSoft,
            }}
          >
            Проверьте привязку телевизора к номеру на странице подключения.
          </div>
        </div>
      </ScreenShell>
    );
  }

  let state = "idle";
  let guests: Guest[] = [];
  let checkOut: string | null = null;
  let accessToken: string | null = null;
  let stayId: string | null = null;
  let stayUpdatedAt: string | null = null;

  try {
    const { data: stay } = await supabase
      .from("stays")
      .select("id, tv_state, check_out_scheduled, access_token, tv_state_updated_at")
      .eq("room_id", room.id)
      .eq("status", "active")
      .maybeSingle();

    if (stay) {
      state = stay.tv_state ?? "idle";
      checkOut = stay.check_out_scheduled ?? null;
      accessToken = stay.access_token ?? null;
      stayId = stay.id;
      stayUpdatedAt = stay.tv_state_updated_at ?? null;

      const { data: guestRows } = await supabase
        .from("stay_guests")
        .select("first_name, last_name, is_primary")
        .eq("stay_id", stay.id)
        .order("is_primary", { ascending: false });

      guests = (guestRows ?? []) as Guest[];
    }
  } catch {
    // stays table may be missing before migration 005
  }

  if (stayId && stayUpdatedAt) {
    const ageSeconds = (Date.now() - new Date(stayUpdatedAt).getTime()) / 1000;

    if (state === "checkout_message" && ageSeconds > 20) {
      try {
        await supabase
          .from("stays")
          .update({
            tv_state: "session_closing",
            tv_state_updated_at: new Date().toISOString(),
          })
          .eq("id", stayId);

        state = "session_closing";
        stayUpdatedAt = new Date().toISOString();
      } catch {
        // ignore auto-step failure
      }
    }

    if (state === "session_closing" && ageSeconds > 15) {
      try {
        const { data: stayRow } = await supabase
          .from("stays")
          .select("guest_id")
          .eq("id", stayId)
          .single();

        await supabase
          .from("stays")
          .update({
            status: "checked_out",
            tv_state: "idle",
            tv_state_updated_at: new Date().toISOString(),
            checked_out_at: new Date().toISOString(),
          })
          .eq("id", stayId);

        await supabase.from("rooms").update({ status: "available" }).eq("id", room.id);

        if (stayRow?.guest_id) {
          await supabase
            .from("guests")
            .update({ status: "checked_out" })
            .eq("id", stayRow.guest_id);
        }

        state = "idle";
        guests = [];
      } catch {
        // ignore auto-step failure
      }
    }
  }

  const { data: settings } = await supabase
    .from("hotel_settings")
    .select("hotel_name")
    .limit(1)
    .maybeSingle();

  const hotelName = (settings?.hotel_name as string | null) ?? "Reyhan Hotel";

  let qrDataUrl: string | null = null;
  let qrUrl: string | null = null;

  if (state === "welcome" && accessToken) {
    const hdrs = await headers();
    const host = hdrs.get("host") ?? "reyxan.vercel.app";
    qrUrl = `https://${host}/guest/access?token=${accessToken}`;

    try {
      qrDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 280,
        margin: 2,
        color: { dark: "#1a140a", light: "#ffffff" },
        errorCorrectionLevel: "M",
      });
    } catch {
      qrDataUrl = null;
    }
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "var(--font-inter, sans-serif)",
        userSelect: "none",
        background: TV_COLORS.bg,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
      <script
        dangerouslySetInnerHTML={{
          __html: "setTimeout(function(){location.reload();},8000);",
        }}
      />
      <style dangerouslySetInnerHTML={{ __html: TV_CSS }} />

      {state === "idle" && <IdleScreen hotelName={hotelName} roomNumber={roomNumber} />}
      {state === "welcome" && (
        <WelcomeScreen
          hotelName={hotelName}
          roomNumber={roomNumber}
          guests={guests}
          checkOut={checkOut}
          qrDataUrl={qrDataUrl}
          qrUrl={qrUrl}
        />
      )}
      {(state === "intro_video" || state === "guest_panel") && (
        <GuestPanelScreen hotelName={hotelName} roomNumber={roomNumber} guests={guests} />
      )}
      {(state === "checkout_message" || state === "session_closing") && (
        <CheckoutScreen hotelName={hotelName} guests={guests} />
      )}
    </div>
  );
}

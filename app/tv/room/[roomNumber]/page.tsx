import { createAdminClient } from "@/lib/supabase/admin";
import { headers } from "next/headers";
import QRCode from "qrcode";

export const revalidate = 8;

interface Guest { first_name: string; last_name: string; is_primary: boolean }

// ─────────────────────────────────────────────────────────────────────────────
// CSS Animations injected into page (pure CSS, works on every browser)
// ─────────────────────────────────────────────────────────────────────────────
const CSS = `
  @keyframes tvFadeUp {
    from { opacity:0; transform:translateY(32px); }
    to   { opacity:1; transform:translateY(0);    }
  }
  @keyframes tvFadeIn {
    from { opacity:0; }
    to   { opacity:1; }
  }
  @keyframes tvScaleIn {
    from { opacity:0; transform:scale(0.8);  }
    to   { opacity:1; transform:scale(1);    }
  }
  @keyframes tvSlideLeft {
    from { opacity:0; transform:translateX(-44px); }
    to   { opacity:1; transform:translateX(0);     }
  }
  @keyframes tvSlideRight {
    from { opacity:0; transform:translateX(44px); }
    to   { opacity:1; transform:translateX(0);    }
  }
  @keyframes tvStarPop {
    from { opacity:0; transform:scale(0) rotate(-30deg); }
    to   { opacity:1; transform:scale(1) rotate(0);      }
  }
  @keyframes tvGlow {
    0%,100% { box-shadow:0 0  0  0 rgba(196,147,40,0);    }
    50%     { box-shadow:0 0 40px 6px rgba(196,147,40,0.18); }
  }
  @keyframes tvPulse {
    0%,100% { opacity:1;   transform:scale(1);    }
    50%     { opacity:0.7; transform:scale(1.04); }
  }
  @keyframes tvOrbit {
    0%   { transform:rotate(0deg);    }
    100% { transform:rotate(360deg);  }
  }
  @keyframes tvBreath {
    0%,100% { opacity:0.85; }
    50%     { opacity:1;    }
  }

  /* entrance classes — animation-fill-mode:both keeps elements hidden until animation fires */
  .a1  { animation:tvFadeUp   .7s cubic-bezier(.22,1,.36,1) both .05s; }
  .a2  { animation:tvFadeUp   .7s cubic-bezier(.22,1,.36,1) both .20s; }
  .a3  { animation:tvFadeUp   .7s cubic-bezier(.22,1,.36,1) both .35s; }
  .a4  { animation:tvFadeUp   .7s cubic-bezier(.22,1,.36,1) both .50s; }
  .a5  { animation:tvFadeUp   .7s cubic-bezier(.22,1,.36,1) both .65s; }
  .a6  { animation:tvFadeUp   .7s cubic-bezier(.22,1,.36,1) both .80s; }
  .aL  { animation:tvSlideLeft  .8s cubic-bezier(.22,1,.36,1) both .05s; }
  .aR  { animation:tvSlideRight .8s cubic-bezier(.22,1,.36,1) both .25s; }
  .aF  { animation:tvFadeIn   1.0s ease both .1s; }
  .aSc { animation:tvScaleIn  .65s cubic-bezier(.34,1.56,.64,1) both .05s; }
  /* continuous animations */
  .glow   { animation:tvGlow   2.8s ease-in-out infinite; }
  .breath { animation:tvBreath 4s   ease-in-out infinite; }
  .pulse  { animation:tvPulse  3s   ease-in-out infinite; }
  /* stars */
  .s0 { animation:tvStarPop .45s cubic-bezier(.34,1.56,.64,1) both .30s; }
  .s1 { animation:tvStarPop .45s cubic-bezier(.34,1.56,.64,1) both .38s; }
  .s2 { animation:tvStarPop .45s cubic-bezier(.34,1.56,.64,1) both .46s; }
  .s3 { animation:tvStarPop .45s cubic-bezier(.34,1.56,.64,1) both .54s; }
  .s4 { animation:tvStarPop .45s cubic-bezier(.34,1.56,.64,1) both .62s; }
  /* card stagger */
  .c1 { animation:tvFadeUp .5s ease both .10s; }
  .c2 { animation:tvFadeUp .5s ease both .18s; }
  .c3 { animation:tvFadeUp .5s ease both .26s; }
  .c4 { animation:tvFadeUp .5s ease both .34s; }
  .c5 { animation:tvFadeUp .5s ease both .42s; }
  .c6 { animation:tvFadeUp .5s ease both .50s; }

  .ornament-wrap { animation:tvScaleIn .6s cubic-bezier(.34,1.56,.64,1) both; }
  .ornament-ring { animation:tvOrbit 18s linear infinite; transform-origin:50% 50%; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────────────────────

function Ornament({ size = 56, ring = false }: { size?: number; ring?: boolean }) {
  return (
    <div className="ornament-wrap" style={{ width: size, height: size, position: "relative" }}>
      <svg width={size} height={size} viewBox="0 0 28 28" fill="none" style={{ color: "#c49328" }}>
        {/* 8 spokes */}
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * 45 * Math.PI) / 180;
          return (
            <line key={`sp-${i}`}
              x1={14 + 4 * Math.cos(a)} y1={14 + 4 * Math.sin(a)}
              x2={14 + 11 * Math.cos(a)} y2={14 + 11 * Math.sin(a)}
              stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"
            />
          );
        })}
        <circle cx="14" cy="14" r="3.2" fill="currentColor" />
        {/* 8 dots between spokes */}
        {Array.from({ length: 8 }).map((_, i) => {
          const a = ((i * 45 + 22.5) * Math.PI) / 180;
          return <circle key={`d-${i}`} cx={14 + 7.5 * Math.cos(a)} cy={14 + 7.5 * Math.sin(a)} r="0.9" fill="currentColor" />;
        })}
      </svg>
      {ring && (
        <svg
          className="ornament-ring"
          style={{ position: "absolute", inset: 0 }}
          width={size} height={size} viewBox="0 0 28 28" fill="none"
        >
          {Array.from({ length: 4 }).map((_, i) => {
            const a = ((i * 90) * Math.PI) / 180;
            return <circle key={i} cx={14 + 13 * Math.cos(a)} cy={14 + 13 * Math.sin(a)} r="1" fill="#c49328" opacity="0.4" />;
          })}
        </svg>
      )}
    </div>
  );
}

function StarRow({ baseDelay = 0 }: { baseDelay?: number }) {
  const stagger = ["s0","s1","s2","s3","s4"];
  return (
    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
      {stagger.map((cls, i) => (
        <svg key={i} width="22" height="22" viewBox="0 0 24 24" fill="#c49328" className={cls}
          style={{ animationDelay: `${baseDelay + i * 0.08}s` }}
        >
          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
        </svg>
      ))}
    </div>
  );
}

function Divider() {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, width:"100%" }}>
      <div style={{ flex:1, height:1, background:"linear-gradient(to right,transparent,rgba(196,147,40,.35),transparent)" }} />
      <span style={{ color:"rgba(196,147,40,.6)", fontSize:11 }}>✦</span>
      <div style={{ flex:1, height:1, background:"linear-gradient(to left,transparent,rgba(196,147,40,.35),transparent)" }} />
    </div>
  );
}

function Clock() {
  const now = new Date();
  const time = now.toLocaleTimeString("ru-RU", { hour:"2-digit", minute:"2-digit", timeZone:"Europe/Moscow" });
  const date = now.toLocaleDateString("ru-RU", { weekday:"long", day:"numeric", month:"long", timeZone:"Europe/Moscow" });
  return (
    <div className="a1" style={{ textAlign:"right" }}>
      <div style={{ fontFamily:"var(--font-playfair,serif)", fontSize:"4.5rem", fontWeight:300, lineHeight:1, color:"#1a1005" }}>{time}</div>
      <div style={{ fontSize:"1rem", marginTop:6, textTransform:"capitalize", color:"rgba(26,16,5,.38)" }}>{date}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Screens
// ─────────────────────────────────────────────────────────────────────────────

const BG_CREAM = "#faf8f3";
const C_DARK   = "#1a1005";
const C_GOLD   = "#c49328";
const C_MUTED  = "rgba(26,16,5,.38)";
const CARD_BG  = "#ffffff";
const FONT_SERIF = "var(--font-playfair,serif)";

/* Safe-zone wrapper — 5% top/bottom, 6% left/right */
function Safe({ children, style = {}, center = false }: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  center?: boolean;
}) {
  return (
    <div style={{
      position:"absolute", inset:0,
      padding:"5% 6%",
      display:"flex",
      flexDirection: center ? "column" : undefined,
      alignItems: center ? "center" : undefined,
      justifyContent: center ? "center" : undefined,
      ...style,
    }}>
      {children}
    </div>
  );
}

function IdleScreen({ hotelName, roomNumber }: { hotelName: string; roomNumber: string }) {
  return (
    <div style={{ width:"100%", height:"100%", position:"relative", background:`radial-gradient(ellipse at 50% 35%,rgba(196,147,40,.07) 0%,transparent 60%), ${BG_CREAM}` }}>
      <Safe center style={{ gap:28, textAlign:"center" }}>
        <div className="breath" style={{ lineHeight:0 }}>
          <Ornament size={88} ring />
        </div>

        <div className="a1" style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
          <div style={{ fontFamily:FONT_SERIF, fontSize:"5.5rem", fontWeight:300, letterSpacing:"0.06em", color:C_DARK, lineHeight:1 }}>
            {hotelName}
          </div>
          <div style={{ letterSpacing:"0.4em", fontSize:"0.85rem", textTransform:"uppercase", color:C_GOLD }}>
            Добро пожаловать
          </div>
        </div>

        <div className="a2" style={{ width:240 }}><Divider /></div>

        <div className="a3"><StarRow baseDelay={0.3} /></div>

        <div className="a4 pulse" style={{ letterSpacing:"0.3em", fontSize:"0.8rem", textTransform:"uppercase", color:"rgba(26,16,5,.22)" }}>
          Ожидание гостя
        </div>
      </Safe>

      <div className="aF" style={{ position:"absolute", bottom:"5%", right:"6%", letterSpacing:"0.2em", fontSize:"0.8rem", textTransform:"uppercase", color:"rgba(26,16,5,.18)" }}>
        Номер {roomNumber}
      </div>
    </div>
  );
}

function WelcomeScreen({ hotelName, roomNumber, guests, checkOut, qrDataUrl, qrUrl }: {
  hotelName: string; roomNumber: string; guests: Guest[];
  checkOut: string | null; qrDataUrl: string | null; qrUrl: string | null;
}) {
  const checkOutFmt = checkOut
    ? new Date(checkOut).toLocaleDateString("ru-RU", { day:"numeric", month:"long" })
    : null;
  const hasMany = guests.length > 1;
  const primary = guests.find(g => g.is_primary) ?? guests[0];

  return (
    <div style={{ width:"100%", height:"100%", position:"relative", background:`radial-gradient(ellipse at 12% 50%,rgba(196,147,40,.08) 0%,transparent 50%), ${BG_CREAM}`, display:"flex" }}>
      {/* LEFT */}
      <div className="aL" style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", paddingLeft:"7%", paddingRight:"4%", paddingTop:"5%", paddingBottom:"5%", gap:22 }}>
        {/* Hotel brand */}
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Ornament size={28} />
          <span style={{ letterSpacing:"0.3em", fontSize:"0.85rem", textTransform:"uppercase", color:`rgba(196,147,40,.8)` }}>
            {hotelName}
          </span>
        </div>

        {/* Welcome label */}
        <div className="a2" style={{ letterSpacing:"0.22em", fontSize:"1.1rem", textTransform:"uppercase", color:C_MUTED }}>
          Добро пожаловать
        </div>

        {/* Guest name(s) */}
        <div className="a3" style={{ fontFamily:FONT_SERIF, fontWeight:300, lineHeight:1.1, color:C_DARK }}>
          {hasMany ? (
            guests.map((g, i) => (
              <div key={i} style={{ marginBottom: i < guests.length-1 ? 10 : 0 }}>
                <span style={{ fontSize: i===0 ? "4rem" : "2.8rem" }}>{g.first_name}</span>
                {" "}
                <span style={{ fontSize: i===0 ? "2.4rem" : "1.8rem", color:C_MUTED }}>{g.last_name}</span>
              </div>
            ))
          ) : (
            <>
              <div style={{ fontSize:"5.5rem", lineHeight:1 }}>{primary?.first_name ?? "Дорогой"}</div>
              <div style={{ fontSize:"3rem", color:C_MUTED, marginTop:4 }}>{primary?.last_name ?? "гость"}</div>
            </>
          )}
        </div>

        {/* Room + checkout */}
        <div className="a4" style={{ display:"flex", alignItems:"flex-end", gap:36 }}>
          <div>
            <div style={{ fontSize:"0.7rem", textTransform:"uppercase", letterSpacing:"0.2em", color:C_MUTED, marginBottom:4 }}>Номер</div>
            <div style={{ fontFamily:FONT_SERIF, fontSize:"4rem", fontWeight:300, color:C_GOLD, lineHeight:1 }}>{roomNumber}</div>
          </div>
          {checkOutFmt && (
            <div>
              <div style={{ fontSize:"0.7rem", textTransform:"uppercase", letterSpacing:"0.2em", color:C_MUTED, marginBottom:4 }}>Выезд</div>
              <div style={{ fontFamily:FONT_SERIF, fontSize:"3rem", fontWeight:300, color:C_DARK, lineHeight:1 }}>{checkOutFmt}</div>
            </div>
          )}
        </div>

        <div className="a5"><StarRow baseDelay={0.5} /></div>

        <div className="a6" style={{ fontSize:"1rem", lineHeight:1.6, color:"rgba(26,16,5,.32)", maxWidth:"28rem" }}>
          Желаем приятного пребывания. Мы здесь, чтобы сделать ваш отдых незабываемым.
        </div>
      </div>

      {/* RIGHT — QR */}
      <div className="aR" style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", paddingRight:"7%", paddingLeft:"3%", gap:20 }}>
        <div style={{ fontSize:"0.75rem", letterSpacing:"0.25em", textTransform:"uppercase", color:C_MUTED, textAlign:"center" }}>
          Доступ к сервисам
        </div>

        {qrDataUrl ? (
          <div
            className="aSc glow"
            style={{ background:CARD_BG, borderRadius:24, padding:16, boxShadow:"0 8px 48px rgba(196,147,40,.14),0 2px 10px rgba(0,0,0,.06)" }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR" width={240} height={240} style={{ display:"block", borderRadius:12, imageRendering:"pixelated" }} />
          </div>
        ) : (
          <div style={{ background:CARD_BG, borderRadius:24, padding:32, boxShadow:"0 4px 20px rgba(0,0,0,.06)" }}>
            <div style={{ fontSize:"0.85rem", color:C_MUTED, width:200, textAlign:"center" }}>
              QR не доступен — обратитесь на ресепшен
            </div>
          </div>
        )}

        <div style={{ fontSize:"0.85rem", textAlign:"center", color:C_MUTED, maxWidth:200, lineHeight:1.5 }}>
          Сканируйте камерой телефона
        </div>

        {qrUrl && (
          <a
            href={qrUrl}
            style={{
              display:"flex", alignItems:"center", gap:8,
              padding:"12px 24px", borderRadius:16,
              background:"linear-gradient(135deg,#c49328 0%,#a87920 100%)",
              color:"#fff", textDecoration:"none",
              fontSize:"1rem", fontWeight:600,
              boxShadow:"0 4px 20px rgba(196,147,40,.35)",
            }}
          >
            Перейти к сервисам →
          </a>
        )}
      </div>
    </div>
  );
}

function GuestPanelScreen({ hotelName, roomNumber, guests }: {
  hotelName: string; roomNumber: string; guests: Guest[];
}) {
  const SVCS = [
    { icon:"🍽️", label:"Ресторан",  sub:"6:00 – 22:00",    cls:"c1" },
    { icon:"🧹", label:"Уборка",    sub:"По запросу",       cls:"c2" },
    { icon:"🛎️", label:"Консьерж", sub:"Круглосуточно",    cls:"c3" },
    { icon:"🚗", label:"Такси",     sub:"На ресепшене",     cls:"c4" },
    { icon:"💆", label:"СПА",       sub:"9:00 – 21:00",     cls:"c5" },
    { icon:"☎️", label:"Ресепшен",  sub:"📞 101",           cls:"c6" },
  ];
  const names = guests.map(g => `${g.first_name} ${g.last_name}`).join("  ·  ");

  return (
    <div style={{ width:"100%", height:"100%", background:`radial-gradient(ellipse at 80% 0%,rgba(196,147,40,.05) 0%,transparent 50%), ${BG_CREAM}`, display:"flex", flexDirection:"column", padding:"5% 6%" }}>
      {/* Header */}
      <div className="aL" style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
            <Ornament size={22} />
            <span style={{ letterSpacing:"0.3em", fontSize:"0.8rem", textTransform:"uppercase", color:`rgba(196,147,40,.7)` }}>{hotelName}</span>
          </div>
          <div style={{ fontFamily:FONT_SERIF, fontSize:"2.8rem", fontWeight:300, color:C_DARK, lineHeight:1.1 }}>Номер {roomNumber}</div>
          {names && <div style={{ fontSize:"1.1rem", color:C_MUTED, marginTop:6 }}>{names}</div>}
        </div>
        <Clock />
      </div>

      <div className="a2" style={{ marginBottom:20 }}><Divider /></div>

      {/* Services grid */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, flex:1 }}>
        {SVCS.map(s => (
          <div
            key={s.label}
            className={s.cls}
            style={{ background:CARD_BG, borderRadius:20, padding:24, display:"flex", flexDirection:"column", gap:12, border:`1px solid rgba(196,147,40,.15)`, boxShadow:"0 2px 14px rgba(0,0,0,.04)" }}
          >
            <div style={{ fontSize:"3rem", lineHeight:1 }}>{s.icon}</div>
            <div style={{ fontSize:"1.6rem", fontWeight:600, color:C_DARK }}>{s.label}</div>
            <div style={{ fontSize:"1.1rem", color:C_MUTED }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CheckoutScreen({ hotelName, guests }: { hotelName: string; guests: Guest[] }) {
  const hasMany = guests.length > 1;
  const primary = guests.find(g => g.is_primary) ?? guests[0];
  return (
    <div style={{ width:"100%", height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", padding:"5% 8%", gap:28, background:`radial-gradient(ellipse at 50% 60%,rgba(196,147,40,.08) 0%,transparent 55%), ${BG_CREAM}` }}>
      <div className="aSc breath"><Ornament size={80} /></div>

      <div className="a2" style={{ fontSize:"1.1rem", letterSpacing:"0.25em", textTransform:"uppercase", color:C_MUTED }}>
        Спасибо за ваш выбор
      </div>

      <div className="a3" style={{ fontFamily:FONT_SERIF, fontWeight:300, lineHeight:1.1, color:C_DARK }}>
        {hasMany ? (
          guests.map((g, i) => (
            <div key={i}>
              <span style={{ fontSize: i===0 ? "4.5rem" : "3rem" }}>{g.first_name}</span>
              {" "}
              <span style={{ fontSize: i===0 ? "2.8rem" : "2rem", color:C_MUTED }}>{g.last_name}</span>
            </div>
          ))
        ) : (
          <>
            <div style={{ fontSize:"5.5rem", lineHeight:1 }}>{primary?.first_name ?? "Дорогой"}</div>
            <div style={{ fontSize:"3rem", color:C_MUTED, marginTop:6 }}>{primary?.last_name ?? "гость"}</div>
          </>
        )}
      </div>

      <div className="a4" style={{ width:280 }}><Divider /></div>

      <div className="a5" style={{ fontSize:"1.5rem", color:`rgba(26,16,5,.4)`, maxWidth:"28rem", lineHeight:1.6 }}>
        Ждём вас снова. Хорошей дороги!
      </div>

      <div className="a6"><StarRow baseDelay={0.6} /></div>

      <div className="aF" style={{ fontSize:"0.8rem", letterSpacing:"0.3em", textTransform:"uppercase", color:"rgba(26,16,5,.2)" }}>
        {hotelName}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export default async function TvRoomPage({
  params,
}: {
  params: Promise<{ roomNumber: string }>;
}) {
  const { roomNumber } = await params;
  const supabase = createAdminClient();

  const { data: room } = await supabase
    .from("rooms").select("id, number").eq("number", roomNumber).maybeSingle();

  if (!room) {
    return (
      <div style={{ width:"100vw", height:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:24, background:BG_CREAM }}>
        <Ornament size={64} />
        <p style={{ fontFamily:FONT_SERIF, fontSize:"2.5rem", fontWeight:300, color:"rgba(26,16,5,.3)" }}>
          Номер {roomNumber} не найден
        </p>
      </div>
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
      .eq("room_id", room.id).eq("status", "active").maybeSingle();

    if (stay) {
      state = stay.tv_state ?? "idle";
      checkOut = stay.check_out_scheduled ?? null;
      accessToken = stay.access_token ?? null;
      stayId = stay.id;
      stayUpdatedAt = stay.tv_state_updated_at ?? null;

      const { data: guestRows } = await supabase
        .from("stay_guests").select("first_name, last_name, is_primary")
        .eq("stay_id", stay.id).order("is_primary", { ascending: false });
      guests = (guestRows ?? []) as Guest[];
    }
  } catch { /* stays table may not exist */ }

  // ─── Auto-advance checkout states every 8-second reload ───
  if (stayId && stayUpdatedAt) {
    const ageSeconds = (Date.now() - new Date(stayUpdatedAt).getTime()) / 1000;

    if (state === "checkout_message" && ageSeconds > 20) {
      try {
        await supabase.from("stays")
          .update({ tv_state: "session_closing", tv_state_updated_at: new Date().toISOString() })
          .eq("id", stayId);
        state = "session_closing";
        stayUpdatedAt = new Date().toISOString();
      } catch { /* ignore */ }
    }

    if (state === "session_closing" && ageSeconds > 15) {
      try {
        const { data: stayRow } = await supabase.from("stays").select("guest_id").eq("id", stayId).single();
        await supabase.from("stays")
          .update({ status: "checked_out", tv_state: "idle", tv_state_updated_at: new Date().toISOString(), checked_out_at: new Date().toISOString() })
          .eq("id", stayId);
        await supabase.from("rooms").update({ status: "available" }).eq("id", room.id);
        if (stayRow?.guest_id) {
          await supabase.from("guests").update({ status: "checked_out" }).eq("id", stayRow.guest_id);
        }
        state = "idle";
        guests = [];
      } catch { /* ignore */ }
    }
  }

  const { data: settings } = await supabase
    .from("hotel_settings").select("hotel_name").limit(1).maybeSingle();
  const hotelName = (settings?.hotel_name as string | null) ?? "Reyhan Hotel";

  // ─── Server-side QR generation (no external img loading on TV) ───
  let qrDataUrl: string | null = null;
  let qrUrl: string | null = null;

  if (state === "welcome" && accessToken) {
    const hdrs = await headers();
    const host = hdrs.get("host") ?? "reyxan.vercel.app";
    qrUrl = `https://${host}/guest/access?token=${accessToken}`;
    try {
      qrDataUrl = await QRCode.toDataURL(qrUrl, {
        width: 280, margin: 2,
        color: { dark: "#1a1005", light: "#ffffff" },
        errorCorrectionLevel: "M",
      });
    } catch { /* fallback */ }
  }

  return (
    <div style={{ position:"relative", width:"100vw", height:"100vh", overflow:"hidden", fontFamily:"var(--font-inter,sans-serif)", userSelect:"none", background:BG_CREAM }}>
      {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
      <script dangerouslySetInnerHTML={{ __html: "setTimeout(function(){location.reload();},8000);" }} />
      {/* CSS animations */}
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {state === "idle" && <IdleScreen hotelName={hotelName} roomNumber={roomNumber} />}
      {state === "welcome" && (
        <WelcomeScreen
          hotelName={hotelName} roomNumber={roomNumber}
          guests={guests} checkOut={checkOut}
          qrDataUrl={qrDataUrl} qrUrl={qrUrl}
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

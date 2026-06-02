"use client";

import { BedDouble, Tv2 } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; dot: string }> = {
  available: { label: "Свободен", dot: "#4fb38a" },
  occupied: { label: "Занят", dot: "#c8a255" },
  maintenance: { label: "Обслуживание", dot: "#d46c6c" },
};

interface Room {
  id: string;
  number: string;
  floor: number | null;
  status: string;
}

export function TvConnectClient({ rooms }: { rooms: Room[] }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        color: "#f4ead7",
        background:
          "radial-gradient(circle at 14% 18%, rgba(200,162,85,.12), transparent 18%), radial-gradient(circle at 86% 8%, rgba(81,47,114,.28), transparent 24%), linear-gradient(145deg, #16332b 0%, #0d211b 52%, #241634 100%)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          maxWidth: 1520,
          width: "100%",
          margin: "0 auto",
          padding: "56px 32px 72px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 18,
            }}
          >
            <Tv2 style={{ width: 40, height: 40, color: "#c8a255" }} />
            <span
              style={{
                fontFamily: "var(--font-playfair, serif)",
                fontSize: "2.9rem",
                color: "#f4ead7",
              }}
            >
              Reyhan Hotel
            </span>
          </div>

          <div
            style={{
              fontSize: "0.95rem",
              letterSpacing: "0.42em",
              textTransform: "uppercase",
              color: "#c8a255",
              marginBottom: 14,
            }}
          >
            Подключение телевизора
          </div>

          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-playfair, serif)",
              fontSize: "4.4rem",
              lineHeight: 1.06,
              fontWeight: 400,
            }}
          >
            Выберите номер для TV
          </h1>

          <p
            style={{
              maxWidth: 760,
              margin: "18px auto 0",
              fontSize: "1.22rem",
              lineHeight: 1.8,
              color: "rgba(244,234,215,.72)",
            }}
          >
            После выбора телевизор будет постоянно открыт на экране номера и автоматически
            обновлять состояние гостя.
          </p>
        </div>

        {rooms.length === 0 ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 18,
              color: "rgba(244,234,215,.65)",
            }}
          >
            <BedDouble style={{ width: 72, height: 72, color: "#c8a255" }} />
            <div
              style={{
                fontFamily: "var(--font-playfair, serif)",
                fontSize: "2.6rem",
              }}
            >
              Нет доступных номеров
            </div>
            <div style={{ fontSize: "1.15rem", color: "rgba(244,234,215,.52)" }}>
              Добавьте номера в админ-панели и попробуйте снова.
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 18,
              flex: 1,
            }}
          >
            {rooms.map((room) => {
              const status = STATUS_CONFIG[room.status] ?? STATUS_CONFIG.available;

              return (
                <a
                  key={room.id}
                  href={`/tv/room/${room.number}`}
                  style={{
                    textDecoration: "none",
                    color: "inherit",
                    borderRadius: 28,
                    padding: "24px 24px 22px",
                    minHeight: 216,
                    border: "1px solid rgba(200,162,85,.16)",
                    background:
                      "linear-gradient(180deg, rgba(36,22,52,.78), rgba(18,39,32,.92))",
                    boxShadow: "0 30px 70px -42px rgba(0,0,0,.65)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    transition: "transform .15s ease, border-color .15s ease, background .15s ease",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.78rem",
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: "rgba(244,234,215,.44)",
                    }}
                  >
                    номер
                  </div>

                  <div
                    style={{
                      fontFamily: "var(--font-playfair, serif)",
                      fontSize: "4rem",
                      lineHeight: 1,
                      color: "#f4ead7",
                    }}
                  >
                    {room.number}
                  </div>

                  <div style={{ fontSize: "1rem", color: "rgba(244,234,215,.64)" }}>
                    {room.floor ? `${room.floor} этаж` : "Этаж не указан"}
                  </div>

                  <div
                    style={{
                      marginTop: "auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          background: status.dot,
                          boxShadow: `0 0 0 5px ${status.dot}22`,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: "0.95rem", color: "rgba(244,234,215,.72)" }}>
                        {status.label}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: "0.95rem",
                        fontWeight: 700,
                        color: "#c8a255",
                      }}
                    >
                      Подключить
                    </span>
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

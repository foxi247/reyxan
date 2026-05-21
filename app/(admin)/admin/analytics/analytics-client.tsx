"use client";

import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download, Users, ShoppingBag, ConciergeBell, TrendingUp,
  Star, BedDouble, Calendar,
} from "lucide-react";
import { ORDER_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface DailyPoint {
  date: string;
  guests: number;
  orders: number;
  serviceRequests: number;
}

interface Props {
  daily: DailyPoint[];
  totals: {
    totalGuests: number;
    totalOrders: number;
    totalServiceRequests: number;
    totalRevenue: number;
    avgOrderValue: number;
    avgRating: number;
    totalRatings: number;
    occupancyPct: number;
    occupiedRooms: number;
    totalRooms: number;
    avgStayDays: number;
  };
  serviceTypes: { name: string; count: number }[];
  ordersByStatus: { status: string; count: number }[];
  ratingDist: { star: number; count: number }[];
  rawGuests: { id: string; created_at: string }[];
  rawOrders: { id: string; created_at: string; total: number; status: string }[];
  rawServiceReqs: { id: string; created_at: string; title: string; status: string }[];
}

type ChartView = "all" | "guests" | "orders" | "service";

const SHORT_DATE = (date: string) =>
  new Date(date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

const CHART_COLORS = {
  guests: "#C9A84C",
  orders: "#5C8A6E",
  serviceRequests: "#8B7355",
};

const PIE_COLORS = ["#C9A84C", "#5C8A6E", "#8B7355", "#6B7280", "#9CA3AF"];

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-gold",
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  highlight?: boolean;
}) {
  return (
    <div className={cn("hotel-card p-4 flex items-center gap-3", highlight && "ring-1 ring-gold/30")}>
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gold/10">
        <Icon className={cn("h-5 w-5", color)} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5 truncate">{label}</p>
        <p className="font-serif text-xl font-medium leading-none">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function exportToExcel(props: Props) {
  import("xlsx").then(({ utils, writeFile }) => {
    const wb = utils.book_new();

    const dailyWs = utils.json_to_sheet(
      props.daily.map((d) => ({
        Дата: d.date,
        "Новые гости": d.guests,
        "Заказы еды": d.orders,
        "Заявки на сервис": d.serviceRequests,
      }))
    );
    utils.book_append_sheet(wb, dailyWs, "По дням");

    const guestsWs = utils.json_to_sheet(
      props.rawGuests.map((g) => ({
        ID: g.id,
        "Дата регистрации": g.created_at.slice(0, 10),
      }))
    );
    utils.book_append_sheet(wb, guestsWs, "Гости");

    const ordersWs = utils.json_to_sheet(
      props.rawOrders.map((o) => ({
        ID: o.id,
        Дата: o.created_at.slice(0, 10),
        "Сумма (₽)": Number(o.total).toFixed(2),
        Статус: ORDER_STATUS_LABELS[o.status] ?? o.status,
      }))
    );
    utils.book_append_sheet(wb, ordersWs, "Заказы еды");

    const svcWs = utils.json_to_sheet(
      props.rawServiceReqs.map((r) => ({
        ID: r.id,
        Дата: r.created_at.slice(0, 10),
        Название: r.title,
        Статус: r.status,
      }))
    );
    utils.book_append_sheet(wb, svcWs, "Заявки на сервис");

    const totalsWs = utils.json_to_sheet([
      { Показатель: "Всего гостей", Значение: props.totals.totalGuests },
      { Показатель: "Заказов еды", Значение: props.totals.totalOrders },
      { Показатель: "Заявок на сервис", Значение: props.totals.totalServiceRequests },
      { Показатель: "Выручка (₽)", Значение: props.totals.totalRevenue.toFixed(2) },
      { Показатель: "Средний чек (₽)", Значение: props.totals.avgOrderValue.toFixed(2) },
      { Показатель: "Средняя оценка", Значение: props.totals.avgRating },
      { Показатель: "Загруженность (%)", Значение: props.totals.occupancyPct },
      { Показатель: "Средний срок (дней)", Значение: props.totals.avgStayDays },
    ]);
    utils.book_append_sheet(wb, totalsWs, "Итоги");

    const now = new Date().toISOString().slice(0, 10);
    writeFile(wb, `reyxan-analytics-${now}.xlsx`);
  });
}

export function AnalyticsClient(props: Props) {
  const { daily, totals, serviceTypes, ordersByStatus, ratingDist } = props;
  const [view, setView] = useState<ChartView>("all");

  const chartData = daily.map((d) => ({ ...d, date: SHORT_DATE(d.date) }));

  const maxRatings = Math.max(...ratingDist.map((r) => r.count), 1);

  const STAR_COLORS = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"];

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
      {/* Export */}
      <div className="flex justify-end">
        <Button onClick={() => exportToExcel(props)} variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Экспорт в Excel</span>
          <span className="sm:hidden">Excel</span>
        </Button>
      </div>

      {/* KPI tiles — top row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={Users}
          label="Всего гостей"
          value={totals.totalGuests}
          sub={`ср. ${totals.avgStayDays} дн.`}
        />
        <StatTile
          icon={ShoppingBag}
          label="Заказов еды"
          value={totals.totalOrders}
          sub={`${totals.totalRevenue.toLocaleString("ru-RU")} ₽`}
          color="text-hotel-green"
        />
        <StatTile
          icon={ConciergeBell}
          label="Заявок сервиса"
          value={totals.totalServiceRequests}
          sub="за 30 дней"
          color="text-muted-foreground"
        />
        <StatTile
          icon={TrendingUp}
          label="Средний чек"
          value={`${totals.avgOrderValue.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽`}
          sub="за заказ"
        />
      </div>

      {/* KPI tiles — second row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          icon={Star}
          label="Рейтинг"
          value={totals.avgRating > 0 ? `${totals.avgRating} / 5` : "—"}
          sub={`${totals.totalRatings} отзывов`}
          color="text-amber-400"
          highlight={totals.avgRating >= 4}
        />
        <StatTile
          icon={BedDouble}
          label="Загруженность"
          value={`${totals.occupancyPct}%`}
          sub={`${totals.occupiedRooms} / ${totals.totalRooms} номеров`}
          color={totals.occupancyPct > 70 ? "text-hotel-green" : "text-amber-400"}
        />
        <StatTile
          icon={Calendar}
          label="Ср. срок"
          value={`${totals.avgStayDays} дн.`}
          sub="на гостя"
          color="text-blue-400"
        />
        <StatTile
          icon={TrendingUp}
          label="Выручка"
          value={`${(totals.totalRevenue / 1000).toLocaleString("ru-RU", { maximumFractionDigits: 1 })}k ₽`}
          sub="заказы еды"
          color="text-hotel-green"
        />
      </div>

      {/* Main trend chart */}
      <div className="hotel-card p-4 md:p-5">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <h2 className="font-serif text-base md:text-lg font-medium">Активность за 30 дней</h2>
          <div className="flex gap-1">
            {(["all", "guests", "orders", "service"] as ChartView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                  view === v ? "bg-gold/15 text-gold" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {v === "all" ? "Все" : v === "guests" ? "Гости" : v === "orders" ? "Заказы" : "Сервис"}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <defs>
              {(["guests", "orders", "serviceRequests"] as const).map((k, i) => (
                <linearGradient key={k} id={`grad_${k}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={Object.values(CHART_COLORS)[i]} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={Object.values(CHART_COLORS)[i]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} interval={4} />
            <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 11 }} />
            <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11 }} />
            {(view === "all" || view === "guests") && (
              <Area type="monotone" dataKey="guests" name="Гости" stroke={CHART_COLORS.guests} fill="url(#grad_guests)" strokeWidth={2} />
            )}
            {(view === "all" || view === "orders") && (
              <Area type="monotone" dataKey="orders" name="Заказы" stroke={CHART_COLORS.orders} fill="url(#grad_orders)" strokeWidth={2} />
            )}
            {(view === "all" || view === "service") && (
              <Area type="monotone" dataKey="serviceRequests" name="Сервис" stroke={CHART_COLORS.serviceRequests} fill="url(#grad_serviceRequests)" strokeWidth={2} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Mid row: service types + order statuses */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Service types */}
        <div className="hotel-card p-4 md:p-5">
          <h2 className="font-serif text-base font-medium mb-4">Топ запросов сервиса</h2>
          {serviceTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Нет данных</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={serviceTypes} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 11 }} />
                <Bar dataKey="count" name="Кол-во" fill={CHART_COLORS.guests} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Order status breakdown + pie */}
        <div className="hotel-card p-4 md:p-5">
          <h2 className="font-serif text-base font-medium mb-4">Заказы по статусам</h2>
          {ordersByStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Нет данных</p>
          ) : (
            <div className="flex gap-4 items-center">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={ordersByStatus} dataKey="count" cx="50%" cy="50%" innerRadius={30} outerRadius={55}>
                    {ordersByStatus.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {ordersByStatus.map(({ status, count }, i) => {
                  const total = ordersByStatus.reduce((s, o) => s + o.count, 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full inline-block" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          {ORDER_STATUS_LABELS[status] ?? status}
                        </span>
                        <span className="text-xs text-muted-foreground">{count} ({pct}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: ratings + occupancy */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Ratings distribution */}
        <div className="hotel-card p-4 md:p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-base font-medium">Оценки гостей</h2>
            <div className="flex items-center gap-1.5">
              {totals.avgRating > 0 && (
                <>
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-medium text-sm">{totals.avgRating}</span>
                  <span className="text-xs text-muted-foreground">({totals.totalRatings})</span>
                </>
              )}
            </div>
          </div>
          {ratingDist.every((r) => r.count === 0) ? (
            <p className="text-sm text-muted-foreground text-center py-8">Нет отзывов</p>
          ) : (
            <div className="space-y-2.5">
              {[...ratingDist].reverse().map(({ star, count }) => (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-14 flex-shrink-0">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-medium">{star}</span>
                  </div>
                  <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: maxRatings > 0 ? `${(count / maxRatings) * 100}%` : "0%",
                        background: STAR_COLORS[star - 1],
                      }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-5 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Occupancy card */}
        <div className="hotel-card p-4 md:p-5">
          <h2 className="font-serif text-base font-medium mb-4">Загруженность отеля</h2>
          <div className="flex flex-col items-center justify-center h-[160px] gap-4">
            <div className="relative flex items-center justify-center">
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--secondary))" strokeWidth="12" />
                <circle
                  cx="60" cy="60" r="50"
                  fill="none"
                  stroke={totals.occupancyPct > 70 ? "#5C8A6E" : totals.occupancyPct > 40 ? "#C9A84C" : "#6B7280"}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(totals.occupancyPct / 100) * 314} 314`}
                  strokeDashoffset="78.5"
                  transform="rotate(-90 60 60)"
                  style={{ transition: "stroke-dasharray 0.8s ease" }}
                />
              </svg>
              <div className="absolute text-center">
                <div className="font-serif text-3xl font-medium leading-none">{totals.occupancyPct}%</div>
                <div className="text-xs text-muted-foreground mt-1">заполнено</div>
              </div>
            </div>
            <div className="flex gap-6 text-sm">
              <div className="text-center">
                <div className="font-medium text-hotel-green">{totals.occupiedRooms}</div>
                <div className="text-xs text-muted-foreground">занято</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-muted-foreground">{totals.totalRooms - totals.occupiedRooms}</div>
                <div className="text-xs text-muted-foreground">свободно</div>
              </div>
              <div className="text-center">
                <div className="font-medium">{totals.totalRooms}</div>
                <div className="text-xs text-muted-foreground">всего</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

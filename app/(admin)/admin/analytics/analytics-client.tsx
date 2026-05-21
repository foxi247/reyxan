"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Users, ShoppingBag, ConciergeBell, TrendingUp } from "lucide-react";
import { ORDER_STATUS_LABELS } from "@/lib/constants";

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
  };
  serviceTypes: { name: string; count: number }[];
  ordersByStatus: { status: string; count: number }[];
  rawGuests: { id: string; created_at: string }[];
  rawOrders: { id: string; created_at: string; total: number; status: string }[];
  rawServiceReqs: { id: string; created_at: string; title: string; status: string }[];
}

type ChartView = "all" | "guests" | "orders" | "service";

const SHORT_DATE = (date: string) =>
  new Date(date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

function StatTile({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-gold",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="hotel-card p-5 flex items-center gap-4">
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gold/10`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
        <p className="font-serif text-2xl font-medium">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function exportToExcel(props: Props) {
  // Dynamically import xlsx only when needed
  import("xlsx").then(({ utils, writeFile }) => {
    const wb = utils.book_new();

    // Sheet 1: Daily stats
    const dailyWs = utils.json_to_sheet(
      props.daily.map((d) => ({
        Дата: d.date,
        "Новые гости": d.guests,
        "Заказы еды": d.orders,
        "Заявки на сервис": d.serviceRequests,
      }))
    );
    utils.book_append_sheet(wb, dailyWs, "По дням");

    // Sheet 2: Guests
    const guestsWs = utils.json_to_sheet(
      props.rawGuests.map((g) => ({
        ID: g.id,
        "Дата регистрации": g.created_at.slice(0, 10),
      }))
    );
    utils.book_append_sheet(wb, guestsWs, "Гости");

    // Sheet 3: Orders
    const ordersWs = utils.json_to_sheet(
      props.rawOrders.map((o) => ({
        ID: o.id,
        Дата: o.created_at.slice(0, 10),
        "Сумма (₽)": Number(o.total).toFixed(2),
        Статус: ORDER_STATUS_LABELS[o.status] ?? o.status,
      }))
    );
    utils.book_append_sheet(wb, ordersWs, "Заказы еды");

    // Sheet 4: Service requests
    const svcWs = utils.json_to_sheet(
      props.rawServiceReqs.map((r) => ({
        ID: r.id,
        Дата: r.created_at.slice(0, 10),
        Название: r.title,
        Статус: r.status,
      }))
    );
    utils.book_append_sheet(wb, svcWs, "Заявки на сервис");

    // Sheet 5: Totals
    const totalsWs = utils.json_to_sheet([
      { Показатель: "Всего гостей", Значение: props.totals.totalGuests },
      { Показатель: "Заказов еды", Значение: props.totals.totalOrders },
      { Показатель: "Заявок на сервис", Значение: props.totals.totalServiceRequests },
      { Показатель: "Выручка (₽)", Значение: props.totals.totalRevenue.toFixed(2) },
      { Показатель: "Средний чек (₽)", Значение: props.totals.avgOrderValue.toFixed(2) },
    ]);
    utils.book_append_sheet(wb, totalsWs, "Итоги");

    const now = new Date().toISOString().slice(0, 10);
    writeFile(wb, `reyxan-analytics-${now}.xlsx`);
  });
}

const CHART_COLORS = {
  guests: "#C9A84C",
  orders: "#5C8A6E",
  serviceRequests: "#8B7355",
};

export function AnalyticsClient(props: Props) {
  const { daily, totals, serviceTypes, ordersByStatus } = props;
  const [view, setView] = useState<ChartView>("all");

  const chartData = daily.map((d) => ({
    ...d,
    date: SHORT_DATE(d.date),
  }));

  return (
    <main className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Export button */}
      <div className="flex justify-end">
        <Button onClick={() => exportToExcel(props)} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Экспорт в Excel
        </Button>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          icon={Users}
          label="Всего гостей"
          value={totals.totalGuests}
          sub="за всё время"
        />
        <StatTile
          icon={ShoppingBag}
          label="Заказов еды"
          value={totals.totalOrders}
          sub={`Выручка: ${totals.totalRevenue.toLocaleString("ru-RU")} ₽`}
          color="text-hotel-green"
        />
        <StatTile
          icon={ConciergeBell}
          label="Заявки сервиса"
          value={totals.totalServiceRequests}
          sub="за всё время"
          color="text-muted-foreground"
        />
        <StatTile
          icon={TrendingUp}
          label="Средний чек"
          value={`${totals.avgOrderValue.toLocaleString("ru-RU", { maximumFractionDigits: 0 })} ₽`}
          sub="за заказ"
          color="text-gold"
        />
      </div>

      {/* Main area chart */}
      <div className="hotel-card p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-lg font-medium">Активность за 30 дней</h2>
          <div className="flex gap-1.5">
            {(["all", "guests", "orders", "service"] as ChartView[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  view === v
                    ? "bg-gold/15 text-gold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {v === "all" ? "Все" : v === "guests" ? "Гости" : v === "orders" ? "Заказы" : "Сервис"}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.guests} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS.guests} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="oGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.orders} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS.orders} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="sGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_COLORS.serviceRequests} stopOpacity={0.3} />
                <stop offset="95%" stopColor={CHART_COLORS.serviceRequests} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: 12,
                fontSize: 12,
              }}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            {(view === "all" || view === "guests") && (
              <Area
                type="monotone"
                dataKey="guests"
                name="Гости"
                stroke={CHART_COLORS.guests}
                fill="url(#gGradient)"
                strokeWidth={2}
              />
            )}
            {(view === "all" || view === "orders") && (
              <Area
                type="monotone"
                dataKey="orders"
                name="Заказы"
                stroke={CHART_COLORS.orders}
                fill="url(#oGradient)"
                strokeWidth={2}
              />
            )}
            {(view === "all" || view === "service") && (
              <Area
                type="monotone"
                dataKey="serviceRequests"
                name="Сервис"
                stroke={CHART_COLORS.serviceRequests}
                fill="url(#sGradient)"
                strokeWidth={2}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom row: service types + orders by status */}
      <div className="grid grid-cols-2 gap-6">
        {/* Service types bar chart */}
        <div className="hotel-card p-5">
          <h2 className="font-serif text-lg font-medium mb-5">Топ запросов сервиса</h2>
          {serviceTypes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Нет данных</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={serviceTypes}
                layout="vertical"
                margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  tickLine={false}
                  axisLine={false}
                  width={90}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" name="Кол-во" fill={CHART_COLORS.guests} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Orders by status */}
        <div className="hotel-card p-5">
          <h2 className="font-serif text-lg font-medium mb-5">Заказы по статусам</h2>
          {ordersByStatus.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Нет данных</p>
          ) : (
            <div className="space-y-3 mt-2">
              {ordersByStatus.map(({ status, count }) => {
                const total = ordersByStatus.reduce((s, o) => s + o.count, 0);
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                const colors: Record<string, string> = {
                  new: "bg-amber-400",
                  preparing: "bg-blue-400",
                  delivering: "bg-purple-400",
                  delivered: "bg-hotel-green",
                  cancelled: "bg-hotel-red",
                };
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{ORDER_STATUS_LABELS[status] ?? status}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{count}</span>
                        <Badge variant="cream" className="text-xs">{pct}%</Badge>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-full ${colors[status] ?? "bg-gold"} transition-all duration-500`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

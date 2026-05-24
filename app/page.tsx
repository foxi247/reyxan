import Link from "next/link";
import { HotelLogo } from "@/components/hotel/hotel-logo";
import { ThemeToggle } from "@/components/hotel/theme-toggle";
import { TvConnectButton } from "@/components/hotel/tv-connect-button";
import {
  Sparkles, Star, Wifi, Utensils, ConciergeBell, BedDouble,
  Phone, MapPin, ArrowRight, CalendarCheck,
} from "lucide-react";

const FEATURES = [
  { Icon: BedDouble,      title: "Уютные номера",       desc: "Комфортные номера с современным дизайном и всеми удобствами" },
  { Icon: Utensils,       title: "Рум-сервис",          desc: "Заказ еды прямо в номер через приложение в любое время" },
  { Icon: ConciergeBell,  title: "Консьерж-сервис",     desc: "Помощь с любым запросом: такси, экскурсии, советы" },
  { Icon: Wifi,           title: "Быстрый Wi-Fi",       desc: "Скоростной интернет по всей территории отеля бесплатно" },
  { Icon: Sparkles,       title: "Уборка номера",       desc: "Ежедневная уборка и смена белья по расписанию" },
  { Icon: Star,           title: "Тёплый приём",        desc: "Персонал 24/7 готов позаботиться о вашем комфорте" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <HotelLogo size="sm" />
          <div className="flex items-center gap-3">
            <ThemeToggle size="sm" />
            <Link
              href="/booking"
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <CalendarCheck className="h-4 w-4" /> Забронировать
            </Link>
            <Link
              href="/guest/register"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium gold-gradient text-white"
            >
              Войти как гость
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-gold/10 text-gold text-xs font-medium px-3 py-1.5 rounded-full mb-6">
              <Star className="h-3.5 w-3.5 fill-gold" />
              Добро пожаловать
            </div>
            <h1 className="font-serif text-5xl md:text-7xl font-medium leading-[1.05] tracking-tight mb-6">
              Отель<br />
              <span className="text-gold">Рейхан</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              Изысканный отдых в сердце города. Мы сочетаем традиционное гостеприимство
              с современным комфортом, чтобы каждый ваш день был незабываемым.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/guest/register"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-medium text-base gold-gradient text-white"
              >
                Войти как гость <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/booking"
                className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-medium text-base border-2 border-gold/30 text-gold hover:bg-gold/5 transition-colors"
              >
                <CalendarCheck className="h-5 w-5" /> Забронировать номер
              </Link>
            </div>
            <TvConnectButton />
          </div>
        </div>

        {/* Decorative circles */}
        <svg
          className="absolute right-0 top-0 -z-10 h-full w-1/2 opacity-5"
          viewBox="0 0 400 600"
          fill="none"
        >
          <circle cx="200" cy="300" r="280" stroke="hsl(32 46% 51%)" strokeWidth="1.5" />
          <circle cx="200" cy="300" r="200" stroke="hsl(32 46% 51%)" strokeWidth="1" />
          <circle cx="200" cy="300" r="120" stroke="hsl(32 46% 51%)" strokeWidth="0.5" />
        </svg>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-medium mb-3">Всё для вашего комфорта</h2>
          <p className="text-muted-foreground">Управляйте пребыванием прямо со смартфона</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ Icon, title, desc }) => (
            <div key={title} className="hotel-card p-6 space-y-4 hover:shadow-md transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10">
                <Icon className="h-6 w-6 text-gold" />
              </div>
              <div>
                <h3 className="font-medium mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-secondary/30 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-serif text-3xl font-medium mb-12">Как это работает</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Введите телефон", desc: "Укажите номер телефона для верификации заезда" },
              { step: "2", title: "Получите доступ", desc: "Администратор подтвердит заселение и откроет портал" },
              { step: "3", title: "Пользуйтесь сервисами", desc: "Заказывайте еду, вызывайте персонал, общайтесь с нами" },
            ].map(({ step, title, desc }) => (
              <div key={step} className="space-y-3">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-full gold-gradient text-white font-serif text-2xl font-medium mx-auto">
                  {step}
                </div>
                <h3 className="font-medium">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12">
            <Link
              href="/guest/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-medium gold-gradient text-white text-base"
            >
              Начать <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <HotelLogo size="sm" />
          <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> г. Дербент, Россия</span>
            <span className="flex items-center gap-1.5"><Phone className="h-4 w-4" /> +7 (xxx) xxx-xx-xx</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2024 Отель Рейхан</p>
        </div>
      </footer>
    </div>
  );
}

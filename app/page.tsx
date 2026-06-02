import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  CalendarCheck,
  ConciergeBell,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Tv,
  Utensils,
  Wifi,
} from "lucide-react";
import { HotelLogo } from "@/components/hotel/hotel-logo";
import { ThemeToggle } from "@/components/hotel/theme-toggle";
import { TvConnectButton } from "@/components/hotel/tv-connect-button";

const FEATURES = [
  {
    Icon: BedDouble,
    title: "Номера с характером",
    desc: "Тёплые интерьеры, мягкий свет и ощущение приватной резиденции в каждом номере.",
  },
  {
    Icon: Utensils,
    title: "Ресторан и room service",
    desc: "Заказ блюд и напитков прямо из гостевого кабинета или с телевизора в номере.",
  },
  {
    Icon: ConciergeBell,
    title: "Забота 24/7",
    desc: "Консьерж, уборка, запросы и чат с администрацией всегда под рукой.",
  },
  {
    Icon: Wifi,
    title: "Быстрый интернет",
    desc: "Стабильный Wi-Fi на всей территории отеля для работы и отдыха.",
  },
];

const JOURNEY = [
  {
    step: "01",
    title: "Выбираете номер",
    desc: "Гость оставляет заявку или бронирует номер через сайт отеля.",
  },
  {
    step: "02",
    title: "Проходите заселение",
    desc: "После подтверждения открывается персональный доступ к сервисам и TV-панели.",
  },
  {
    step: "03",
    title: "Управляете проживанием",
    desc: "Меню, запросы, уборка, чат и информация о выезде собираются в одном стиле.",
  },
];

const SPACES = [
  "Лендинг и бронирование",
  "Гостевой кабинет",
  "Телевизоры в номерах",
  "Премиальные сервисы",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen text-foreground">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-background/70 backdrop-blur-2xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <HotelLogo size="sm" />
          <div className="flex items-center gap-3">
            <ThemeToggle size="sm" />
            <Link
              href="/booking"
              className="hidden rounded-full border border-gold/20 px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              Забронировать
            </Link>
            <Link
              href="/guest/register"
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium gold-gradient text-gold-foreground shadow-lg shadow-black/20"
            >
              Войти как гость
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 opacity-70">
            <div className="absolute left-[8%] top-16 h-56 w-56 rounded-full bg-gold/10 blur-3xl" />
            <div className="absolute right-[10%] top-24 h-72 w-72 rounded-full bg-hotel-purple-soft/40 blur-3xl" />
            <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-background to-transparent" />
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-16 md:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="max-w-3xl">
              <div className="eyebrow mb-6">
                <Star className="h-3.5 w-3.5 fill-current" />
                Эстетика Reyhan Hotel
              </div>
              <h1 className="max-w-3xl text-5xl font-medium leading-[0.98] tracking-tight text-hotel-cream md:text-7xl">
                Сайт и сервисы отеля
                <span className="block text-gold">в едином роскошном стиле</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                Reyhan Hotel соединяет восточную атмосферу, глубокие оттенки изумрудного
                и фиолетового, золотые акценты и современные цифровые сервисы для гостей.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/booking"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 font-medium gold-gradient text-gold-foreground shadow-2xl shadow-black/25"
                >
                  <CalendarCheck className="h-5 w-5" />
                  Забронировать номер
                </Link>
                <Link
                  href="/guest/register"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/20 bg-white/5 px-7 py-4 font-medium text-hotel-cream transition-colors hover:bg-white/10"
                >
                  Личный кабинет гостя
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-2">
                {SPACES.map((item) => (
                  <div
                    key={item}
                    className="glass-panel rounded-2xl px-4 py-4 text-sm text-hotel-cream"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <TvConnectButton />
            </div>

            <div className="ornament-frame royal-panel relative overflow-hidden rounded-[32px] p-6 md:p-8">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute left-8 top-8 h-24 w-24 rounded-full border border-gold/30" />
                <div className="absolute right-10 top-12 h-40 w-40 rounded-full border border-gold/20" />
                <div className="absolute bottom-12 left-12 h-28 w-28 rounded-full border border-gold/10" />
              </div>

              <div className="relative space-y-6">
                <div className="flex items-center justify-between">
                  <HotelLogo size="sm" />
                  <span className="rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-gold">
                    Signature
                  </span>
                </div>

                <div className="rounded-[28px] border border-gold/15 bg-black/10 p-6">
                  <p className="text-sm uppercase tracking-[0.28em] text-gold/80">
                    Добро пожаловать
                  </p>
                  <h2 className="mt-4 text-3xl font-medium text-hotel-cream">
                    Атмосфера уюта, сервиса и тихой роскоши
                  </h2>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">
                    Тот же визуальный язык работает на сайте, в гостевом кабинете,
                    на телевизоре в номере и в административной панели.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {FEATURES.map(({ Icon, title, desc }) => (
                    <div key={title} className="hotel-card p-5">
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/12 text-gold">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-lg font-medium text-hotel-cream">{title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-10 md:py-14">
          <div className="rounded-[36px] border border-gold/10 bg-black/10 p-8 md:p-10">
            <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="eyebrow mb-4">Фирменный сценарий гостя</p>
                <h2 className="section-title text-hotel-cream md:text-5xl">
                  Путь гостя оформлен как единая премиальная история
                </h2>
              </div>
              <div className="max-w-md text-sm leading-7 text-muted-foreground">
                От первого касания на сайте до сервисной панели на телевизоре в номере.
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {JOURNEY.map(({ step, title, desc }) => (
                <div key={step} className="hotel-card p-6">
                  <div className="mb-5 text-sm uppercase tracking-[0.32em] text-gold">{step}</div>
                  <h3 className="text-2xl font-medium text-hotel-cream">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-12 md:py-16">
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="hotel-card p-8">
              <p className="eyebrow mb-4">Телевизоры и сервисы</p>
              <h2 className="section-title text-hotel-cream md:text-4xl">
                Интерфейсы в номере выглядят как продолжение бренда
              </h2>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Экран ожидания, приветствие, сервисная панель и сценарий выезда
                получают ту же палитру, ту же типографику и ту же атмосферу Reyhan.
              </p>
              <div className="mt-8 space-y-3">
                {[
                  "Ожидание гостя",
                  "Экран приветствия после заселения",
                  "Панель сервисов на телевизоре",
                  "Экран благодарности при выезде",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border border-gold/10 bg-white/5 px-4 py-3 text-sm text-hotel-cream"
                  >
                    <Tv className="h-4 w-4 text-gold" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {[
                {
                  Icon: ShieldCheck,
                  title: "Тихая уверенность",
                  desc: "Дизайн выглядит дорого, но остаётся удобным и понятным даже на TV-экране.",
                },
                {
                  Icon: Sparkles,
                  title: "Тёплая роскошь",
                  desc: "Изумруд, фиолетовый и золото создают атмосферу не показной, а благородной роскоши.",
                },
                {
                  Icon: Utensils,
                  title: "Сервисы ближе",
                  desc: "Ресторан, уборка, чат и консьерж доступны из любой точки цифрового пути гостя.",
                },
                {
                  Icon: MapPin,
                  title: "Локальная идентичность",
                  desc: "Орнаменты, ритм линий и акцент на деталях дают бренду характер и узнаваемость.",
                },
              ].map(({ Icon, title, desc }) => (
                <div key={title} className="hotel-card p-6">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gold/12 text-gold">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-medium text-hotel-cream">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-black/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
          <HotelLogo size="sm" />
          <div className="flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:gap-6">
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gold" />
              Дербент, Республика Дагестан
            </span>
            <span className="inline-flex items-center gap-2">
              <Phone className="h-4 w-4 text-gold" />
              +7 (900) 000-00-00
            </span>
          </div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
            Reyhan Hotel
          </p>
        </div>
      </footer>
    </div>
  );
}

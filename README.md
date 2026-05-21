# Отель Рейхан — Hotel Management MVP

Полноценный production-ready MVP сайта для отеля "Рейхан" с гостевой панелью, QR-регистрацией, чатом, меню и удобной административной панелью.

## Стек

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS** + кастомная тема
- **shadcn/ui** компоненты
- **Supabase** — Auth, Database, RLS, Realtime
- **Zod** + **React Hook Form**
- **Sonner** — toast notifications
- **next-themes** — светлая/тёмная тема

## Быстрый старт

### 1. Клонировать и установить зависимости

```bash
git clone <repo>
cd reyxan
npm install
```

### 2. Создать Supabase проект

1. Зайдите на [supabase.com](https://supabase.com) и создайте новый проект.
2. Скопируйте `Project URL` и `anon public key` из Settings → API.
3. Скопируйте `service_role key` (держите в секрете!).

### 3. Настроить переменные окружения

```bash
cp .env.example .env.local
```

Заполните `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
GUEST_SESSION_SECRET=your-random-32-char-secret-here
```

Сгенерировать секрет: `openssl rand -hex 32`

### 4. Применить миграции

В Supabase Dashboard → SQL Editor выполните содержимое файла:

```
supabase/migrations/001_initial.sql
```

### 5. Запустить seed данные

В Supabase Dashboard → SQL Editor выполните:

```
supabase/seed.sql
```

### 6. Создать первого администратора

1. В Supabase Dashboard → Authentication → Users → Add user
2. Введите email и пароль администратора
3. Скопируйте UUID созданного пользователя
4. Выполните в SQL Editor:

```sql
insert into public.profiles (id, email, full_name, role)
values ('<USER-UUID>', 'admin@reyhan.ru', 'Администратор', 'admin');
```

### 7. Запустить приложение

```bash
npm run dev
```

Приложение доступно на [http://localhost:3000](http://localhost:3000)

## Структура маршрутов

### Гостевая часть (mobile-first)

| Маршрут | Описание |
|---------|----------|
| `/guest/register` | Регистрация гостя по QR-коду |
| `/guest/pending` | Ожидание подтверждения |
| `/guest` | Главная гостевая панель |
| `/guest/chat` | Чат с администратором |
| `/guest/menu` | Меню и заказ в номер |
| `/guest/profile` | Профиль гостя |
| `/guest/expired` | Срок доступа истёк |

### Административная часть (desktop-first)

| Маршрут | Описание |
|---------|----------|
| `/admin/login` | Вход администратора |
| `/admin` | Dashboard со статистикой |
| `/admin/guests` | Управление гостями |
| `/admin/requests` | Сервисные запросы |
| `/admin/chat` | Чат со всеми гостями |
| `/admin/orders` | Заказы еды |
| `/admin/services` | CRUD сервисных кнопок |
| `/admin/settings` | Настройки отеля и QR |

## Security Model

- **Гостевые сессии**: httpOnly cookie с HMAC-подписью (SHA-256)
- **Токен хранится в БД**: только hash, не сам токен
- **Service Role Key**: только на server-side (Server Actions)
- **Anon Key**: только для безопасных публичных операций
- **RLS**: включён на всех таблицах
- **Middleware**: защищает `/admin/*` и `/guest/*`
- **Rate Limiting**: ограничение заявок по IP/phone (in-memory, для prod — Upstash Redis)
- **Валидация**: Zod на всех формах и Server Actions
- **XSS защита**: sanitize всего пользовательского ввода
- **Security Headers**: CSP, X-Frame-Options, X-Content-Type-Options и др.

## Роли

| Роль | Описание |
|------|----------|
| `admin` | Полный доступ к CRM |
| `staff` | Ограниченный доступ (в разработке) |
| Гость | Сессия через cookie, без Supabase Auth |

## Деплой на Vercel

1. Подключите репозиторий в [vercel.com](https://vercel.com)
2. Добавьте environment variables из `.env.local`
3. Vercel автоматически запустит `npm run build`
4. Деплой готов!

## Что нужно для production

- [ ] **SMS-верификация** телефона при регистрации (Twilio/SMSC)
- [ ] **Audit logs** всех действий администратора
- [ ] **Rate limiting** через [Upstash Redis](https://upstash.com) вместо in-memory
- [ ] **Admin 2FA** через TOTP или SMS
- [ ] **Backups** — настроить через Supabase
- [ ] **Monitoring** — Sentry / Datadog
- [ ] **Error tracking** — Sentry
- [ ] **QR-код** — подключить `qrcode.react`
- [ ] **Push notifications** — web push для уведомлений администратора
- [ ] **Email уведомления** — nodemailer / SendGrid
- [ ] **Тест загрузки** — убедиться в работе под нагрузкой
- [ ] **HTTPS** — Vercel предоставляет автоматически

## Переменные окружения

```env
# Supabase (обязательно)
NEXT_PUBLIC_SUPABASE_URL=         # URL проекта
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Публичный ключ
SUPABASE_SERVICE_ROLE_KEY=        # Секретный ключ (только server-side!)

# Приложение
NEXT_PUBLIC_SITE_URL=             # URL сайта (для QR-кода)
GUEST_SESSION_SECRET=             # 32+ символов, случайная строка
```

export const HOTEL_NAME = "Отель Рейхан";
export const HOTEL_TAGLINE = "Комфорт и гостеприимство";

export const ROUTES = {
  guest: {
    register: "/guest/register",
    pending: "/guest/pending",
    welcome: "/guest/welcome",
    home: "/guest",
    chat: "/guest/chat",
    menu: "/guest/menu",
    profile: "/guest/profile",
    expired: "/guest/expired",
  },
  admin: {
    login: "/admin/login",
    home: "/admin",
    chat: "/admin/chat",
    guests: "/admin/guests",
    requests: "/admin/requests",
    orders: "/admin/orders",
    services: "/admin/services",
    menu: "/admin/menu",
    analytics: "/admin/analytics",
    settings: "/admin/settings",
  },
} as const;

export const COOKIE_NAMES = {
  guestSession: "reyxan_guest_session",
} as const;

export const MAX_MESSAGE_LENGTH = 1000;
export const RATE_LIMIT_REQUESTS_PER_HOUR = 5;
export const SESSION_TTL_DAYS = 30;

export const SERVICE_ICONS: Record<string, string> = {
  concierge: "ConciergeBell",
  headphones: "Headphones",
  utensils: "Utensils",
  book: "BookOpen",
  bath: "Bath",
  headset: "Headset",
  wifi: "Wifi",
  shield: "Shield",
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  new: "Новый",
  preparing: "Готовится",
  delivering: "Доставляется",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

export const SERVICE_REQUEST_STATUS_LABELS: Record<string, string> = {
  new: "Новый",
  in_progress: "В работе",
  done: "Выполнено",
  cancelled: "Отменено",
};

export const GUEST_STATUS_LABELS: Record<string, string> = {
  active: "Проживает",
  expired: "Истёк",
  blocked: "Заблокирован",
  checked_out: "Выехал",
};

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает",
  approved: "Одобрен",
  rejected: "Отклонён",
};

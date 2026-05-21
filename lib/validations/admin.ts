import { z } from "zod";

export const approveGuestSchema = z.object({
  requestId: z.string().uuid(),
  firstName: z.string().min(1, "Введите имя").max(100),
  lastName: z.string().min(1, "Введите фамилию").max(100),
  roomNumber: z.string().min(1, "Введите номер комнаты").max(10),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Некорректная дата заезда"),
  checkOut: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Некорректная дата выезда"),
}).refine((data) => data.checkOut > data.checkIn, {
  message: "Дата выезда должна быть после даты заезда",
  path: ["checkOut"],
});

export const adminMessageSchema = z.object({
  threadId: z.string().uuid(),
  message: z
    .string()
    .min(1, "Сообщение не может быть пустым")
    .max(1000, "Сообщение слишком длинное"),
});

export const serviceSchema = z.object({
  title: z.string().min(1, "Введите название").max(100),
  description: z.string().max(500).optional(),
  icon: z.string().min(1, "Выберите иконку"),
  action_type: z.enum(["chat", "request", "page", "link"]),
  action_value: z.string().max(500).optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),
});

export const hotelSettingsSchema = z.object({
  hotel_name: z.string().min(1).max(200),
  reception_phone: z.string().max(30).optional(),
  admin_email: z.string().email().optional().or(z.literal("")),
  wifi_name: z.string().max(100).optional(),
  wifi_password: z.string().max(100).optional(),
  food_delivery_hours: z.string().max(50).optional(),
});

export const extendStaySchema = z.object({
  guestId: z.string().uuid(),
  newCheckOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Некорректная дата"),
});

export type ApproveGuestInput = z.infer<typeof approveGuestSchema>;
export type AdminMessageInput = z.infer<typeof adminMessageSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type HotelSettingsInput = z.infer<typeof hotelSettingsSchema>;
export type ExtendStayInput = z.infer<typeof extendStaySchema>;

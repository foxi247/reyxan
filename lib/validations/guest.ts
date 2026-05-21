import { z } from "zod";

export const phoneSchema = z
  .string()
  .min(10, "Введите корректный номер телефона")
  .max(20, "Номер телефона слишком длинный")
  .regex(
    /^[\d\s\+\-\(\)]+$/,
    "Номер может содержать только цифры и символы +, -, (, )"
  );

export const guestAccessRequestSchema = z.object({
  phone: phoneSchema,
});

export const messageSchema = z.object({
  message: z
    .string()
    .min(1, "Сообщение не может быть пустым")
    .max(1000, "Сообщение слишком длинное (максимум 1000 символов)"),
  threadId: z.string().uuid("Некорректный ID чата"),
});

export const orderItemSchema = z.object({
  menuItemId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
  price: z.number().min(0),
  name: z.string().min(1),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "Выберите хотя бы одно блюдо"),
});

export type PhoneInput = z.infer<typeof phoneSchema>;
export type GuestAccessRequestInput = z.infer<typeof guestAccessRequestSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;

"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getGuestSession } from "@/lib/auth/guest-session";
import { rateLimit } from "@/lib/security/rate-limit";
import { sanitizeMessage } from "@/lib/security/sanitize";
import {
  guestAccessRequestSchema,
  messageSchema,
  createOrderSchema,
} from "@/lib/validations/guest";
import type { ActionResult } from "@/types/app";
import { headers } from "next/headers";
import crypto from "crypto";

async function getClientIP(): Promise<string> {
  const headersList = await headers();
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown"
  );
}

function hashIP(ip: string): string {
  return crypto.createHash("sha256").update(ip + "salt").digest("hex").slice(0, 16);
}

export async function submitGuestAccessRequest(
  phone: string
): Promise<ActionResult<{ requestId: string }>> {
  try {
    const parsed = guestAccessRequestSchema.safeParse({ phone });
    if (!parsed.success) {
      return { success: false, error: "Некорректный номер телефона" };
    }

    const ip = await getClientIP();
    const ipHash = hashIP(ip);
    const rl = rateLimit(`guest-request:${ipHash}`, 5, 60 * 60 * 1000);
    if (!rl.allowed) {
      return { success: false, error: "Слишком много заявок. Попробуйте позже." };
    }

    const supabase = createAdminClient();
    const cleanPhone = parsed.data.phone.trim();

    const headersList = await headers();
    const userAgent = headersList.get("user-agent") ?? "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await supabase
      .from("guest_access_requests")
      .insert({
        phone: cleanPhone,
        status: "pending",
        ip_hash: ipHash,
        user_agent: userAgent.slice(0, 500),
      } as any)
      .select("id")
      .single();

    if (error) {
      console.error("Error creating guest request:", error.code);
      return { success: false, error: "Не удалось отправить заявку" };
    }

    return { success: true, data: { requestId: data.id } };
  } catch {
    return { success: false, error: "Произошла ошибка" };
  }
}

export async function getGuestAccessRequestStatus(
  requestId: string
): Promise<ActionResult<{ status: string }>> {
  try {
    if (!requestId.match(/^[0-9a-f-]{36}$/)) {
      return { success: false, error: "Некорректный ID" };
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("guest_access_requests")
      .select("status")
      .eq("id", requestId)
      .single();

    if (error || !data) {
      return { success: false, error: "Заявка не найдена" };
    }

    return { success: true, data: { status: data.status } };
  } catch {
    return { success: false, error: "Произошла ошибка" };
  }
}

export async function createServiceRequest(
  serviceId: string,
  title: string,
  message?: string
): Promise<ActionResult> {
  try {
    const session = await getGuestSession();
    if (!session) return { success: false, error: "Нет доступа" };

    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("service_requests").insert({
      guest_id: session.guestId,
      room_id: session.roomId ?? undefined,
      service_id: serviceId,
      title,
      message: message ? sanitizeMessage(message) : undefined,
      status: "new",
    } as any);

    if (error) return { success: false, error: "Не удалось создать заявку" };
    return { success: true };
  } catch {
    return { success: false, error: "Произошла ошибка" };
  }
}

export async function sendGuestMessage(
  threadId: string,
  message: string
): Promise<ActionResult> {
  try {
    const session = await getGuestSession();
    if (!session) return { success: false, error: "Нет доступа" };

    const parsed = messageSchema.safeParse({ threadId, message });
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? "Ошибка" };
    }

    const rl = rateLimit(`chat:${session.guestId}`, 30, 60 * 1000);
    if (!rl.allowed) {
      return { success: false, error: "Слишком много сообщений" };
    }

    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("chat_messages").insert({
      thread_id: parsed.data.threadId,
      sender_type: "guest",
      sender_id: session.guestId,
      message: sanitizeMessage(parsed.data.message),
    } as any);

    if (error) return { success: false, error: "Не удалось отправить сообщение" };

    await supabase
      .from("chat_threads")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", parsed.data.threadId);

    return { success: true };
  } catch {
    return { success: false, error: "Произошла ошибка" };
  }
}

export async function createRoomServiceOrder(
  items: Array<{
    menuItemId: string;
    quantity: number;
    price: number;
    name: string;
  }>
): Promise<ActionResult<{ orderId: string }>> {
  try {
    const session = await getGuestSession();
    if (!session) return { success: false, error: "Нет доступа" };

    const parsed = createOrderSchema.safeParse({ items });
    if (!parsed.success) {
      return { success: false, error: "Некорректные данные заказа" };
    }

    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const supabase = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order, error: orderError } = await supabase
      .from("room_service_orders")
      .insert({
        guest_id: session.guestId,
        room_id: session.roomId ?? undefined,
        status: "new",
        total,
      } as any)
      .select("id")
      .single();

    if (orderError || !order) {
      return { success: false, error: "Не удалось создать заказ" };
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      menu_item_id: item.menuItemId,
      quantity: item.quantity,
      price: item.price,
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: itemsError } = await supabase
      .from("room_service_order_items")
      .insert(orderItems as any);

    if (itemsError) {
      return { success: false, error: "Не удалось добавить позиции заказа" };
    }

    return { success: true, data: { orderId: order.id } };
  } catch {
    return { success: false, error: "Произошла ошибка" };
  }
}

export async function getGuestMenu() {
  try {
    const supabase = createAdminClient();
    const { data: categories } = await supabase
      .from("menu_categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    const { data: items } = await supabase
      .from("menu_items")
      .select("*")
      .eq("is_available", true);

    return { categories: categories ?? [], items: items ?? [] };
  } catch {
    return { categories: [], items: [] };
  }
}

export async function getGuestServices() {
  try {
    const session = await getGuestSession();
    if (!session) return [];

    const supabase = createAdminClient();
    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");

    return data ?? [];
  } catch {
    return [];
  }
}

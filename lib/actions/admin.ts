"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/admin";
import type { GuestAccessRequest, Guest, Room } from "@/types/app";
import { sanitizeMessage } from "@/lib/security/sanitize";
import {
  approveGuestSchema,
  adminMessageSchema,
  serviceSchema,
  hotelSettingsSchema,
  extendStaySchema,
  menuCategorySchema,
  menuItemSchema,
} from "@/lib/validations/admin";
import {
  generateGuestToken,
  generateTokenHash,
  setGuestSessionCookie,
} from "@/lib/auth/guest-session";
import type { ActionResult } from "@/types/app";
import { revalidatePath } from "next/cache";
import { sendPushToGuest } from "@/lib/push/send-push";

export async function approveGuestRequest(
  requestId: string,
  data: {
    firstName: string;
    lastName: string;
    roomNumber: string;
    checkIn: string;
    checkOut: string;
  }
): Promise<ActionResult<{ guestId: string }>> {
  try {
    await requireAdmin();
    const parsed = approveGuestSchema.safeParse({ requestId, ...data });
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? "Ошибка" };
    }

    const supabase = createAdminClient();

    // Get request
    const { data: requestRaw, error: reqError } = await supabase
      .from("guest_access_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    const request = requestRaw as GuestAccessRequest | null;

    if (reqError || !request) {
      return { success: false, error: "Заявка не найдена" };
    }
    if (request.status !== "pending") {
      return { success: false, error: "Заявка уже обработана" };
    }

    // Find or create room
    let roomId: string | null = null;
    const { data: roomRaw } = await supabase
      .from("rooms")
      .select("id")
      .eq("number", data.roomNumber)
      .single();

    const room = roomRaw as Pick<Room, "id"> | null;

    if (room) {
      roomId = room.id;
    } else {
      const { data: newRoomRaw } = await supabase
        .from("rooms")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert({ number: data.roomNumber } as any)
        .select("id")
        .single();
      const newRoom = newRoomRaw as Pick<Room, "id"> | null;
      roomId = newRoom?.id ?? null;
    }

    // Generate access token
    const token = generateGuestToken();
    const tokenHash = generateTokenHash(token);

    // Create guest
    const { data: guestRaw, error: guestError } = await supabase
      .from("guests")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({
        first_name: data.firstName,
        last_name: data.lastName,
        phone: request.phone,
        room_id: roomId,
        check_in: data.checkIn,
        check_out: data.checkOut,
        status: "active",
        access_token_hash: tokenHash,
      } as any)
      .select("id")
      .single();

    const guest = guestRaw as Pick<Guest, "id"> | null;

    if (guestError || !guest) {
      return { success: false, error: "Не удалось создать профиль гостя" };
    }

    // Update room status
    if (roomId) {
      await supabase
        .from("rooms")
        .update({ status: "occupied" })
        .eq("id", roomId);
    }

    // Create chat thread
    const { data: threadRaw } = await supabase
      .from("chat_threads")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({ guest_id: guest.id, room_id: roomId, status: "open" } as any)
      .select("id")
      .single();

    const thread = threadRaw as { id: string } | null;

    // Update request
    await supabase
      .from("guest_access_requests")
      .update({
        status: "approved",
        guest_id: guest.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    // Set guest session cookie for the approving flow
    await setGuestSessionCookie(
      {
        guestId: guest.id,
        phone: request.phone,
        roomId,
        roomNumber: data.roomNumber,
        firstName: data.firstName,
        lastName: data.lastName,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        status: "active",
        threadId: thread?.id ?? null,
      },
      data.checkOut
    );

    revalidatePath("/admin");
    return { success: true, data: { guestId: guest.id } };
  } catch {
    return { success: false, error: "Произошла ошибка" };
  }
}

export async function rejectGuestRequest(requestId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("guest_access_requests")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", requestId)
      .eq("status", "pending");

    if (error) return { success: false, error: "Не удалось отклонить заявку" };
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { success: false, error: "Произошла ошибка" };
  }
}

export async function completeGuestStay(guestId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();

    const { data: guestRaw } = await supabase
      .from("guests")
      .select("room_id")
      .eq("id", guestId)
      .single();

    const guestData = guestRaw as Pick<Guest, "room_id"> | null;

    await supabase
      .from("guests")
      .update({ status: "checked_out", updated_at: new Date().toISOString() })
      .eq("id", guestId);

    if (guestData?.room_id) {
      await supabase
        .from("rooms")
        .update({ status: "available" })
        .eq("id", guestData.room_id!);
    }

    await supabase
      .from("chat_threads")
      .update({ status: "archived" })
      .eq("guest_id", guestId);

    revalidatePath("/admin");
    revalidatePath("/admin/guests");
    return { success: true };
  } catch {
    return { success: false, error: "Произошла ошибка" };
  }
}

export async function extendGuestStay(
  guestId: string,
  newCheckOut: string
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = extendStaySchema.safeParse({ guestId, newCheckOut });
    if (!parsed.success) {
      return { success: false, error: "Некорректные данные" };
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("guests")
      .update({
        check_out: newCheckOut,
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", guestId);

    if (error) return { success: false, error: "Не удалось продлить проживание" };
    revalidatePath("/admin/guests");
    return { success: true };
  } catch {
    return { success: false, error: "Произошла ошибка" };
  }
}

export async function updateServiceRequestStatus(
  id: string,
  status: "new" | "in_progress" | "done" | "cancelled",
  etaMinutes?: number
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("service_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { success: false, error: "Не удалось обновить статус" };

    // Send automated chat notification to the guest
    if (status === "in_progress" || status === "done" || status === "cancelled") {
      const { data: reqRaw } = await supabase
        .from("service_requests")
        .select("title, guest_id")
        .eq("id", id)
        .single();
      const req = reqRaw as { title: string; guest_id: string } | null;

      if (req?.guest_id) {
        const { data: threadRaw } = await supabase
          .from("chat_threads")
          .select("id")
          .eq("guest_id", req.guest_id)
          .eq("status", "open")
          .limit(1)
          .single();
        const thread = threadRaw as { id: string } | null;

        if (thread) {
          let text = "";
          if (status === "in_progress") {
            text = etaMinutes
              ? `✅ Заявка «${req.title}» принята в работу. Ориентировочное время ожидания: ~${etaMinutes} мин.`
              : `✅ Заявка «${req.title}» принята в работу.`;
          } else if (status === "done") {
            text = `✅ Заявка «${req.title}» выполнена. Спасибо за обращение!`;
          } else if (status === "cancelled") {
            text = `❌ Заявка «${req.title}» отменена. Пожалуйста, обратитесь к администратору.`;
          }

          if (text) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await supabase.from("chat_messages").insert({
              thread_id: thread.id,
              sender_type: "admin",
              sender_id: null,
              message: text,
            } as any);
            await supabase
              .from("chat_threads")
              .update({ last_message_at: new Date().toISOString() })
              .eq("id", thread.id);
          }
        }
      }
    }

    revalidatePath("/admin/requests");
    return { success: true };
  } catch {
    return { success: false, error: "Произошла ошибка" };
  }
}

export async function sendAdminMessage(
  threadId: string,
  message: string
): Promise<ActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = adminMessageSchema.safeParse({ threadId, message });
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? "Ошибка" };
    }

    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("chat_messages").insert({
      thread_id: parsed.data.threadId,
      sender_type: "admin",
      sender_id: admin.id,
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

export async function createService(
  data: Parameters<typeof serviceSchema.parse>[0]
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = serviceSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? "Ошибка" };
    }

    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("services").insert(parsed.data as any);
    if (error) return { success: false, error: "Не удалось создать сервис" };
    revalidatePath("/admin/services");
    return { success: true };
  } catch {
    return { success: false, error: "Произошла ошибка" };
  }
}

export async function updateService(
  id: string,
  data: Parameters<typeof serviceSchema.parse>[0]
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = serviceSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? "Ошибка" };
    }

    const supabase = createAdminClient();
    const { error } = await supabase
      .from("services")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { success: false, error: "Не удалось обновить сервис" };
    revalidatePath("/admin/services");
    return { success: true };
  } catch {
    return { success: false, error: "Произошла ошибка" };
  }
}

export async function deleteService(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) return { success: false, error: "Не удалось удалить сервис" };
    revalidatePath("/admin/services");
    return { success: true };
  } catch {
    return { success: false, error: "Произошла ошибка" };
  }
}

export async function toggleService(
  id: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("services")
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { success: false, error: "Не удалось обновить статус" };
    revalidatePath("/admin/services");
    return { success: true };
  } catch {
    return { success: false, error: "Произошла ошибка" };
  }
}

export async function updateOrderStatus(
  id: string,
  status: "new" | "preparing" | "delivering" | "delivered" | "cancelled"
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("room_service_orders")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return { success: false, error: "Не удалось обновить статус" };
    revalidatePath("/admin/orders");
    return { success: true };
  } catch {
    return { success: false, error: "Произошла ошибка" };
  }
}

export async function updateHotelSettings(
  data: Parameters<typeof hotelSettingsSchema.parse>[0]
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = hotelSettingsSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? "Ошибка" };
    }

    const supabase = createAdminClient();
    const { data: existingRaw } = await supabase
      .from("hotel_settings")
      .select("id")
      .limit(1)
      .single();

    const existing = existingRaw as { id: string } | null;

    if (existing) {
      await supabase
        .from("hotel_settings")
        .update({ ...parsed.data, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.from("hotel_settings").insert(parsed.data as any);
    }

    revalidatePath("/admin/settings");
    return { success: true };
  } catch {
    return { success: false, error: "Произошла ошибка" };
  }
}

export async function adminLogout(): Promise<void> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  await supabase.auth.signOut();
}

// ── Menu Categories ────────────────────────────────────────────

export async function createMenuCategory(
  data: Parameters<typeof menuCategorySchema.parse>[0]
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = menuCategorySchema.safeParse(data);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Ошибка" };
    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("menu_categories").insert(parsed.data as any);
    if (error) return { success: false, error: "Не удалось создать категорию" };
    revalidatePath("/admin/menu");
    return { success: true };
  } catch { return { success: false, error: "Произошла ошибка" }; }
}

export async function updateMenuCategory(
  id: string,
  data: Parameters<typeof menuCategorySchema.parse>[0]
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = menuCategorySchema.safeParse(data);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Ошибка" };
    const supabase = createAdminClient();
    const { error } = await supabase.from("menu_categories").update(parsed.data).eq("id", id);
    if (error) return { success: false, error: "Не удалось обновить категорию" };
    revalidatePath("/admin/menu");
    return { success: true };
  } catch { return { success: false, error: "Произошла ошибка" }; }
}

export async function deleteMenuCategory(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase.from("menu_categories").delete().eq("id", id);
    if (error) return { success: false, error: "Не удалось удалить категорию" };
    revalidatePath("/admin/menu");
    return { success: true };
  } catch { return { success: false, error: "Произошла ошибка" }; }
}

// ── Menu Items ─────────────────────────────────────────────────

export async function createMenuItem(
  data: Parameters<typeof menuItemSchema.parse>[0]
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = menuItemSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Ошибка" };
    const supabase = createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from("menu_items").insert(parsed.data as any);
    if (error) return { success: false, error: "Не удалось создать позицию меню" };
    revalidatePath("/admin/menu");
    return { success: true };
  } catch { return { success: false, error: "Произошла ошибка" }; }
}

export async function updateMenuItem(
  id: string,
  data: Parameters<typeof menuItemSchema.parse>[0]
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const parsed = menuItemSchema.safeParse(data);
    if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message ?? "Ошибка" };
    const supabase = createAdminClient();
    const { error } = await supabase.from("menu_items").update(parsed.data).eq("id", id);
    if (error) return { success: false, error: "Не удалось обновить позицию меню" };
    revalidatePath("/admin/menu");
    return { success: true };
  } catch { return { success: false, error: "Произошла ошибка" }; }
}

export async function deleteMenuItem(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) return { success: false, error: "Не удалось удалить позицию меню" };
    revalidatePath("/admin/menu");
    return { success: true };
  } catch { return { success: false, error: "Произошла ошибка" }; }
}

export async function toggleMenuItem(id: string, isAvailable: boolean): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase.from("menu_items").update({ is_available: isAvailable }).eq("id", id);
    if (error) return { success: false, error: "Не удалось изменить доступность" };
    revalidatePath("/admin/menu");
    return { success: true };
  } catch { return { success: false, error: "Произошла ошибка" }; }
}

// ── Danger Zone ────────────────────────────────────────────────

export async function resetGuestRequests(): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    await supabase.from("guest_access_requests").delete().gte("created_at", "1900-01-01");
    revalidatePath("/admin");
    return { success: true };
  } catch { return { success: false, error: "Не удалось сбросить заявки" }; }
}

export async function fullSystemReset(): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    // Delete in dependency order
    await supabase.from("room_service_order_items").delete().gte("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("room_service_orders").delete().gte("created_at", "1900-01-01");
    await supabase.from("chat_messages").delete().gte("created_at", "1900-01-01");
    await supabase.from("chat_threads").delete().gte("created_at", "1900-01-01");
    await supabase.from("service_requests").delete().gte("created_at", "1900-01-01");
    await supabase.from("guests").delete().gte("created_at", "1900-01-01");
    await supabase.from("guest_access_requests").delete().gte("created_at", "1900-01-01");
    await supabase.from("rooms").update({ status: "available" }).gte("created_at", "1900-01-01");
    revalidatePath("/admin");
    revalidatePath("/admin/guests");
    revalidatePath("/admin/requests");
    revalidatePath("/admin/orders");
    return { success: true };
  } catch { return { success: false, error: "Не удалось выполнить полный сброс" }; }
}

// ── Rooms ──────────────────────────────────────────────────────

export async function updateRoomStatus(
  roomId: string,
  status: "available" | "occupied" | "maintenance"
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("rooms")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", roomId);
    if (error) return { success: false, error: "Не удалось обновить статус" };
    revalidatePath("/admin/rooms");
    return { success: true };
  } catch { return { success: false, error: "Произошла ошибка" }; }
}

// ── Housekeeping ───────────────────────────────────────────────

export async function scheduleRoomCleaning(roomId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const today = new Date().toISOString().slice(0, 10);
    // Upsert — avoid duplicate for same room + day
    const { data: existing } = await supabase
      .from("cleaning_records")
      .select("id")
      .eq("room_id", roomId)
      .eq("scheduled_date", today)
      .limit(1)
      .single();
    if (existing) return { success: true }; // already scheduled
    const { error } = await supabase
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .from("cleaning_records").insert({ room_id: roomId, scheduled_date: today } as any);
    if (error) return { success: false, error: "Не удалось запланировать уборку" };

    // Notify the current guest in this room
    const { data: guestRaw } = await supabase
      .from("guests")
      .select("id, first_name")
      .eq("room_id", roomId)
      .eq("status", "active")
      .limit(1)
      .single();
    const activeGuest = guestRaw as { id: string; first_name: string } | null;

    if (activeGuest) {
      const { data: threadRaw } = await supabase
        .from("chat_threads")
        .select("id")
        .eq("guest_id", activeGuest.id)
        .eq("status", "open")
        .limit(1)
        .single();
      const thread = threadRaw as { id: string } | null;
      if (thread) {
        const text = `🧹 Уважаемый(ая) ${activeGuest.first_name}, сегодня запланирована уборка вашего номера. Если вам неудобно — пожалуйста, сообщите нам.`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await supabase.from("chat_messages").insert({ thread_id: thread.id, sender_type: "admin", sender_id: null, message: text } as any);
        await supabase.from("chat_threads").update({ last_message_at: new Date().toISOString() }).eq("id", thread.id);

        await sendPushToGuest(activeGuest.id, {
          title: "Уборка номера",
          body: "Сегодня запланирована уборка вашего номера.",
          url: "/guest/chat",
          tag: "housekeeping",
        });
      }
    }

    revalidatePath("/admin/housekeeping");
    revalidatePath("/admin/rooms");
    return { success: true };
  } catch { return { success: false, error: "Произошла ошибка" }; }
}

export async function updateCleaningStatus(
  recordId: string,
  status: "pending" | "in_progress" | "done" | "skipped",
  notes?: string
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const update: Record<string, unknown> = { status };
    if (notes !== undefined) update.notes = notes;
    if (status === "done") update.completed_at = new Date().toISOString();
    const { error } = await supabase
      .from("cleaning_records")
      .update(update)
      .eq("id", recordId);
    if (error) return { success: false, error: "Не удалось обновить статус уборки" };
    revalidatePath("/admin/housekeeping");
    return { success: true };
  } catch { return { success: false, error: "Произошла ошибка" }; }
}

// ── Checkout reminder ──────────────────────────────────────────

export async function sendCheckoutReminder(guestId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { data: guestRaw } = await supabase
      .from("guests")
      .select("first_name, check_out")
      .eq("id", guestId)
      .single();
    const guest = guestRaw as { first_name: string; check_out: string } | null;
    if (!guest) return { success: false, error: "Гость не найден" };

    const { data: threadRaw } = await supabase
      .from("chat_threads")
      .select("id")
      .eq("guest_id", guestId)
      .eq("status", "open")
      .limit(1)
      .single();
    const thread = threadRaw as { id: string } | null;
    if (!thread) return { success: false, error: "Чат не найден" };

    const checkOutDate = new Date(guest.check_out).toLocaleDateString("ru-RU", {
      day: "numeric", month: "long",
    });
    const text = `🔔 Напоминание: уважаемый(ая) ${guest.first_name}, ваш выезд запланирован на ${checkOutDate}. Пожалуйста, освободите номер до 12:00. Если вам нужна помощь с багажом или продление — сообщите нам.`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await supabase.from("chat_messages").insert({
      thread_id: thread.id,
      sender_type: "admin",
      sender_id: null,
      message: text,
    } as any);
    await supabase
      .from("chat_threads")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", thread.id);

    // Push notification to guest
    await sendPushToGuest(guestId, {
      title: "Напоминание о выезде",
      body: `Уважаемый(ая) ${guest.first_name}, ваш выезд ${checkOutDate}. Пожалуйста, освободите номер до 12:00.`,
      url: "/guest/chat",
      tag: "checkout-reminder",
    });

    revalidatePath("/admin/guests");
    return { success: true };
  } catch { return { success: false, error: "Произошла ошибка" }; }
}

// ── Pre-bookings ───────────────────────────────────────────────

export async function updatePreBookingStatus(
  id: string,
  status: "pending" | "confirmed" | "cancelled" | "arrived"
): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("pre_bookings")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { success: false, error: "Не удалось обновить статус" };
    revalidatePath("/admin/bookings");
    return { success: true };
  } catch { return { success: false, error: "Произошла ошибка" }; }
}

// ── Room CRUD ──────────────────────────────────────────────────

export async function createRoom(data: {
  number: string;
  floor?: number | null;
  description?: string;
  amenities?: string;
  photo_url?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { data: room, error } = await supabase
      .from("rooms")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({ number: data.number, floor: data.floor ?? null, status: "available", description: data.description || null, amenities: data.amenities || null, photo_url: data.photo_url || null } as any)
      .select("id")
      .single();
    if (error) return { success: false, error: "Не удалось создать номер" };
    revalidatePath("/admin/rooms");
    return { success: true, data: { id: (room as { id: string }).id } };
  } catch { return { success: false, error: "Произошла ошибка" }; }
}

export async function updateRoom(id: string, data: {
  number?: string;
  floor?: number | null;
  description?: string;
  amenities?: string;
  photo_url?: string;
}): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("rooms")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return { success: false, error: "Не удалось обновить номер" };
    revalidatePath("/admin/rooms");
    return { success: true };
  } catch { return { success: false, error: "Произошла ошибка" }; }
}

export async function deleteRoom(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase.from("rooms").delete().eq("id", id);
    if (error) return { success: false, error: "Не удалось удалить номер" };
    revalidatePath("/admin/rooms");
    return { success: true };
  } catch { return { success: false, error: "Произошла ошибка" }; }
}

// ── Staff management ───────────────────────────────────────────

export async function createStaffMember(data: {
  name: string;
  role: "cleaner" | "kitchen";
  username: string;
  password: string;
}): Promise<ActionResult> {
  try {
    await requireAdmin();
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash(data.password, 12);
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("staff_members")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({ name: data.name, role: data.role, username: data.username, password_hash: passwordHash, is_active: true } as any);
    if (error?.code === "23505") return { success: false, error: "Логин уже занят" };
    if (error) return { success: false, error: "Не удалось создать аккаунт" };
    revalidatePath("/admin/staff");
    return { success: true };
  } catch { return { success: false, error: "Произошла ошибка" }; }
}

export async function updateStaffMember(id: string, data: {
  name?: string;
  is_active?: boolean;
  password?: string;
}): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.is_active !== undefined) update.is_active = data.is_active;
    if (data.password) {
      const bcrypt = await import("bcryptjs");
      update.password_hash = await bcrypt.hash(data.password, 12);
    }
    const { error } = await supabase.from("staff_members").update(update).eq("id", id);
    if (error) return { success: false, error: "Не удалось обновить сотрудника" };
    revalidatePath("/admin/staff");
    return { success: true };
  } catch { return { success: false, error: "Произошла ошибка" }; }
}

export async function deleteStaffMember(id: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase.from("staff_members").delete().eq("id", id);
    if (error) return { success: false, error: "Не удалось удалить сотрудника" };
    revalidatePath("/admin/staff");
    return { success: true };
  } catch { return { success: false, error: "Произошла ошибка" }; }
}

export async function assignCleaningTask(recordId: string, staffId: string | null): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("cleaning_records")
      .update({ assigned_to_id: staffId })
      .eq("id", recordId);
    if (error) return { success: false, error: "Не удалось назначить задание" };
    revalidatePath("/admin/housekeeping");
    return { success: true };
  } catch { return { success: false, error: "Произошла ошибка" }; }
}

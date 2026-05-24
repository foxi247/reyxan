"use server";

import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/admin";
import {
  generateGuestToken,
  generateTokenHash,
  setGuestSessionCookie,
} from "@/lib/auth/guest-session";
import type { ActionResult, GuestSession } from "@/types/app";
import { revalidatePath } from "next/cache";

export type TvState =
  | "welcome"
  | "intro_video"
  | "guest_panel"
  | "checkout_message"
  | "session_closing";

export interface CheckInData {
  roomId: string;
  checkOutDate: string; // YYYY-MM-DD
  guests: { firstName: string; lastName: string; phone?: string; isPrimary?: boolean }[];
}

// ---------------------------------------------------------------------------
// checkInRoom — creates a stay, guest records, and sets room to occupied
// ---------------------------------------------------------------------------
export async function checkInRoom(
  data: CheckInData
): Promise<ActionResult<{ stayId: string; accessToken: string }>> {
  try {
    await requireAdmin();

    const { roomId, checkOutDate, guests } = data;
    if (!guests.length) return { success: false, error: "Укажите хотя бы одного гостя" };

    const supabase = createAdminClient();

    // Check for existing active stay
    const { data: existing } = await supabase
      .from("stays")
      .select("id")
      .eq("room_id", roomId)
      .eq("status", "active")
      .maybeSingle();
    if (existing) return { success: false, error: "В этом номере уже есть активное заселение" };

    // Get room info
    const { data: room } = await supabase
      .from("rooms")
      .select("number")
      .eq("id", roomId)
      .single();
    if (!room) return { success: false, error: "Номер не найден" };

    const primary = guests.find((g) => g.isPrimary) ?? guests[0];

    // Create guest record for portal access (phone required by schema, use placeholder)
    const guestToken = generateGuestToken();
    const guestTokenHash = generateTokenHash(guestToken);
    const { data: guestRecord, error: guestErr } = await supabase
      .from("guests")
      .insert({
        first_name: primary.firstName,
        last_name: primary.lastName,
        phone: primary.phone ?? `hotel-ci-${crypto.randomBytes(4).toString("hex")}`,
        room_id: roomId,
        check_in: new Date().toISOString().slice(0, 10),
        check_out: checkOutDate,
        status: "active",
        access_token_hash: guestTokenHash,
      })
      .select("id")
      .single();
    if (guestErr || !guestRecord) {
      return { success: false, error: "Не удалось создать запись гостя" };
    }

    // Generate TV access token
    const accessToken = crypto.randomBytes(32).toString("hex");

    // Create stay
    const { data: stay, error: stayErr } = await supabase
      .from("stays")
      .insert({
        room_id: roomId,
        guest_id: guestRecord.id,
        check_out_scheduled: checkOutDate,
        tv_state: "welcome",
        tv_state_updated_at: new Date().toISOString(),
        access_token: accessToken,
      })
      .select("id")
      .single();
    if (stayErr || !stay) {
      // rollback guest
      await supabase.from("guests").delete().eq("id", guestRecord.id);
      return { success: false, error: "Не удалось создать заселение" };
    }

    // Create stay_guests
    await supabase.from("stay_guests").insert(
      guests.map((g, i) => ({
        stay_id: stay.id,
        first_name: g.firstName,
        last_name: g.lastName,
        phone: g.phone ?? null,
        is_primary: g.isPrimary ?? i === 0,
      }))
    );

    // Set room to occupied + link to guest's chat thread
    await supabase
      .from("rooms")
      .update({ status: "occupied" })
      .eq("id", roomId);

    // Ensure chat thread
    const { data: existingThread } = await supabase
      .from("chat_threads")
      .select("id")
      .eq("guest_id", guestRecord.id)
      .maybeSingle();
    if (!existingThread) {
      await supabase.from("chat_threads").insert({
        guest_id: guestRecord.id,
        room_id: roomId,
        status: "open",
      });
    }

    revalidatePath("/admin/rooms");
    return { success: true, data: { stayId: stay.id, accessToken } };
  } catch (e) {
    console.error("checkInRoom error:", e);
    return { success: false, error: "Произошла ошибка при заселении" };
  }
}

// ---------------------------------------------------------------------------
// checkOutRoom — triggers checkout_message state on TV
// ---------------------------------------------------------------------------
export async function checkOutRoom(stayId: string): Promise<ActionResult> {
  try {
    await requireAdmin();
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("stays")
      .update({
        tv_state: "checkout_message",
        tv_state_updated_at: new Date().toISOString(),
      })
      .eq("id", stayId)
      .eq("status", "active");

    if (error) return { success: false, error: "Не удалось начать выселение" };

    revalidatePath("/admin/rooms");
    return { success: true };
  } catch {
    return { success: false, error: "Произошла ошибка" };
  }
}

// ---------------------------------------------------------------------------
// advanceTvState — called by TV client to move to the next state
// ---------------------------------------------------------------------------
const VALID_TRANSITIONS: Record<string, string[]> = {
  welcome: ["intro_video", "guest_panel"],
  intro_video: ["guest_panel"],
  checkout_message: ["session_closing"],
  session_closing: ["idle"],
};

export async function advanceTvState(
  stayId: string,
  fromState: string,
  toState: string
): Promise<ActionResult> {
  try {
    const supabase = createAdminClient();

    const allowed = VALID_TRANSITIONS[fromState] ?? [];
    if (!allowed.includes(toState)) {
      return { success: false, error: "Недопустимый переход состояния" };
    }

    const { data: stay, error: fetchErr } = await supabase
      .from("stays")
      .select("id, tv_state, room_id")
      .eq("id", stayId)
      .eq("status", "active")
      .single();

    if (fetchErr || !stay) return { success: false, error: "Заселение не найдено" };
    if (stay.tv_state !== fromState) return { success: false, error: "Состояние уже изменено" };

    if (toState === "idle") {
      // Finalize checkout
      await supabase
        .from("stays")
        .update({
          status: "checked_out",
          checked_out_at: new Date().toISOString(),
          tv_state: "idle",
          tv_state_updated_at: new Date().toISOString(),
        })
        .eq("id", stayId);

      // Free the room and mark guest as checked out
      await supabase
        .from("rooms")
        .update({ status: "available" })
        .eq("id", stay.room_id);

      const { data: stayRow } = await supabase
        .from("stays")
        .select("guest_id")
        .eq("id", stayId)
        .single();
      if (stayRow?.guest_id) {
        await supabase
          .from("guests")
          .update({ status: "checked_out" })
          .eq("id", stayRow.guest_id);
      }
    } else {
      await supabase
        .from("stays")
        .update({
          tv_state: toState,
          tv_state_updated_at: new Date().toISOString(),
        })
        .eq("id", stayId);
    }

    return { success: true };
  } catch {
    return { success: false, error: "Произошла ошибка" };
  }
}

// ---------------------------------------------------------------------------
// accessStayByToken — validates TV QR token, sets guest session
// ---------------------------------------------------------------------------
export async function accessStayByToken(token: string): Promise<{
  ok: boolean;
  session?: GuestSession;
  checkOutDate?: string;
  error?: string;
}> {
  try {
    const supabase = createAdminClient();

    const { data: stay } = await supabase
      .from("stays")
      .select("id, guest_id, check_out_scheduled, room_id, status, stay_guests(*)")
      .eq("access_token", token)
      .eq("status", "active")
      .maybeSingle();

    if (!stay) return { ok: false, error: "Токен недействителен или заселение завершено" };

    const { data: guest } = await supabase
      .from("guests")
      .select("id, first_name, last_name, phone, check_in, check_out, room_id, status")
      .eq("id", stay.guest_id)
      .maybeSingle();
    if (!guest) return { ok: false, error: "Гость не найден" };

    const { data: room } = await supabase
      .from("rooms")
      .select("id, number")
      .eq("id", stay.room_id)
      .maybeSingle();

    const { data: thread } = await supabase
      .from("chat_threads")
      .select("id")
      .eq("guest_id", guest.id)
      .maybeSingle();

    const session: GuestSession = {
      guestId: guest.id,
      phone: guest.phone,
      roomId: room?.id ?? null,
      roomNumber: room?.number ?? null,
      firstName: guest.first_name,
      lastName: guest.last_name,
      checkIn: guest.check_in,
      checkOut: guest.check_out,
      status: guest.status,
      threadId: thread?.id ?? null,
    };

    return { ok: true, session, checkOutDate: stay.check_out_scheduled };
  } catch {
    return { ok: false, error: "Произошла ошибка" };
  }
}

import { createAdminClient } from "@/lib/supabase/admin";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY ?? "";

export async function sendPushToGuest(
  guestId: string,
  payload: { title: string; body: string; url?: string; tag?: string }
) {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return;
  try {
    const webpush = (await import("web-push")).default;
    webpush.setVapidDetails("mailto:admin@hotel-reyhan.ru", VAPID_PUBLIC, VAPID_PRIVATE);

    const supabase = createAdminClient();
    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth_key")
      .eq("guest_id", guestId);

    if (!subs || subs.length === 0) return;

    const payloadStr = JSON.stringify(payload);
    await Promise.allSettled(
      subs.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          payloadStr
        ).catch(async (err: { statusCode?: number }) => {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          }
        })
      )
    );
  } catch {
    // Push is best-effort — don't throw
  }
}

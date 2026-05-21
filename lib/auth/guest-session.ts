import { cookies } from "next/headers";
import crypto from "crypto";
import type { GuestSession } from "@/types/app";
import { COOKIE_NAMES } from "@/lib/constants";

const SECRET = process.env.GUEST_SESSION_SECRET ?? "dev-secret-change-in-production";

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateGuestToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateTokenHash(token: string): string {
  return hashToken(token);
}

export async function setGuestSessionCookie(
  session: GuestSession,
  checkOutDate: string
): Promise<void> {
  const cookieStore = await cookies();
  const payload = JSON.stringify(session);
  const signature = sign(payload);
  const value = Buffer.from(
    JSON.stringify({ payload, signature })
  ).toString("base64");

  const expires = new Date(checkOutDate);
  expires.setDate(expires.getDate() + 1);

  cookieStore.set(COOKIE_NAMES.guestSession, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function getGuestSession(): Promise<GuestSession | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(COOKIE_NAMES.guestSession)?.value;
    if (!raw) return null;

    const decoded = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
    const { payload, signature } = decoded as {
      payload: string;
      signature: string;
    };

    const expectedSig = sign(payload);
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    return JSON.parse(payload) as GuestSession;
  } catch {
    return null;
  }
}

export async function clearGuestSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAMES.guestSession);
}

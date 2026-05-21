import { cookies } from "next/headers";
import crypto from "crypto";

const SECRET = process.env.STAFF_SESSION_SECRET ?? "dev-staff-secret-change-in-prod";
const COOKIE_NAME = "reyxan_staff_session";

export interface StaffSession {
  staffId: string;
  name: string;
  role: "cleaner" | "kitchen";
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
}

export async function setStaffSessionCookie(session: StaffSession): Promise<void> {
  const cookieStore = await cookies();
  const payload = JSON.stringify(session);
  const signature = sign(payload);
  const value = Buffer.from(JSON.stringify({ payload, signature })).toString("base64");

  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours
  });
}

export async function getStaffSession(): Promise<StaffSession | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(COOKIE_NAME)?.value;
    if (!raw) return null;

    const decoded = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
    const { payload, signature } = decoded as { payload: string; signature: string };
    const expected = sign(payload);

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    return JSON.parse(payload) as StaffSession;
  } catch {
    return null;
  }
}

export async function clearStaffSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function getStaffSessionFromCookieValue(raw: string): StaffSession | null {
  try {
    const decoded = JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
    const { payload, signature } = decoded as { payload: string; signature: string };
    const expected = sign(payload);
    if (signature.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    return JSON.parse(payload) as StaffSession;
  } catch {
    return null;
  }
}

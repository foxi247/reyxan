import { redirect } from "next/navigation";
import { getGuestSession, clearGuestSession } from "@/lib/auth/guest-session";
import { isGuestExpired, formatDate } from "@/lib/utils";
import { GuestProfileClient } from "./profile-client";
import { ROUTES } from "@/lib/constants";

export default async function GuestProfilePage() {
  const session = await getGuestSession();

  if (!session) redirect(ROUTES.guest.register);
  if (isGuestExpired(session.checkOut)) redirect(ROUTES.guest.expired);

  return <GuestProfileClient session={session} />;
}

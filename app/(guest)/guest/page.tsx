import { redirect } from "next/navigation";
import { getGuestSession } from "@/lib/auth/guest-session";
import { isGuestExpired, formatDateRange } from "@/lib/utils";
import { getGuestServices } from "@/lib/actions/guest";
import { GuestHomeClient } from "./guest-home-client";
import { ROUTES } from "@/lib/constants";

export default async function GuestHomePage() {
  const session = await getGuestSession();

  if (!session) {
    redirect(ROUTES.guest.register);
  }

  if (session.status === "blocked" || session.status === "checked_out") {
    redirect(ROUTES.guest.expired);
  }

  if (isGuestExpired(session.checkOut)) {
    redirect(ROUTES.guest.expired);
  }

  const services = await getGuestServices();

  return (
    <GuestHomeClient
      session={session}
      services={services}
      dateRange={formatDateRange(session.checkIn, session.checkOut)}
    />
  );
}

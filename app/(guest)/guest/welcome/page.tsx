import { redirect } from "next/navigation";
import { getGuestSession } from "@/lib/auth/guest-session";
import { ROUTES } from "@/lib/constants";
import { WelcomeClient } from "./welcome-client";

export default async function GuestWelcomePage() {
  const session = await getGuestSession();
  if (!session) redirect(ROUTES.guest.register);

  return (
    <WelcomeClient
      firstName={session.firstName}
      lastName={session.lastName}
      roomNumber={session.roomNumber ?? ""}
      checkIn={session.checkIn}
      checkOut={session.checkOut}
    />
  );
}

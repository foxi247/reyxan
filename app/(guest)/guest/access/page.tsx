import { redirect } from "next/navigation";
import { accessStayByToken } from "@/lib/actions/stays";
import { setGuestSessionCookie } from "@/lib/auth/guest-session";

export default async function GuestAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    redirect("/guest/expired");
  }

  const result = await accessStayByToken(token);

  if (!result.ok || !result.session || !result.checkOutDate) {
    redirect("/guest/expired");
  }

  await setGuestSessionCookie(result.session, result.checkOutDate);
  redirect("/guest");
}

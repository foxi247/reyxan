import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next({ request });

  // Check guest session for protected guest routes
  const guestProtected = ["/guest/chat", "/guest/menu", "/guest/profile"];
  const guestProtectedExact = ["/guest"];

  const isGuestProtected =
    guestProtected.some((p) => pathname.startsWith(p)) ||
    guestProtectedExact.includes(pathname);

  if (isGuestProtected) {
    const sessionCookie = request.cookies.get("reyxan_guest_session");
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/guest/register", request.url));
    }
  }

  // Admin routes protection
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/guest/:path*", "/admin/:path*"],
};

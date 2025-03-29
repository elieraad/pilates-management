import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // Check for authentication and license status
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protect routes that require authentication
  const protectedPaths = ["/dashboard", "/classes", "/bookings", "/settings"];
  const isProtectedPath = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (isProtectedPath && !session) {
    // Redirect to login if not authenticated
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If authenticated, check license status for protected paths
  if (isProtectedPath && session) {
    const { data: license, error } = await supabase
      .from("licenses")
      .select("*")
      .eq("studio_id", session.user.id)
      .eq("is_active", true)
      .gt("end_date", new Date().toISOString())
      .limit(1)
      .single();

    // If no active license, redirect to license renewal page
    if (error || !license) {
      // Allow access to settings page for license renewal
      if (!request.nextUrl.pathname.startsWith("/settings/license")) {
        return NextResponse.redirect(new URL("/settings/license", request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const isRecruiterRoute = pathname.startsWith("/recruiter");
  const isPublicAuthPage =
    pathname === "/recruiter/login" ||
    pathname === "/recruiter/reset-password";

  // Protect recruiter pages
  if (isRecruiterRoute && !isPublicAuthPage && !user) {
    const loginUrl = request.nextUrl.clone();

    loginUrl.pathname = "/recruiter/login";
    loginUrl.searchParams.set("redirect", pathname);

    return NextResponse.redirect(loginUrl);
  }

  if (isRecruiterRoute && !isPublicAuthPage && user) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role,status")
      .eq("id", user.id)
      .maybeSingle();

    const role = String(profile?.role || "").toLowerCase();
    const status = String(profile?.status || "").toLowerCase();
    const isRecruiter = ["owner", "admin", "super_admin", "recruiter"].includes(
      role
    );
    const isActive = !status || status === "active";

    if (profileError || !profile || !isRecruiter || !isActive) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/recruiter/login";
      loginUrl.searchParams.set("error", "unauthorized");
      return NextResponse.redirect(loginUrl);
    }
  }

  // Already logged in → don't show login page
  if (pathname === "/recruiter/login" && user) {
    return NextResponse.redirect(
      new URL("/recruiter", request.url)
    );
  }

  return response;
}

export const config = {
  matcher: ["/recruiter/:path*"],
};

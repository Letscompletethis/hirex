import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isActiveProfileStatus, isPrivilegedRole, isRecruiterRole, normalizeRole } from "./lib/roles";

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
  const isRecruiterManagementRoute =
    pathname === "/recruiter/recruiters" ||
    pathname.startsWith("/recruiter/recruiters/") ||
    pathname === "/recruiter/users";
  const isOwnerBusinessDevelopmentRoute =
    pathname === "/recruiter/business-development";

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

    const role = normalizeRole(profile?.role);
    const isRecruiter = isRecruiterRole(role);
    const isActive = isActiveProfileStatus(profile?.status);

    if (isRecruiterManagementRoute && !isPrivilegedRole(role)) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/recruiter";
      loginUrl.searchParams.set("error", "forbidden");
      return NextResponse.redirect(loginUrl);
    }

    if (isOwnerBusinessDevelopmentRoute && role !== "owner") {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/recruiter";
      loginUrl.searchParams.set("error", "forbidden");
      return NextResponse.redirect(loginUrl);
    }

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

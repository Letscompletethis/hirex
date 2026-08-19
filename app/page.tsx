import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
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

const isRecruiterRoute = request.nextUrl.pathname.startsWith("/recruiter");
const isLoginPage = request.nextUrl.pathname === "/recruiter/login";

if (isRecruiterRoute && !isLoginPage && !user) {
const loginUrl = request.nextUrl.clone();

loginUrl.pathname = "/recruiter/login";
loginUrl.searchParams.set(
  "redirect",
  request.nextUrl.pathname
);


return NextResponse.redirect(loginUrl);

}

if (isLoginPage && user) {
return NextResponse.redirect(
new URL("/recruiter", request.url)
);
}

return response;
}

export const config = {
matcher: [
"/recruiter/:path*",
],
};
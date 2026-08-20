import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

if (
  !supabaseUrl ||
  !supabasePublishableKey ||
  !supabaseServiceRoleKey
) {
  throw new Error("Missing Supabase environment variables.");
}

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const supabaseAuth = createClient(
  supabaseUrl,
  supabasePublishableKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const authorization =
      request.headers.get("authorization");

    if (!authorization?.startsWith("Bearer ")) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const accessToken = authorization
      .replace("Bearer ", "")
      .trim();

    if (!accessToken) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser(
      accessToken
    );

    if (authError || !user) {
      console.error(
        "Reset password authorization error:",
        authError
      );

      return NextResponse.json(
        {
          error:
            "Your session has expired. Please log in again.",
        },
        {
          status: 401,
        }
      );
    }

    const body = await request.json();

    const password = String(
      body?.password || ""
    );

    if (password.length < 8) {
      return NextResponse.json(
        {
          error:
            "Your password must be at least 8 characters long.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: profile,
      error: profileError,
    } = await supabaseAdmin
      .from("profiles")
      .select(
        "id,status,must_change_password"
      )
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      console.error(
        "Reset password profile lookup error:",
        profileError
      );

      return NextResponse.json(
        {
          error:
            "Your HireX profile could not be found.",
        },
        {
          status: 404,
        }
      );
    }

    if (profile.status !== "active") {
      return NextResponse.json(
        {
          error:
            "Your HireX account is inactive.",
        },
        {
          status: 403,
        }
      );
    }

    const {
      data: updatedAuthUser,
      error: passwordError,
    } =
      await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
          password,
        }
      );

    if (
      passwordError ||
      !updatedAuthUser.user
    ) {
      console.error(
        "Update password error:",
        passwordError
      );

      return NextResponse.json(
        {
          error:
            passwordError?.message ||
            "Unable to update your password.",
        },
        {
          status: 500,
        }
      );
    }

    const {
      data: updatedProfile,
      error: profileUpdateError,
    } = await supabaseAdmin
      .from("profiles")
      .update({
        must_change_password: false,
      })
      .eq("id", user.id)
      .select(
        "id,status,must_change_password"
      )
      .single();

    if (
      profileUpdateError ||
      !updatedProfile ||
      updatedProfile.must_change_password !==
        false
    ) {
      console.error(
        "Update password flag error:",
        profileUpdateError,
        updatedProfile
      );

      return NextResponse.json(
        {
          error:
            "Your password was changed, but HireX could not finish updating your account.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Your password has been changed successfully.",
    });
  } catch (error) {
    console.error(
      "Reset password API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to change your password.",
      },
      {
        status: 500,
      }
    );
  }
}
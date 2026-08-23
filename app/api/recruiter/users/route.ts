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

async function getAuthorizedUser(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED");
  }

  const accessToken = authorization
    .replace("Bearer ", "")
    .trim();

  if (!accessToken) {
    throw new Error("UNAUTHORIZED");
  }

  const supabaseAuth = createClient(
    supabaseUrl!,
    supabasePublishableKey!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await supabaseAuth.auth.getUser(accessToken);

  if (authError || !user) {
    throw new Error("UNAUTHORIZED");
  }

  const {
    data: profile,
    error: profileError,
  } = await supabaseAdmin
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("PROFILE_NOT_FOUND");
  }

  const role = String(
    profile.role || ""
  ).toLowerCase();

  if (role !== "owner" && role !== "admin") {
    throw new Error("FORBIDDEN");
  }

  return {
    user,
    role,
  };
}

/* =========================================================
   GET USERS
   ========================================================= */

export async function GET(request: NextRequest) {
  try {
    await getAuthorizedUser(request);

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("profiles")
      .select(
        "id,email,full_name,role,status,must_change_password,created_at"
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("Load users error:", error);

      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    const authById = new Map(
      (authUsers.users || []).map((authUser) => [authUser.id, authUser])
    );

    return NextResponse.json({
      users: (data || []).map((profile) => {
        const authUser = authById.get(profile.id);
        return {
          ...profile,
          email_confirmed_at: authUser?.email_confirmed_at || null,
          last_sign_in_at: authUser?.last_sign_in_at || null,
        };
      }),
    });
  } catch (error) {
    console.error("Get users error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to load users.";

    const status =
      message === "UNAUTHORIZED"
        ? 401
        : message === "FORBIDDEN"
          ? 403
          : message === "PROFILE_NOT_FOUND"
            ? 403
            : 500;

    return NextResponse.json(
      {
        error: message,
      },
      {
        status,
      }
    );
  }
}

/* =========================================================
   CREATE USER
   ========================================================= */

export async function POST(request: NextRequest) {
  try {
    const { user: currentUser } =
      await getAuthorizedUser(request);

    const body = await request.json();

    const fullName = String(
      body?.fullName || ""
    ).trim();

    const email = String(
      body?.email || ""
    )
      .trim()
      .toLowerCase();

    const role = String(
      body?.role || "recruiter"
    ).toLowerCase();

    if (!fullName) {
      return NextResponse.json(
        {
          error: "Full name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          error: "Email is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      role !== "recruiter" &&
      role !== "admin" &&
      role !== "owner"
    ) {
      return NextResponse.json(
        {
          error: "Invalid user role.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Prevent duplicate HireX accounts.
     */
    const {
      data: existingProfile,
    } = await supabaseAdmin
      .from("profiles")
      .select("id,email")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        {
          error:
            "A HireX profile already exists for this email.",
        },
        {
          status: 409,
        }
      );
    }

    /*
     * Generate the standard temporary password.
     *
     * The administrator gives this password to the
     * new employee.
     *
     * No invitation email is sent.
     */
    const temporaryPassword =
      "HireX@" +
      Math.random()
        .toString(36)
        .slice(-8) +
      "9!";

    /*
     * Create the Supabase authentication account.
     */
    const {
      data: createdAuthUser,
      error: createError,
    } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role,
        },
      });

    if (
      createError ||
      !createdAuthUser.user
    ) {
      console.error(
        "Create auth user error:",
        createError
      );

      return NextResponse.json(
        {
          error:
            createError?.message ||
            "Unable to create the authentication account.",
        },
        {
          status: 500,
        }
      );
    }

    const newUser =
      createdAuthUser.user;

    /*
     * IMPORTANT:
     *
     * HireX already has a database trigger that creates
     * the profiles row automatically when the Auth user
     * is created.
     *
     * Therefore we MUST NOT INSERT another profile.
     *
     * We update the automatically-created profile instead.
     */

    let profileUpdated = false;

    /*
     * Try the profile update a few times because the
     * database trigger may take a moment to finish.
     */
    for (let attempt = 0; attempt < 5; attempt++) {
      const {
        data: existingProfileForUser,
        error: profileLookupError,
      } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", newUser.id)
        .maybeSingle();

      if (profileLookupError) {
        console.error(
          "Profile lookup error:",
          profileLookupError
        );
      }

      if (existingProfileForUser) {
        const {
          error: profileUpdateError,
        } = await supabaseAdmin
          .from("profiles")
          .update({
            email,
            full_name: fullName,
            role,
            status: "active",
            must_change_password: true,
          })
          .eq("id", newUser.id);

        if (profileUpdateError) {
          console.error(
            "Profile update error:",
            profileUpdateError
          );

          await supabaseAdmin.auth.admin.deleteUser(
            newUser.id
          );

          return NextResponse.json(
            {
              error:
                "The authentication account was created, but the HireX profile could not be updated.",
            },
            {
              status: 500,
            }
          );
        }

        profileUpdated = true;
        break;
      }

      /*
       * Give the database trigger a moment to create
       * the profile before checking again.
       */
      await new Promise((resolve) =>
        setTimeout(resolve, 300)
      );
    }

    /*
     * If the trigger did not create the profile,
     * stop and remove the Auth account rather than
     * leaving a broken user behind.
     */
    if (!profileUpdated) {
      console.error(
        "Profile was not created by the database trigger."
      );

      await supabaseAdmin.auth.admin.deleteUser(
        newUser.id
      );

      return NextResponse.json(
        {
          error:
            "The authentication account was created, but the HireX profile was not created. No broken account was left behind.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      message:
        "User created successfully. Give the temporary password to the user. They must create their own password after their first login.",
      temporaryPassword,
      user: {
        id: newUser.id,
        email,
        full_name: fullName,
        role,
      },
      createdBy: currentUser.id,
    });
  } catch (error) {
    console.error(
      "Create user error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to create the user.";

    const status =
      message === "UNAUTHORIZED"
        ? 401
        : message === "FORBIDDEN"
          ? 403
          : 500;

    return NextResponse.json(
      {
        error: message,
      },
      {
        status,
      }
    );
  }
}

/* =========================================================
   UPDATE USER STATUS
   ========================================================= */

export async function PATCH(
  request: NextRequest
) {
  try {
    const { user: currentUser } =
      await getAuthorizedUser(request);

    const body = await request.json();

    const userId = String(
      body?.userId || ""
    ).trim();

    const status = String(
      body?.status || ""
    ).toLowerCase();

    if (!userId) {
      return NextResponse.json(
        {
          error: "User ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      status !== "active" &&
      status !== "inactive"
    ) {
      return NextResponse.json(
        {
          error: "Invalid account status.",
        },
        {
          status: 400,
        }
      );
    }

    if (userId === currentUser.id) {
      return NextResponse.json(
        {
          error:
            "You cannot change the status of your own account.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: targetUser,
      error: targetError,
    } = await supabaseAdmin
      .from("profiles")
      .select("id,role")
      .eq("id", userId)
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json(
        {
          error: "User not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      currentUser.user_metadata?.role !== "owner" &&
      targetUser.role !== "recruiter"
    ) {
      return NextResponse.json(
        {
          error:
            "Only owners can change the status of admin or owner accounts.",
        },
        {
          status: 403,
        }
      );
    }

    const {
      error: updateError,
    } = await supabaseAdmin
      .from("profiles")
      .update({
        status,
      })
      .eq("id", userId);

    if (updateError) {
      console.error(
        "Update user status error:",
        updateError
      );

      return NextResponse.json(
        {
          error: updateError.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Also block/unblock the Supabase Auth account.
     */
    if (status === "inactive") {
      const {
        error: authError,
      } =
        await supabaseAdmin.auth.admin.updateUserById(
          userId,
          {
            ban_duration: "876000h",
          }
        );

      if (authError) {
        console.error(
          "Ban auth user error:",
          authError
        );
      }
    } else {
      const {
        error: authError,
      } =
        await supabaseAdmin.auth.admin.updateUserById(
          userId,
          {
            ban_duration: "none",
          }
        );

      if (authError) {
        console.error(
          "Unban auth user error:",
          authError
        );
      }
    }

    return NextResponse.json({
      message:
        status === "active"
          ? "User activated successfully."
          : "User deactivated successfully.",
    });
  } catch (error) {
    console.error(
      "Update user status error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to update the user.";

    const status =
      message === "UNAUTHORIZED"
        ? 401
        : message === "FORBIDDEN"
          ? 403
          : 500;

    return NextResponse.json(
      {
        error: message,
      },
      {
        status,
      }
    );
  }
}

/* =========================================================
   DELETE USER
   ========================================================= */

export async function DELETE(
  request: NextRequest
) {
  try {
    const { user: currentUser } =
      await getAuthorizedUser(request);

    const body = await request.json();

    const userId = String(
      body?.userId || ""
    ).trim();

    if (!userId) {
      return NextResponse.json(
        {
          error: "User ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (userId === currentUser.id) {
      return NextResponse.json(
        {
          error:
            "You cannot remove your own account.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: targetProfile,
      error: targetProfileError,
    } = await supabaseAdmin
      .from("profiles")
      .select(
        "id,email,full_name,role"
      )
      .eq("id", userId)
      .single();

    if (
      targetProfileError ||
      !targetProfile
    ) {
      return NextResponse.json(
        {
          error: "User not found.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      targetProfile.role === "owner"
    ) {
      return NextResponse.json(
        {
          error:
            "Owner accounts cannot be removed from User Management.",
        },
        {
          status: 403,
        }
      );
    }

    /*
     * Delete the Auth account first.
     *
     * If the profiles table has a foreign-key relationship
     * or cascade, this is the safest order.
     */
    const {
      error: authDeleteError,
    } =
      await supabaseAdmin.auth.admin.deleteUser(
        userId
      );

    if (authDeleteError) {
      console.error(
        "Delete auth user error:",
        authDeleteError
      );

      return NextResponse.json(
        {
          error:
            authDeleteError.message ||
            "Unable to delete the authentication account.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Remove the profile as well.
     */
    const {
      error: profileDeleteError,
    } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileDeleteError) {
      console.error(
        "Delete profile error:",
        profileDeleteError
      );

      return NextResponse.json(
        {
          error:
            "The authentication account was removed, but the HireX profile could not be removed. Please check the profiles table.",
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      message: `${
        targetProfile.full_name ||
        targetProfile.email ||
        "User"
      } was permanently removed from HireX.`,
    });
  } catch (error) {
    console.error(
      "Remove recruiter user error:",
      error
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to remove the user.";

    const status =
      message === "UNAUTHORIZED"
        ? 401
        : message === "FORBIDDEN"
          ? 403
          : 500;

    return NextResponse.json(
      {
        error: message,
      },
      {
        status,
      }
    );
  }
}
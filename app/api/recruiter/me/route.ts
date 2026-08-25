import { NextRequest, NextResponse } from "next/server";
import { requireAuthorizedHireXUser } from "../../../../lib/server-auth";

export async function GET(request: NextRequest) {
  try {
    const { user, role } = await requireAuthorizedHireXUser(request);
    return NextResponse.json({ user: { id: user.id, email: user.email || "", fullName: user.user_metadata?.full_name || user.user_metadata?.name || "" }, role });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNAUTHORIZED";
    const status = message === "UNAUTHORIZED" ? 401 : message === "PROFILE_UNAVAILABLE" ? 403 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}

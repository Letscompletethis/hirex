import { NextRequest, NextResponse } from "next/server";
import { disconnectGoogleDrive } from "../../../../../lib/google-drive";
import { getServiceRoleClient, requireBearerUser } from "../../../../../lib/integration-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await requireBearerUser(request);
    const result = await disconnectGoogleDrive();
    const database = getServiceRoleClient();
    const { error } = await database.from("google_drive_connections").delete().eq("provider", "google_drive");
    if (error) throw new Error(error.message);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to disconnect Google Drive." }, { status: 502 });
  }
}
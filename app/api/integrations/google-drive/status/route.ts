import { NextResponse } from "next/server";
import { getGoogleDriveStatus } from "../../../../../lib/google-drive";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await getGoogleDriveStatus());
}
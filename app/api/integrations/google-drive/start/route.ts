import { NextResponse } from "next/server";
import { getGoogleDriveAuthorizationUrl, GoogleDriveConfigurationError } from "../../../../../lib/google-drive";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.redirect(getGoogleDriveAuthorizationUrl());
  } catch (error) {
    const message = error instanceof GoogleDriveConfigurationError ? error.message : "Unable to start Google Drive OAuth.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
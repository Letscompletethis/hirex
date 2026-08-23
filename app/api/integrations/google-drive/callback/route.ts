import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleDriveCode, GoogleDriveConfigurationError, HIREX_DRIVE_ACCOUNT, encryptDriveToken } from "../../../../../lib/google-drive";
import { getServiceRoleClient } from "../../../../../lib/integration-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get("error");
  const code = request.nextUrl.searchParams.get("code");
  if (error) return NextResponse.json({ error: `Google OAuth was declined: ${error}.` }, { status: 400 });
  if (!code) return NextResponse.json({ error: "Google OAuth callback is missing its code." }, { status: 400 });

  try {
    const tokens = await exchangeGoogleDriveCode(code);
    if (!tokens.refresh_token) {
      throw new GoogleDriveConfigurationError("Google did not return a refresh token. Reconnect with consent enabled.");
    }
    const stored = await getServiceRoleClient().from("google_drive_connections").upsert({
      provider: "google_drive",
      account_email: HIREX_DRIVE_ACCOUNT,
      encrypted_refresh_token: encryptDriveToken(tokens.refresh_token),
      updated_at: new Date().toISOString(),
    }, { onConflict: "provider" });
    if (stored.error) throw new Error(stored.error.message);
    return NextResponse.json({
      connected: true,
      accountEmail: HIREX_DRIVE_ACCOUNT,
      refreshTokenConfigured: true,
      message: `Connected as ${HIREX_DRIVE_ACCOUNT}`,
      persistence: "OAuth tokens are not returned or stored by HireX. Configure the refresh token securely as GOOGLE_DRIVE_REFRESH_TOKEN before uploading.",
    });
  } catch (caught) {
    const message = caught instanceof GoogleDriveConfigurationError ? caught.message : caught instanceof Error ? caught.message : "Google OAuth callback failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const DRIVE_API = "https://www.googleapis.com/drive/v3";
const UPLOAD_API = "https://www.googleapis.com/upload/drive/v3/files";
const TOKEN_API = "https://oauth2.googleapis.com/token";
const USERINFO_API = "https://openidconnect.googleapis.com/v1/userinfo";
export const HIREX_DRIVE_ACCOUNT = "yasar@hirexstaffing.com";

export class GoogleDriveConfigurationError extends Error {}

export interface GoogleDriveFolderIds {
  rootFolderId: string;
  jobsFolderId: string;
  candidatesFolderId: string;
}

function getEncryptionKey() {
  const value = process.env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY;
  if (!value || value.length !== 64) {
    throw new GoogleDriveConfigurationError("Set GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY to a 32-byte hex key.");
  }
  return Buffer.from(value, "hex");
}

export function encryptDriveToken(token: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, "utf8"), cipher.final()]);
  return `${iv.toString("hex")}.${cipher.getAuthTag().toString("hex")}.${encrypted.toString("hex")}`;
}

export async function getStoredRefreshToken() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return undefined;
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data } = await client.from("google_drive_connections").select("encrypted_refresh_token").eq("provider", "google_drive").maybeSingle();
  if (!data?.encrypted_refresh_token) return undefined;
  const [ivHex, tagHex, encryptedHex] = data.encrypted_refresh_token.split(".");
  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedHex, "hex")), decipher.final()]).toString("utf8");
}

export async function getStoredDriveFolderIds(): Promise<GoogleDriveFolderIds | undefined> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return undefined;
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data } = await client
    .from("google_drive_connections")
    .select("root_folder_id,jobs_folder_id,candidates_folder_id")
    .eq("provider", "google_drive")
    .maybeSingle();
  if (!data?.root_folder_id || !data.jobs_folder_id || !data.candidates_folder_id) return undefined;
  return { rootFolderId: data.root_folder_id, jobsFolderId: data.jobs_folder_id, candidatesFolderId: data.candidates_folder_id };
}

function getOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new GoogleDriveConfigurationError(
      "Google Drive is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI."
    );
  }

  return { clientId, clientSecret, redirectUri };
}

export function getGoogleDriveAuthorizationUrl(state?: string) {
  const { clientId, redirectUri } = getOAuthConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: "https://www.googleapis.com/auth/drive.file",
  });

  if (state) params.set("state", state);
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeGoogleDriveCode(code: string) {
  const { clientId, clientSecret, redirectUri } = getOAuthConfig();
  const response = await fetch(TOKEN_API, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error_description || "Google OAuth token exchange failed.");
  const tokenBody = body as { access_token: string; refresh_token?: string; expires_in?: number };
  const identityResponse = await fetch(USERINFO_API, {
    headers: { Authorization: `Bearer ${tokenBody.access_token}` },
  });
  const identity = await identityResponse.json() as { email?: string };
  if (!identityResponse.ok || identity.email?.toLowerCase() !== HIREX_DRIVE_ACCOUNT) {
    throw new GoogleDriveConfigurationError(
      `Please connect the HireX Staffing Google account (${HIREX_DRIVE_ACCOUNT}).`
    );
  }
  return { ...tokenBody, accountEmail: identity.email };
}

async function getAccessToken(refreshToken?: string) {
  const { clientId, clientSecret } = getOAuthConfig();
  refreshToken ||= process.env.GOOGLE_DRIVE_REFRESH_TOKEN || await getStoredRefreshToken();
  if (!refreshToken) {
    throw new GoogleDriveConfigurationError(
      "Google Drive is not connected. Set GOOGLE_DRIVE_REFRESH_TOKEN or provide a caller-managed refresh token."
    );
  }

  const response = await fetch(TOKEN_API, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const body = await response.json();
  if (!response.ok || !body.access_token) throw new Error(body.error_description || "Google Drive access token request failed.");
  return body.access_token as string;
}

export async function getAccessTokenPublic(refreshToken?: string): Promise<string> {
  return getAccessToken(refreshToken);
}

async function driveRequest<T>(path: string, init: RequestInit = {}, refreshToken?: string) {
  const accessToken = await getAccessToken(refreshToken);
  const response = await fetch(`${DRIVE_API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, ...init.headers },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message || "Google Drive request failed.");
  return body as T;
}

async function findOrCreateFolder(name: string, parentId: string | undefined, refreshToken?: string) {
  const query = [`name = '${name.replace(/'/g, "\\'")}'`, "mimeType = 'application/vnd.google-apps.folder'", "trashed = false", parentId ? `'${parentId}' in parents` : "'root' in parents"].join(" and ");
  const found = await driveRequest<{ files: { id: string }[] }>(`/files?q=${encodeURIComponent(query)}&fields=files(id)&pageSize=1`, {}, refreshToken);
  if (found.files[0]) return found.files[0].id;

  const created = await driveRequest<{ id: string }>("/files", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder", ...(parentId ? { parents: [parentId] } : {}) }),
  }, refreshToken);
  return created.id;
}

async function createFolder(name: string, parentId: string | undefined, refreshToken?: string) {
  const created = await driveRequest<{ id: string }>("/files", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder", ...(parentId ? { parents: [parentId] } : {}) }),
  }, refreshToken);
  return created.id;
}

export async function bootstrapGoogleDriveFolders(refreshToken: string): Promise<GoogleDriveFolderIds> {
  const existing = await getStoredDriveFolderIds();
  if (existing) return existing;
  const rootFolderId = await createFolder("HireX ATS", undefined, refreshToken);
  const jobsFolderId = await createFolder("Jobs", rootFolderId, refreshToken);
  const candidatesFolderId = await createFolder("Candidates", rootFolderId, refreshToken);
  return { rootFolderId, jobsFolderId, candidatesFolderId };
}

export async function findOrCreateFolderPublic(name: string, parentId?: string, refreshToken?: string): Promise<string> {
  return findOrCreateFolder(name, parentId, refreshToken);
}

export async function uploadCandidateFile(input: { candidateId: string; file: File; refreshToken?: string }) {
  const folders = await getStoredDriveFolderIds();
  if (!folders) throw new GoogleDriveConfigurationError("Google Drive folders are not bootstrapped. Reconnect Google Drive first.");
  const candidateFolderId = await findOrCreateFolder(input.candidateId, folders.candidatesFolderId, input.refreshToken);
  const metadata = { name: input.file.name, parents: [candidateFolderId] };
  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", input.file, input.file.name);

  const accessToken = await getAccessToken(input.refreshToken);
  const response = await fetch(`${UPLOAD_API}?uploadType=multipart&fields=id,name,mimeType,parents,webViewLink`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message || "Google Drive file upload failed.");
  return { hirexFolderId: folders.rootFolderId, candidatesFolderId: folders.candidatesFolderId, candidateFolderId, file: body as { id: string; name: string; mimeType: string; parents?: string[]; webViewLink?: string } };
}

export async function getGoogleDriveStatus(refreshToken?: string) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
    return { configured: false, connected: false, error: "Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI." };
  }
  return { configured: true, connected: Boolean(refreshToken || process.env.GOOGLE_DRIVE_REFRESH_TOKEN || await getStoredRefreshToken()), accountEmail: HIREX_DRIVE_ACCOUNT };
}

export async function disconnectGoogleDrive(refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN) {
  if (!refreshToken) return { disconnected: true, message: "No Google Drive refresh token is configured." };
  const response = await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refreshToken)}`, { method: "POST" });
  if (!response.ok) throw new Error("Google did not revoke the Drive token.");
  return { disconnected: true, message: "Google revoked the token; remove GOOGLE_DRIVE_REFRESH_TOKEN from the deployment to finish disconnecting." };
}
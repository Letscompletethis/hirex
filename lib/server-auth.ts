import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { isActiveProfileStatus, isRecruiterRole, type HireXRole } from "./roles";

export type AuthorizedHireXUser = { user: User; role: HireXRole; admin: SupabaseClient };

export function getServerAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("CONFIGURATION");
  return createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function requireAuthorizedHireXUser(request: Request): Promise<AuthorizedHireXUser> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!token || !url || !publishableKey) throw new Error("UNAUTHORIZED");
  const auth = createClient(url, publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: { user }, error } = await auth.auth.getUser(token);
  if (error || !user) throw new Error("UNAUTHORIZED");
  const admin = getServerAdminClient();
  const { data: profile, error: profileError } = await admin.from("profiles").select("role,status").eq("id", user.id).maybeSingle();
  if (profileError || !profile) throw new Error("PROFILE_UNAVAILABLE");
  if (!isRecruiterRole(profile.role) || !isActiveProfileStatus(profile.status)) throw new Error("FORBIDDEN");
  return { user, role: profile.role, admin };
}

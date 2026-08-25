import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export async function requireOwner(request: Request) {
  const header = request.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!token || !url || !publishableKey) throw new Error("UNAUTHORIZED");

  const authClient = createClient(url, publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: { user }, error } = await authClient.auth.getUser(token);
  if (error || !user) throw new Error("UNAUTHORIZED");

  const admin = getBusinessDevelopmentAdmin();
  const { data: profile, error: profileError } = await admin.from("profiles").select("role,status").eq("id", user.id).maybeSingle();
  const role = String(profile?.role || "").toLowerCase();
  const status = String(profile?.status || "").toLowerCase();
  if (profileError || role !== "owner" || (status && status !== "active")) throw new Error("FORBIDDEN");
  return { user, admin };
}

export function getBusinessDevelopmentAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("CONFIGURATION");
  return createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
}
import type { SupabaseClient } from "@supabase/supabase-js";

export async function getRecruiterApplicationScope(
  supabase: SupabaseClient
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return "";
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,status")
    .eq("id", user.id)
    .maybeSingle();

  const role = String(profile?.role || "").toLowerCase();
  const status = String(profile?.status || "").toLowerCase();
  const isPrivileged = ["owner", "admin", "super_admin"].includes(role);

  if (!profile || (!isPrivileged && role !== "recruiter") || status !== "active") {
    return "";
  }

  return isPrivileged ? null : user.id;
}

import type { SupabaseClient } from "@supabase/supabase-js";

export async function transitionApplicationStatus(supabase: SupabaseClient, applicationId: string, status: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Your recruiter session has expired.");
  const response = await fetch(`/api/recruiter/applications/${applicationId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const result = await response.json() as { application?: { status: string }; error?: string };
  if (!response.ok || !result.application) throw new Error(result.error || "Could not update application status.");
  return result.application;
}

import type { SupabaseClient } from "@supabase/supabase-js";

function createCandidateNumber() {
  return `HX-CAN-${String(Math.floor(Math.random() * 100000)).padStart(5, "0")}`;
}

export async function allocateCandidateNumber(supabase: SupabaseClient) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidateId = createCandidateNumber();
    const { data, error } = await supabase
      .from("candidates")
      .select("candidate_id")
      .eq("candidate_id", candidateId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return candidateId;
  }

  throw new Error("Unable to allocate a candidate number.");
}
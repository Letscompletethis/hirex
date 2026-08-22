import type { SupabaseClient } from "@supabase/supabase-js";

type ApplicationNumberRow = {
  job_candidate_number: number | null;
};

export async function allocateJobCandidateNumber(
  supabase: SupabaseClient,
  jobId: string
) {
  const { data, error } = await supabase
    .from("applications")
    .select("job_candidate_number")
    .eq("job_id", jobId)
    .not("job_candidate_number", "is", null);

  if (error) {
    throw new Error(error.message);
  }

  const usedNumbers = new Set(
    ((data || []) as ApplicationNumberRow[])
      .map((row) => {
        return row.job_candidate_number;
      })
      .filter((number): number is number => number !== null)
  );

  let nextNumber = 1;
  while (usedNumbers.has(nextNumber)) {
    nextNumber += 1;
  }

  return nextNumber;
}

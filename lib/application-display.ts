export type ApplicationSummary = {
  id: string;
  candidate_id: string | null;
  job_id: string | null;
  status: string | null;
  applied_at: string | null;
  recruiter_id: string | null;
  job_candidate_number: number | null;
};

export function formatJobCandidateNumber(
  value: number | null | undefined
) {
  return value === null || value === undefined
    ? "-"
    : `JC-${String(value).padStart(3, "0")}`;
}

export function formatApplicationStatus(
  value: string | null | undefined
) {
  const normalized = (value || "new").toLowerCase().trim();
  const labels: Record<string, string> = {
    submitted: "Submission",
    submission: "Submission",
    interviewing: "Interview",
    offered: "Offer",
    started: "Started",
    start: "Started",
    hired: "Started",
  };

  return labels[normalized] ||
    normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

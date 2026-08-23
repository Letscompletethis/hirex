export type ApplicationSummary = {
  id: string;
  candidate_id: string | null;
  job_id: string | null;
  status: string | null;
  applied_at: string | null;
  recruiter_id: string | null;
  job_candidate_number: number | null;
};

import { formatApplicationStatus as formatCanonicalApplicationStatus } from "./statuses";

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
  return formatCanonicalApplicationStatus(value);
}

export const JOB_STATUSES = [
  "open",
  "hold",
  "closed",
  "filled",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const APPLICATION_STATUSES = [
  "submission",
  "interview",
  "offer",
  "start",
  "rejected",
  "withdrawn",
  "hold",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export function normalizeJobStatus(value: string | null | undefined): JobStatus {
  const status = (value || "open").toLowerCase().trim();

  if (["published", "active", "open"].includes(status)) return "open";
  if (["paused", "on hold", "hold"].includes(status)) return "hold";
  if (["close", "closed"].includes(status)) return "closed";
  if (["hired", "filled"].includes(status)) return "filled";

  return "open";
}

export function normalizeApplicationStatus(
  value: string | null | undefined
): ApplicationStatus {
  const status = (value || "submission").toLowerCase().trim();

  if (["new", "viewed", "submitted", "submission"].includes(status)) {
    return "submission";
  }
  if (["interview", "interviewing"].includes(status)) return "interview";
  if (["offer", "offered", "offers"].includes(status)) return "offer";
  if (["start", "started", "starts", "hired"].includes(status)) return "start";
  if (status === "rejected") return "rejected";
  if (["withdrawn", "withdraw"].includes(status)) return "withdrawn";
  if (status === "hold") return "hold";

  return "submission";
}

export function normalizeStoredApplicationStatus(value: string | null | undefined) {
  const status = (value || "submission").toLowerCase().trim();
  if (status === "new" || status === "viewed") return status;
  return normalizeApplicationStatus(status);
}

export function isSubmittedApplicationStatus(value: string | null | undefined) {
  const status = (value || "").toLowerCase().trim();
  return status === "submission" || status === "submitted";
}

export function normalizeStatus(value: string | null | undefined): ApplicationStatus {
  return normalizeApplicationStatus(value);
}

export function formatJobStatus(value: string | null | undefined) {
  const labels: Record<JobStatus, string> = {
    open: "Open",
    hold: "Hold",
    closed: "Closed",
    filled: "Filled",
  };

  return labels[normalizeJobStatus(value)];
}

export function formatApplicationStatus(value: string | null | undefined) {
  const labels: Record<ApplicationStatus, string> = {
    submission: "Submission",
    interview: "Interview",
    offer: "Offer",
    start: "Start",
    rejected: "Rejected",
    withdrawn: "Withdrawn",
    hold: "Hold",
  };

  return labels[normalizeApplicationStatus(value)];
}
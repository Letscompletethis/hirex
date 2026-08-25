export const PRIVILEGED_ROLES = ["owner", "admin", "super_admin"] as const;
export const RECRUITER_ROLES = [...PRIVILEGED_ROLES, "recruiter"] as const;

export type HireXRole = (typeof RECRUITER_ROLES)[number];

export function normalizeRole(value: unknown): string {
  return String(value || "").trim().toLowerCase();
}

export function isPrivilegedRole(value: unknown): boolean {
  return (PRIVILEGED_ROLES as readonly string[]).includes(normalizeRole(value));
}

export function isRecruiterRole(value: unknown): value is HireXRole {
  return (RECRUITER_ROLES as readonly string[]).includes(normalizeRole(value));
}

export function isActiveProfileStatus(value: unknown): boolean {
  return normalizeRole(value) === "active";
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { allocateJobCandidateNumber } from "../../lib/job-candidate-number";
import {
  ExternalLink,
  FileText,
  Loader2,
  Search,
  X,
  ChevronDown,
} from "lucide-react";

type Candidate = {
  ID: string;
  candidate_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  resume_path: string | null;
  job_title: string | null;
};

type Job = {
  id: string;
  title: string;
  company: string;
};

type ApplicationRow = {
  id: string;
  candidate_id: string;
  job_id: string;
  status: string;
  applied_at: string;
  recruiter_id: string | null;
  job_candidate_number: number | null;
};

type Application = ApplicationRow & {
  candidate: Candidate | null;
  job: Job | null;
};

type Recruiter = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  status: string;
};

const APPLICATION_STATUSES = [
  "new",
  "viewed",
  "screening",
  "interview",
  "offer",
  "hired",
  "rejected",
] as const;

type ApplicationStatus =
  (typeof APPLICATION_STATUSES)[number];

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(
    null
  );
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [assigningId, setAssigningId] = useState<string | null>(
    null
  );

  async function loadApplications() {
    setLoading(true);
    setError("");

    try {
      const { data, error: applicationsError } =
        await supabase
          .from("applications")
          .select(
            "id,candidate_id,job_id,status,applied_at,recruiter_id,job_candidate_number"
          )
          .order("applied_at", { ascending: false });

      if (applicationsError) {
        throw new Error(applicationsError.message);
      }

      if (!data || data.length === 0) {
        setApplications([]);
        return;
      }

      const candidateIds = Array.from(
        new Set(
          data
            .map((row) => row.candidate_id)
            .filter(Boolean)
        )
      );

      const jobIds = Array.from(
        new Set(
          data
            .map((row) => row.job_id)
            .filter(Boolean)
        )
      );

      const {
        data: candidates,
        error: candidatesError,
      } = await supabase
        .from("candidates")
        .select(
          "ID,candidate_id,first_name,last_name,email,phone,resume_path,job_title"
        )
        .in("ID", candidateIds);

      if (candidatesError) {
        throw new Error(candidatesError.message);
      }

      const { data: jobs, error: jobsError } =
        await supabase
          .from("jobs")
          .select("id,title,company")
          .in("id", jobIds);

      if (jobsError) {
        throw new Error(jobsError.message);
      }

      const candidateMap = new Map<string, Candidate>();

      (candidates ?? []).forEach((candidate) => {
        candidateMap.set(candidate.ID, candidate);
      });

      const jobMap = new Map<string, Job>();

      (jobs ?? []).forEach((job) => {
        jobMap.set(job.id, job);
      });

      const combined: Application[] = data.map(
        (row) => ({
          ...row,
          candidate:
            candidateMap.get(row.candidate_id) ?? null,
          job: jobMap.get(row.job_id) ?? null,
        })
      );

      setApplications(combined);
    } catch (loadError) {
      console.error(
        "Applications error:",
        loadError
      );

      if (loadError instanceof Error) {
        setError(loadError.message);
      } else {
        setError("Could not load applications.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadApplications);

    async function loadRecruiters() {
      const { data, error: recruitersError } = await supabase
        .from("profiles")
        .select("id,full_name,email,role,status")
        .in("role", ["owner", "admin", "recruiter"])
        .eq("status", "active")
        .order("full_name", { ascending: true });

      if (recruitersError) {
        console.error("Recruiter lookup error:", recruitersError);
        return;
      }

      setRecruiters((data || []) as Recruiter[]);
    }

    void loadRecruiters();

    const channel = supabase
      .channel("recruiter-applications-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, () => void loadApplications())
      .on("postgres_changes", { event: "*", schema: "public", table: "candidates" }, () => void loadApplications())
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, () => void loadApplications())
      .subscribe();
    const refreshTimer = window.setInterval(() => void loadApplications(), 15000);

    return () => {
      window.clearInterval(refreshTimer);
      void supabase.removeChannel(channel);
    };
  }, []);

  const filteredApplications = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return applications;
    }

    return applications.filter((application) => {
      const candidate = application.candidate;
      const job = application.job;

      const text = [
        candidate?.candidate_id,
        candidate?.first_name,
        candidate?.last_name,
        candidate?.email,
        candidate?.phone,
        candidate?.job_title,
        job?.title,
        job?.company,
        application.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(term);
    });
  }, [applications, search]);

  function formatDate(value: string) {
    return new Date(value).toLocaleString();
  }

  function statusClass(status: string) {
    switch (status.toLowerCase()) {
      case "new":
        return "border-purple-300/20 bg-purple-300/10 text-purple-200";

      case "viewed":
        return "border-white/10 bg-white/[0.04] text-white/50";

      case "screening":
        return "border-blue-400/20 bg-blue-400/10 text-blue-300";

      case "interview":
        return "border-yellow-400/20 bg-yellow-400/10 text-yellow-300";

      case "offer":
        return "border-orange-400/20 bg-orange-400/10 text-orange-300";

      case "hired":
        return "border-green-400/20 bg-green-400/10 text-green-300";

      case "rejected":
        return "border-red-400/20 bg-red-400/10 text-red-300";

      default:
        return "border-white/10 bg-white/[0.04] text-white/50";
    }
  }

  function formatStatus(status: string) {
    if (!status) {
      return "New";
    }

    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  async function updateApplicationStatus(
    applicationId: string,
    newStatus: ApplicationStatus
  ) {
    setUpdatingId(applicationId);

    try {
      const application = applications.find(
        (item) => item.id === applicationId
      );
      const jobCandidateNumber =
        application?.job_candidate_number ||
        (application
          ? await allocateJobCandidateNumber(
              supabase,
              application.job_id
            )
          : null);

      const { error: updateError } =
        await supabase
          .from("applications")
          .update({
            status: newStatus,
            ...(jobCandidateNumber
              ? { job_candidate_number: jobCandidateNumber }
              : {}),
          })
          .eq("id", applicationId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setApplications((current) =>
        current.map((item) =>
          item.id === applicationId
            ? {
                ...item,
                status: newStatus,
                job_candidate_number:
                  jobCandidateNumber ||
                  item.job_candidate_number,
              }
            : item
        )
      );
    } catch (updateError) {
      console.error(
        "Application status update error:",
        updateError
      );
      alert(
        "Could not update application status: " +
          (updateError instanceof Error
            ? updateError.message
            : "Unknown error")
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function assignRecruiter(
    applicationId: string,
    recruiterId: string
  ) {
    setAssigningId(applicationId);

    try {
      const application = applications.find(
        (item) => item.id === applicationId
      );
      const jobCandidateNumber =
        application?.job_candidate_number ||
        (application
          ? await allocateJobCandidateNumber(
              supabase,
              application.job_id
            )
          : null);

      const { error: updateError } = await supabase
        .from("applications")
        .update({
          recruiter_id: recruiterId || null,
          ...(jobCandidateNumber
            ? { job_candidate_number: jobCandidateNumber }
            : {}),
        })
        .eq("id", applicationId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      setApplications((current) =>
        current.map((item) =>
          item.id === applicationId
            ? {
                ...item,
                recruiter_id: recruiterId || null,
                job_candidate_number:
                  jobCandidateNumber ||
                  item.job_candidate_number,
              }
            : item
        )
      );
    } catch (updateError) {
      console.error("Recruiter assignment error:", updateError);
      alert(
        "Could not assign recruiter: " +
          (updateError instanceof Error
            ? updateError.message
            : "Unknown error")
      );
    } finally {
      setAssigningId(null);
    }
  }

  async function openResume(
    resumePath: string | null
  ) {
    if (!resumePath) {
      alert(
        "No resume is available for this candidate."
      );
      return;
    }

    const { data, error: storageError } =
      await supabase.storage
        .from("resumes")
        .createSignedUrl(resumePath, 600);

    if (storageError) {
      console.error(
        "Resume error:",
        storageError
      );

      alert(
        "Could not open resume: " +
          storageError.message
      );

      return;
    }

    if (!data?.signedUrl) {
      alert("Could not create a resume URL.");
      return;
    }

    window.open(
      data.signedUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <main className="min-h-screen bg-[#03040a] text-white">
      <div className="mx-auto max-w-[1600px] px-5 py-10 sm:px-8">

        {/* Header */}
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-purple-200/80">
            HireX ATS
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
            Applications
          </h1>

          <p className="mt-2 text-sm text-white/45">
            Review candidates, resumes, and application progress.
          </p>
        </div>

        {/* Search */}
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3">
          <Search
            size={18}
            className="text-white/35"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search candidate, email, job..."
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-white/35 transition hover:text-white"
            >
              <X size={17} />
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24 text-white/50">
            <Loader2
              className="mr-3 animate-spin"
              size={20}
            />
            Loading applications...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-6">
            <h2 className="font-semibold text-red-200">
              Could not load applications
            </h2>

            <p className="mt-2 text-sm text-red-200/60">
              {error}
            </p>

            <button
              type="button"
              onClick={loadApplications}
              className="mt-5 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          filteredApplications.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-16 text-center">
              <FileText
                size={34}
                className="mx-auto text-white/20"
              />

              <h2 className="mt-5 text-xl font-semibold">
                No applications found
              </h2>

              <p className="mt-2 text-sm text-white/40">
                Applications will appear here when candidates apply.
              </p>
            </div>
          )}

        {/* Applications Table */}
        {!loading &&
          !error &&
          filteredApplications.length > 0 && (
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#05060b]/90 shadow-2xl">
              <div className="overflow-x-auto">
                  <table className="w-full min-w-[1800px]">

                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.025] text-left">

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/35">
                        Candidate ID
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/35">
                        Job Candidate ID
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/35">
                        First Name
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/35">
                        Last Name
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/35">
                        Email
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/35">
                        Phone
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/35">
                        Current Job
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/35">
                        Applied For
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/35">
                        Company
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/35">
                        Status
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/35">
                        Recruiter
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/35">
                        Applied
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/35">
                        Resume
                      </th>

                    </tr>
                  </thead>

                  <tbody>
                    {filteredApplications.map(
                      (application) => {
                        const candidate =
                          application.candidate;

                        const job =
                          application.job;

                        const currentStatus =
                          APPLICATION_STATUSES.includes(
                            application.status as ApplicationStatus
                          )
                            ? (application.status as ApplicationStatus)
                            : "new";

                        const isUpdating =
                          updatingId ===
                          application.id;

                        return (
                          <tr
                            key={application.id}
                            className="border-b border-white/[0.06] transition hover:bg-white/[0.025]"
                          >

                            {/* Candidate ID */}
                            <td className="px-5 py-5 text-sm font-medium text-purple-200">
                              {candidate?.candidate_id ||
                                "—"}
                            </td>

                            {/* Job Candidate ID */}
                            <td className="px-5 py-5 text-sm font-medium text-cyan-200">
                              {application.job_candidate_number
                                ? `JC-${String(application.job_candidate_number).padStart(3, "0")}`
                                : "—"}
                            </td>

                            {/* First Name */}
                            <td className="px-5 py-5 text-sm">
                              {candidate?.first_name ||
                                "—"}
                            </td>

                            {/* Last Name */}
                            <td className="px-5 py-5 text-sm">
                              {candidate?.last_name ||
                                "—"}
                            </td>

                            {/* Email */}
                            <td className="px-5 py-5 text-sm text-white/65">
                              {candidate?.email ||
                                "—"}
                            </td>

                            {/* Phone */}
                            <td className="px-5 py-5 text-sm text-white/65">
                              {candidate?.phone ||
                                "—"}
                            </td>

                            {/* Current Job */}
                            <td className="px-5 py-5 text-sm text-white/65">
                              {candidate?.job_title ||
                                "—"}
                            </td>

                            {/* Applied For */}
                            <td className="px-5 py-5 text-sm">
                              {job?.title || "—"}
                            </td>

                            {/* Company */}
                            <td className="px-5 py-5 text-sm text-white/65">
                              {job?.company || "—"}
                            </td>

                            {/* Status */}
                            <td className="px-5 py-5">
                              <div className="relative">

                                <select
                                  value={currentStatus}
                                  disabled={isUpdating}
                                  onChange={(event) =>
                                    updateApplicationStatus(
                                      application.id,
                                      event.target
                                        .value as ApplicationStatus
                                    )
                                  }
                                  className={
                                    "appearance-none rounded-full border px-3 py-1.5 pr-8 text-xs font-medium outline-none transition disabled:cursor-not-allowed disabled:opacity-50 " +
                                    statusClass(
                                      currentStatus
                                    )
                                  }
                                >
                                  {APPLICATION_STATUSES.map(
                                    (status) => (
                                      <option
                                        key={status}
                                        value={status}
                                        className="bg-[#080910] text-white"
                                      >
                                        {formatStatus(
                                          status
                                        )}
                                      </option>
                                    )
                                  )}
                                </select>

                                {isUpdating ? (
                                  <Loader2
                                    size={13}
                                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 animate-spin"
                                  />
                                ) : (
                                  <ChevronDown
                                    size={13}
                                    className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 opacity-50"
                                  />
                                )}

                              </div>
                            </td>

                            {/* Applied */}
                            <td className="px-5 py-5">
                              <select
                                value={application.recruiter_id || ""}
                                disabled={assigningId === application.id}
                                onChange={(event) =>
                                  assignRecruiter(
                                    application.id,
                                    event.target.value
                                  )
                                }
                                className="min-w-48 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs text-white outline-none focus:border-purple-300/40 disabled:opacity-50"
                              >
                                <option value="" className="bg-[#080910] text-white">
                                  Unassigned
                                </option>
                                {recruiters.map((recruiter) => (
                                  <option
                                    key={recruiter.id}
                                    value={recruiter.id}
                                    className="bg-[#080910] text-white"
                                  >
                                    {recruiter.full_name || recruiter.email || recruiter.id}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Applied */}
                            <td className="whitespace-nowrap px-5 py-5 text-xs text-white/50">
                              {formatDate(
                                application.applied_at
                              )}
                            </td>

                            {/* Resume */}
                            <td className="px-5 py-5">
                              <button
                                type="button"
                                onClick={() =>
                                  openResume(
                                    candidate?.resume_path ||
                                      null
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                              >
                                <FileText
                                  size={15}
                                />

                                View Resume

                                <ExternalLink
                                  size={13}
                                />
                              </button>
                            </td>

                          </tr>
                        );
                      }
                    )}
                  </tbody>

                </table>
              </div>

              <div className="border-t border-white/10 px-5 py-4 text-xs text-white/30">
                Showing{" "}
                {filteredApplications.length}{" "}
                {filteredApplications.length === 1
                  ? "application"
                  : "applications"}
              </div>
            </div>
          )}

      </div>
    </main>
  );
}
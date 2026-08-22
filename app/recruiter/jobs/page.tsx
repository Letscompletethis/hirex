"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  ChevronDown,
  ArrowLeft,
  BriefcaseBusiness,
  Users,
  FileText,
  Loader2,
  X,
  Play,
  Pause,
  XCircle,
  Pencil,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  UserRound,
  CheckCircle2,
  Clock3,
  Send,
  BadgeCheck,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { allocateJobCandidateNumber } from "../../../lib/job-candidate-number";

type Job = {
  id: string;
  job_id: string | null;
  title: string | null;
  company: string | null;
  location: string | null;
  type: string | null;
  status: string | null;
  openings: number | null;
  salary: string | null;
  deadline: string | null;
  created_at: string | null;
};

type Candidate = {
  ID?: string;
  id?: string;
  candidate_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  resume_path: string | null;
  job_id: string | null;
  job_title: string | null;
  status: string | null;
  created_at: string | null;
  current_job_title: string | null;
};

type Application = {
  id?: string;
  candidate_id?: string | null;
  job_id?: string | null;
  status?: string | null;
  recruiter_id?: string | null;
  job_candidate_number?: number | null;
  created_at?: string | null;
};

type Recruiter = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  status: string;
};

const SUBMISSION_STATUSES = [
  "new",
  "viewed",
  "submission",
  "interview",
  "offer",
  "placed",
  "rejected",
];

function getCandidateId(candidate: Candidate) {
  return (
    candidate.ID ||
    candidate.id ||
    candidate.candidate_id ||
    ""
  );
}

function getCandidateName(candidate: Candidate) {
  const name =
    `${candidate.first_name || ""} ${
      candidate.last_name || ""
    }`.trim();

  return name || "Unnamed Candidate";
}

function normalizeStatus(status: string | null | undefined) {
  return (status || "new").toLowerCase().trim();
}

function normalizeJobStatus(status: string | null | undefined) {
  const value = normalizeStatus(status);

  if (["published", "open", "active"].includes(value)) {
    return "published";
  }

  if (["paused", "hold", "on hold"].includes(value)) {
    return "paused";
  }

  return value;
}

function applicationMatchesCandidate(
  application: Application,
  candidate: Candidate
) {
  const applicationCandidateId =
    application.candidate_id || "";

  return (
    applicationCandidateId === candidate.ID ||
    applicationCandidateId === candidate.id ||
    applicationCandidateId === candidate.candidate_id
  );
}

function applicationMatchesJob(
  application: Application,
  job: Job
) {
  return (
    application.job_id === job.id ||
    application.job_id === job.job_id
  );
}

export default function RecruiterJobsPage() {
  return (
    <Suspense fallback={<JobsPageLoading />}>
      <RecruiterJobsContent />
    </Suspense>
  );
}

function JobsPageLoading() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <Loader2 size={24} className="animate-spin text-purple-300" />
    </main>
  );
}

function RecruiterJobsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedJobId = searchParams.get("job");
  const selectedCandidateId =
    searchParams.get("candidate");
  const requestedStatus = searchParams.get("status");

  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] =
    useState<Candidate[]>([]);
  const [applications, setApplications] =
    useState<Application[]>([]);
  const [recruiters, setRecruiters] =
    useState<Recruiter[]>([]);

  const [loading, setLoading] = useState(true);
  const [candidateLoading, setCandidateLoading] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] =
    useState("all");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [openAction, setOpenAction] =
    useState<string | null>(null);

  const [updatingCandidateStatus, setUpdatingCandidateStatus] =
    useState(false);
  const [assigningRecruiter, setAssigningRecruiter] =
    useState(false);
  const [selectedRecruiterId, setSelectedRecruiterId] =
    useState("");
  const [jobRecruiterSelections, setJobRecruiterSelections] =
    useState<Record<string, string>>({});

  /*
   * =========================================================
   * LOAD JOBS
   * =========================================================
   */

  async function loadJobs() {
    setLoading(true);
    setError("");

    try {
      const { data, error: jobsError } =
        await supabase
          .from("jobs")
          .select("*")
          .order("created_at", {
            ascending: false,
          });

      if (jobsError) {
        throw new Error(jobsError.message);
      }

      setJobs((data || []) as Job[]);
    } catch (err) {
      console.error("Jobs error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Could not load jobs."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * =========================================================
   * LOAD CANDIDATES + APPLICATIONS
   * =========================================================
   */

  async function loadCandidateData() {
    setCandidateLoading(true);
    setError("");

    try {
      const [
        candidateRequest,
        applicationRequest,
        recruiterRequest,
      ] = await Promise.all([
        supabase
          .from("candidates")
          .select("*"),

        supabase
          .from("applications")
          .select("*"),

        supabase
          .from("profiles")
          .select("id,full_name,email,role,status")
          .in("role", ["owner", "admin", "recruiter"])
          .eq("status", "active")
          .order("full_name", { ascending: true }),
      ]);

      if (candidateRequest.error) {
        throw new Error(
          candidateRequest.error.message
        );
      }

      if (applicationRequest.error) {
        throw new Error(
          applicationRequest.error.message
        );
      }

      setCandidates(
        (candidateRequest.data ||
          []) as Candidate[]
      );

      setApplications(
        (applicationRequest.data ||
          []) as Application[]
      );

      if (!recruiterRequest.error) {
        setRecruiters(
          (recruiterRequest.data || []) as Recruiter[]
        );
      }
    } catch (err) {
      console.error(
        "Candidate/application error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not load candidate data."
      );
    } finally {
      setCandidateLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => {
      loadJobs();
      loadCandidateData();
    });
  }, []);

  /*
   * =========================================================
   * SELECTED JOB
   * =========================================================
   */

  const selectedJob = useMemo(() => {
    if (!selectedJobId) return null;

    return (
      jobs.find(
        (job) => job.id === selectedJobId
      ) || null
    );
  }, [jobs, selectedJobId]);

  const selectedJobRecruiterIds = useMemo(() => {
    if (!selectedJob) return [];

    return Array.from(
      new Set(
        applications
          .filter((application) =>
            applicationMatchesJob(application, selectedJob)
          )
          .map((application) => application.recruiter_id)
          .filter(Boolean)
      )
    ) as string[];
  }, [applications, selectedJob]);

  async function assignRecruiterToJob() {
    const recruiterId =
      selectedRecruiterId || selectedJobRecruiterIds[0] || "";

    if (!selectedJob || !recruiterId) return;

    const applicationIds = applications
      .filter((application) =>
        applicationMatchesJob(application, selectedJob)
      )
      .map((application) => application.id)
      .filter(Boolean) as string[];

    if (applicationIds.length === 0) {
      setError("This job has no applications to assign yet.");
      return;
    }

    setAssigningRecruiter(true);
    setError("");
    setSuccess("");

    const { error: updateError } = await supabase
      .from("applications")
      .update({ recruiter_id: recruiterId })
      .in("id", applicationIds);

    if (updateError) {
      setError(updateError.message);
    } else {
      setApplications((current) =>
        current.map((application) =>
          applicationIds.includes(application.id || "")
            ? { ...application, recruiter_id: recruiterId }
            : application
        )
      );
      setSuccess("Recruiter assigned to this job's applications.");
    }

    setAssigningRecruiter(false);
  }

  function getJobRecruiterSelection(job: Job) {
    const assignedRecruiters = Array.from(
      new Set(
        applications
          .filter((application) => applicationMatchesJob(application, job))
          .map((application) => application.recruiter_id)
          .filter(Boolean)
      )
    ) as string[];

    return (
      jobRecruiterSelections[job.id] ||
      (assignedRecruiters.length === 1 ? assignedRecruiters[0] : "")
    );
  }

  async function assignRecruiterFromJobRow(job: Job) {
    const recruiterId = getJobRecruiterSelection(job);
    const applicationIds = applications
      .filter((application) => applicationMatchesJob(application, job))
      .map((application) => application.id)
      .filter(Boolean) as string[];

    if (!recruiterId || applicationIds.length === 0) {
      setError(
        applicationIds.length === 0
          ? "This job has no applications to assign yet."
          : "Select a recruiter first."
      );
      return;
    }

    setAssigningRecruiter(true);
    setError("");
    setSuccess("");

    const { error: updateError } = await supabase
      .from("applications")
      .update({ recruiter_id: recruiterId })
      .in("id", applicationIds);

    if (updateError) {
      setError(updateError.message);
    } else {
      setApplications((current) =>
        current.map((application) =>
          applicationIds.includes(application.id || "")
            ? { ...application, recruiter_id: recruiterId }
            : application
        )
      );
      setSuccess(`${job.title || "Job"} recruiter assignment saved.`);
    }

    setAssigningRecruiter(false);
  }

  /*
   * =========================================================
   * CLIENT OPTIONS
   * =========================================================
   */

  const clients = useMemo(() => {
    return Array.from(
      new Set(
        jobs
          .map((job) => job.company)
          .filter(Boolean)
      )
    ) as string[];
  }, [jobs]);

  /*
   * =========================================================
   * JOB CANDIDATE POOL
   *
   * A job pool contains:
   *
   * 1. Candidates directly assigned to the job
   * 2. Candidates who submitted/applied to the job
   *
   * Duplicates are removed.
   * =========================================================
   */

  const jobCandidates = useMemo(() => {
    if (!selectedJob) return [];

    const matchingIds = new Set<string>();

    /*
     * DIRECT ASSIGNMENTS
     */

    candidates.forEach((candidate) => {
      const candidateId =
        getCandidateId(candidate);

      if (
        candidate.job_id === selectedJob.id ||
        candidate.job_id === selectedJob.job_id
      ) {
        if (candidateId) {
          matchingIds.add(candidateId);
        }
      }
    });

    /*
     * APPLICATIONS / SUBMISSIONS
     */

    applications.forEach((application) => {
      if (
        applicationMatchesJob(
          application,
          selectedJob
        )
      ) {
        if (application.candidate_id) {
          matchingIds.add(
            application.candidate_id
          );
        }
      }
    });

    /*
     * MATCH AGAINST DATABASE ID,
     * PUBLIC CANDIDATE ID, OR CANDIDATE ID.
     */

    return candidates.filter((candidate) => {
      const databaseId =
        candidate.ID ||
        candidate.id ||
        "";

      const publicCandidateId =
        candidate.candidate_id ||
        "";

      return (
        matchingIds.has(databaseId) ||
        matchingIds.has(publicCandidateId)
      );
    });
  }, [
    candidates,
    applications,
    selectedJob,
  ]);

  /*
   * =========================================================
   * SELECTED CANDIDATE
   * =========================================================
   */

  const selectedCandidate =
    useMemo(() => {
      if (!selectedCandidateId) {
        return null;
      }

      return (
        jobCandidates.find(
          (candidate) =>
            getCandidateId(candidate) ===
            selectedCandidateId
        ) || null
      );
    }, [
      jobCandidates,
      selectedCandidateId,
    ]);

  /*
   * =========================================================
   * PROFILE INDEX
   * =========================================================
   */

  const selectedCandidateIndex =
    useMemo(() => {
      if (!selectedCandidate) {
        return -1;
      }

      return jobCandidates.findIndex(
        (candidate) =>
          getCandidateId(candidate) ===
          getCandidateId(selectedCandidate)
      );
    }, [
      selectedCandidate,
      jobCandidates,
    ]);

  /*
   * =========================================================
   * OPEN JOB
   * =========================================================
   */

  function openJob(jobId: string) {
    setOpenAction(null);

    router.push(
      `/recruiter/jobs?job=${encodeURIComponent(
        jobId
      )}`
    );
  }

  /*
   * =========================================================
   * GET APPLICATION FOR CANDIDATE + JOB
   * =========================================================
   */

  function getCandidateApplication(
    candidate: Candidate,
    job: Job | null = selectedJob
  ) {
    if (!job) return null;

    return (
      applications.find(
        (application) =>
          applicationMatchesJob(
            application,
            job
          ) &&
          applicationMatchesCandidate(
            application,
            candidate
          )
      ) || null
    );
  }

  /*
   * =========================================================
   * CANDIDATE STATUS
   *
   * IMPORTANT:
   * Status comes from APPLICATION for this specific job.
   * =========================================================
   */

  function candidateStatus(
    candidate: Candidate
  ) {
    const application =
      getCandidateApplication(
        candidate
      );

    return normalizeStatus(
      application?.status ||
        candidate.status ||
        "new"
    );
  }

  /*
   * =========================================================
   * OPEN CANDIDATE
   *
   * When recruiter opens a profile from a job pool,
   * automatically mark that job submission as Viewed.
   * =========================================================
   */

  async function openCandidate(
    candidate: Candidate
  ) {
    if (!selectedJob) return;

    const candidateId =
      getCandidateId(candidate);

    if (!candidateId) {
      setError(
        "This candidate does not have a valid candidate ID."
      );
      return;
    }

    router.push(
      `/recruiter/jobs?job=${encodeURIComponent(
        selectedJob.id
      )}&candidate=${encodeURIComponent(
        candidateId
      )}`
    );

    /*
     * Mark as Viewed after navigation begins.
     */

    await markCandidateViewed(
      candidate,
      selectedJob
    );
  }

  /*
   * =========================================================
   * MARK CANDIDATE VIEWED
   * =========================================================
   */

  async function markCandidateViewed(
    candidate: Candidate,
    job: Job
  ) {
    const existingApplication =
      getCandidateApplication(
        candidate,
        job
      );

    /*
     * If there is an application/submission,
     * update THAT record.
     */

    if (existingApplication?.id) {
      const currentStatus =
        normalizeStatus(
          existingApplication.status
        );

      /*
       * Don't overwrite statuses such as:
       * submission, interview, offer, placed, rejected.
       */

      if (
        currentStatus !== "new" &&
        currentStatus !== ""
      ) {
        return;
      }

      const { error: updateError } =
        await supabase
          .from("applications")
          .update({
            status: "viewed",
          })
          .eq(
            "id",
            existingApplication.id
          );

      if (updateError) {
        console.error(
          "Could not mark application viewed:",
          updateError
        );
        return;
      }

      setApplications((current) =>
        current.map((application) =>
          application.id ===
          existingApplication.id
            ? {
                ...application,
                status: "viewed",
              }
            : application
        )
      );

      return;
    }

    /*
     * If the candidate was directly assigned to
     * this job but doesn't have an application row,
     * create the submission record.
     */

    const jobCandidateNumber =
      await allocateJobCandidateNumber(
        supabase,
        job.id
      );

    const { data, error: insertError } =
      await supabase
        .from("applications")
        .insert({
          candidate_id: candidateIdForDatabase(
            candidate
          ),
          job_id: job.id,
          status: "viewed",
          job_candidate_number: jobCandidateNumber,
        })
        .select("*")
        .single();

    if (!insertError && data) {
      setApplications((current) => [
        ...current,
        data as Application,
      ]);
    }
  }

  /*
   * =========================================================
   * DATABASE CANDIDATE ID
   * =========================================================
   */

  function candidateIdForDatabase(
    candidate: Candidate
  ) {
    return candidate.id || candidate.ID || null;
  }

  /*
   * =========================================================
   * UPDATE CANDIDATE STATUS
   *
   * STATUS IS JOB-SPECIFIC.
   *
   * It updates applications.status.
   * =========================================================
   */

  async function updateCandidateStatus(
    candidate: Candidate,
    newStatus: string
  ) {
    if (!selectedJob) return;

    const candidateId =
      getCandidateId(candidate);

    if (!candidateId) {
      setError(
        "Candidate ID is missing."
      );
      return;
    }

    setUpdatingCandidateStatus(true);
    setError("");
    setSuccess("");

    try {
      let application =
        getCandidateApplication(
          candidate,
          selectedJob
        );

      /*
       * EXISTING APPLICATION
       */

      if (application?.id) {
        const jobCandidateNumber =
          application.job_candidate_number ??
          await allocateJobCandidateNumber(
            supabase,
            selectedJob.id
          );

        const { error: updateError } =
          await supabase
            .from("applications")
            .update({
              status: newStatus,
              job_candidate_number: jobCandidateNumber,
            })
            .eq(
              "id",
              application.id
            );

        if (updateError) {
          throw new Error(
            updateError.message
          );
        }

        setApplications((current) =>
          current.map((item) =>
            item.id === application?.id
              ? {
                  ...item,
                  status: newStatus,
                  job_candidate_number: jobCandidateNumber,
                }
              : item
          )
        );
      }

      /*
       * NO APPLICATION YET
       *
       * Create a job-specific submission.
       */

      else {
        const databaseCandidateId =
          candidateIdForDatabase(
            candidate
          );

        if (!databaseCandidateId) {
          throw new Error(
            "Could not determine the database candidate ID."
          );
        }

        const jobCandidateNumber =
          await allocateJobCandidateNumber(
            supabase,
            selectedJob.id
          );

        const { data, error: insertError } =
          await supabase
            .from("applications")
            .insert({
              candidate_id:
                databaseCandidateId,
              job_id: selectedJob.id,
              status: newStatus,
              job_candidate_number: jobCandidateNumber,
            })
            .select("*")
            .single();

        if (insertError) {
          throw new Error(
            insertError.message
          );
        }

        application =
          data as Application;

        setApplications((current) => [
          ...current,
          application!,
        ]);
      }

      /*
       * Keep the local candidate status synchronized
       * for screens that still read candidate.status.
       *
       * We intentionally do NOT update the candidate's
       * global status in Supabase.
       */

      setCandidates((current) =>
        current.map((item) =>
          getCandidateId(item) ===
          candidateId
            ? {
                ...item,
                status: newStatus,
              }
            : item
        )
      );

      setSuccess(
        `${getCandidateName(
          candidate
        )} moved to ${formatStatus(
          newStatus
        )}.`
      );
    } catch (err) {
      console.error(
        "Candidate status update error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not update candidate status."
      );
    } finally {
      setUpdatingCandidateStatus(false);
    }
  }

  /*
   * =========================================================
   * RESUME
   * =========================================================
   */

  async function openResume(
    candidate: Candidate
  ) {
    if (!candidate.resume_path) {
      setError(
        "No resume is stored for this candidate."
      );
      return;
    }

    try {
      /*
       * Mark Viewed first.
       */

      if (selectedJob) {
        await markCandidateViewed(
          candidate,
          selectedJob
        );
      }

      const { data, error } =
        await supabase.storage
          .from("resumes")
          .createSignedUrl(
            candidate.resume_path,
            3600
          );

      if (
        error ||
        !data?.signedUrl
      ) {
        throw new Error(
          error?.message ||
            "Could not open resume."
        );
      }

      window.open(
        data.signedUrl,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (err) {
      console.error(
        "Resume error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not open resume."
      );
    }
  }

  /*
   * =========================================================
   * BACK NAVIGATION
   * =========================================================
   */

  function backToJobs() {
    router.push(
      "/recruiter/jobs"
    );
  }

  function backToJobPool() {
    if (!selectedJob) return;

    router.push(
      `/recruiter/jobs?job=${encodeURIComponent(
        selectedJob.id
      )}`
    );
  }

  /*
   * =========================================================
   * NEXT CANDIDATE
   * =========================================================
   */

  function nextCandidate() {
    if (
      !selectedJob ||
      selectedCandidateIndex <
        0 ||
      selectedCandidateIndex >=
        jobCandidates.length - 1
    ) {
      return;
    }

    const next =
      jobCandidates[
        selectedCandidateIndex + 1
      ];

    openCandidate(next);
  }

  /*
   * =========================================================
   * PREVIOUS CANDIDATE
   * =========================================================
   */

  function previousCandidate() {
    if (
      !selectedJob ||
      selectedCandidateIndex <= 0
    ) {
      return;
    }

    const previous =
      jobCandidates[
        selectedCandidateIndex - 1
      ];

    openCandidate(previous);
  }

  /*
   * =========================================================
   * UPDATE JOB STATUS
   * =========================================================
   */

  async function updateJobStatus(
    id: string,
    status: string
  ) {
    setError("");
    setSuccess("");

    const { error: updateError } =
      await supabase
        .from("jobs")
        .update({
          status,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", id);

    if (updateError) {
      setError(
        updateError.message
      );
      return;
    }

    setJobs((current) =>
      current.map((job) =>
        job.id === id
          ? {
              ...job,
              status,
            }
          : job
      )
    );

    setSuccess(
      `Job status changed to ${formatStatus(
        status
      )}.`
    );

    setOpenAction(null);
  }

  /*
   * =========================================================
   * JOB FILTERING
   * =========================================================
   */

  const filteredJobs = useMemo(() => {
    const value =
      search.toLowerCase().trim();

    return jobs.filter((job) => {
      if (
        clientFilter !== "all" &&
        job.company !== clientFilter
      ) {
        return false;
      }

      const requestedJobStatus =
        requestedStatus === "active"
          ? "published"
          : requestedStatus === "hold"
            ? "paused"
            : requestedStatus;
      const effectiveStatusFilter =
        statusFilter !== "all"
          ? statusFilter
          : requestedJobStatus || "all";

      if (
        effectiveStatusFilter !== "all" &&
        normalizeJobStatus(job.status) !== effectiveStatusFilter
      ) {
        return false;
      }

      if (!value) return true;

      const searchable = [
        job.job_id,
        job.title,
        job.company,
        job.location,
        job.type,
        job.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(value);
    });
  }, [
    jobs,
    search,
    clientFilter,
    statusFilter,
    requestedStatus,
  ]);

  /*
   * =========================================================
   * JOB CANDIDATE COUNTS
   * =========================================================
   */

  function getJobCandidatesCount(
    job: Job
  ) {
    const ids = new Set<string>();

    candidates.forEach((candidate) => {
      const candidateId =
        getCandidateId(candidate);

      if (
        candidate.job_id === job.id ||
        candidate.job_id === job.job_id
      ) {
        if (candidateId) {
          ids.add(candidateId);
        }
      }
    });

    applications.forEach((application) => {
      if (
        applicationMatchesJob(
          application,
          job
        ) &&
        application.candidate_id
      ) {
        ids.add(
          application.candidate_id
        );
      }
    });

    return ids.size;
  }

  /*
   * =========================================================
   * STATUS COUNT FOR JOB
   * =========================================================
   */

  function getJobStatusCount(
    job: Job,
    status: string
  ) {
    return applications.filter(
      (application) =>
        applicationMatchesJob(
          application,
          job
        ) &&
        normalizeStatus(
          application.status
        ) === status
    ).length;
  }

  /*
   * =========================================================
   * STATUS FORMAT
   * =========================================================
   */

  function formatStatus(
    status: string | null | undefined
  ) {
    const value =
      normalizeStatus(status);

    return value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) =>
        letter.toUpperCase()
      );
  }

  /*
   * =========================================================
   * JOB STATUS STYLE
   * =========================================================
   */

  function statusClass(
    status: string | null
  ) {
    switch (
      normalizeStatus(status)
    ) {
      case "published":
        return "border-green-400/20 bg-green-400/10 text-green-300";

      case "paused":
        return "border-yellow-400/20 bg-yellow-400/10 text-yellow-300";

      case "closed":
        return "border-red-400/20 bg-red-400/10 text-red-300";

      default:
        return "border-white/10 bg-white/[0.04] text-white/60";
    }
  }

  /*
   * =========================================================
   * CANDIDATE STATUS STYLE
   * =========================================================
   */

  function candidateStatusClass(
    status: string
  ) {
    switch (
      normalizeStatus(status)
    ) {
      case "new":
        return "border-blue-400/20 bg-blue-400/10 text-blue-300";

      case "viewed":
        return "border-purple-400/20 bg-purple-400/10 text-purple-300";

      case "submission":
        return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";

      case "interview":
        return "border-yellow-400/20 bg-yellow-400/10 text-yellow-300";

      case "offer":
        return "border-orange-400/20 bg-orange-400/10 text-orange-300";

      case "placed":
        return "border-green-400/20 bg-green-400/10 text-green-300";

      case "rejected":
        return "border-red-400/20 bg-red-400/10 text-red-300";

      default:
        return "border-white/10 bg-white/[0.04] text-white/60";
    }
  }

  /*
   * =========================================================
   * MESSAGES
   * =========================================================
   */

  const messages = (
    <>
      {error && (
        <div className="mb-5 flex items-center justify-between rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3">
          <p className="text-sm text-red-200">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            className="text-red-200/50 hover:text-red-200"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-5 flex items-center justify-between rounded-xl border border-green-400/20 bg-green-400/[0.06] px-4 py-3">
          <p className="text-sm text-green-200">
            {success}
          </p>

          <button
            type="button"
            onClick={() =>
              setSuccess("")
            }
            className="text-green-200/50 hover:text-green-200"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </>
  );

  /*
   * =========================================================
   * CANDIDATE PROFILE
   * =========================================================
   */

  if (
    selectedJob &&
    selectedCandidate
  ) {
    const fullName =
      getCandidateName(
        selectedCandidate
      );

    const currentStatus =
      candidateStatus(
        selectedCandidate
      );

    return (
      <main className="min-h-screen bg-[#03040a] text-white">
        <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">

          {messages}

          {/* TOP NAV */}

          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <button
              type="button"
              onClick={
                backToJobPool
              }
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/60 hover:bg-white/[0.08] hover:text-white"
            >
              <ArrowLeft
                size={16}
              />
              Back to{" "}
              {selectedJob.title}
            </button>

            <div className="flex flex-wrap items-center gap-2">

              <button
                type="button"
                onClick={
                  previousCandidate
                }
                disabled={
                  selectedCandidateIndex <=
                  0
                }
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/60 hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
              >
                <ChevronLeft
                  size={16}
                />
                Previous
              </button>

              <span className="px-2 text-xs text-white/30">
                {selectedCandidateIndex +
                  1}{" "}
                /{" "}
                {
                  jobCandidates.length
                }
              </span>

              <button
                type="button"
                onClick={
                  nextCandidate
                }
                disabled={
                  selectedCandidateIndex >=
                  jobCandidates.length -
                    1
                }
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/60 hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
              >
                Next
                <ChevronRight
                  size={16}
                />
              </button>

            </div>

          </div>

          {/* JOB CONTEXT */}

          <div className="mb-6 rounded-2xl border border-purple-400/20 bg-purple-400/[0.04] p-5">

            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-200/50">
              Candidate for
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-3">

              <BriefcaseBusiness
                size={18}
                className="text-purple-300"
              />

              <h1 className="text-xl font-semibold">
                {selectedJob.title}
              </h1>

              <span className="text-sm text-white/30">
                {selectedJob.company}
              </span>

            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-end">
              <label className="block min-w-0 flex-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-white/35">
                  Assign recruiter to this job&apos;s applications
                </span>
                <select
                  value={
                    selectedRecruiterId ||
                    (selectedJobRecruiterIds.length === 1
                      ? selectedJobRecruiterIds[0]
                      : "")
                  }
                  onChange={(event) =>
                    setSelectedRecruiterId(event.target.value)
                  }
                  className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-purple-400/40"
                >
                  <option value="" className="bg-[#0b0c13] text-white">
                    {selectedJobRecruiterIds.length > 1
                      ? "Multiple recruiters assigned"
                      : "Select recruiter"}
                  </option>
                  {recruiters.map((recruiter) => (
                    <option
                      key={recruiter.id}
                      value={recruiter.id}
                      className="bg-[#0b0c13] text-white"
                    >
                      {recruiter.full_name || recruiter.email || recruiter.id}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={
                  assigningRecruiter ||
                  (!selectedRecruiterId &&
                    selectedJobRecruiterIds.length !== 1)
                }
                onClick={assignRecruiterToJob}
                className="h-11 rounded-xl bg-white px-5 text-sm font-semibold text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {assigningRecruiter ? "Saving..." : "Save Assignment"}
              </button>
            </div>

          </div>

          {/* PROFILE */}

          <section className="grid gap-6 lg:grid-cols-[380px_1fr]">

            {/* LEFT PROFILE */}

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">

              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-purple-400/10 text-purple-200">
                <UserRound
                  size={34}
                />
              </div>

              <h2 className="mt-5 text-2xl font-semibold">
                {fullName}
              </h2>

              <p className="mt-2 text-sm text-white/40">
                {selectedCandidate.current_job_title ||
                  "Candidate"}
              </p>

              {/* STATUS */}

              <div className="mt-7">

                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/25">
                  Submission Status
                </p>

                <select
                  value={currentStatus}
                  disabled={
                    updatingCandidateStatus
                  }
                  onChange={(event) =>
                    updateCandidateStatus(
                      selectedCandidate,
                      event.target.value
                    )
                  }
                  className={`h-11 w-full rounded-xl border px-3 text-sm font-medium outline-none ${candidateStatusClass(
                    currentStatus
                  )} ${
                    updatingCandidateStatus
                      ? "cursor-wait opacity-60"
                      : "cursor-pointer"
                  }`}
                >
                  {SUBMISSION_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                        className="bg-[#0b0c13] text-white"
                      >
                        {formatStatus(
                          status
                        )}
                      </option>
                    )
                  )}
                </select>

              </div>

              <div className="mt-7 space-y-4">

                <div className="flex gap-3">
                  <Mail
                    size={17}
                    className="mt-0.5 text-white/25"
                  />

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/25">
                      Email
                    </p>

                    <p className="mt-1 break-all text-sm text-white/70">
                      {selectedCandidate.email ||
                        "—"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Phone
                    size={17}
                    className="mt-0.5 text-white/25"
                  />

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/25">
                      Phone
                    </p>

                    <p className="mt-1 text-sm text-white/70">
                      {selectedCandidate.phone ||
                        "—"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <UserRound
                    size={17}
                    className="mt-0.5 text-white/25"
                  />

                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-white/25">
                      Candidate ID
                    </p>

                    <p className="mt-1 font-mono text-sm text-purple-200/80">
                      {selectedCandidate.candidate_id ||
                        "—"}
                    </p>
                  </div>
                </div>

              </div>

            </div>

            {/* RIGHT RESUME */}

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/25">
                    Resume
                  </p>

                  <h2 className="mt-2 text-xl font-semibold">
                    Candidate Resume
                  </h2>

                  <p className="mt-1 text-sm text-white/35">
                    Open the stored resume without leaving this job.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    openResume(
                      selectedCandidate
                    )
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90"
                >
                  <FileText
                    size={17}
                  />
                  Open Resume
                </button>

              </div>

              <div className="mt-7 flex min-h-[450px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-black/20">

                <div className="text-center">

                  <FileText
                    size={45}
                    className="mx-auto text-white/10"
                  />

                  <p className="mt-4 text-sm text-white/40">
                    {selectedCandidate.resume_path
                      ? "Resume available"
                      : "No resume uploaded"}
                  </p>

                  {selectedCandidate.resume_path && (
                    <button
                      type="button"
                      onClick={() =>
                        openResume(
                          selectedCandidate
                        )
                      }
                      className="mt-4 inline-flex items-center gap-2 text-sm text-purple-300 hover:text-purple-200"
                    >
                      <ExternalLink
                        size={15}
                      />
                      View resume
                    </button>
                  )}

                </div>

              </div>

            </div>

          </section>

        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * JOB-SPECIFIC CANDIDATE POOL
   * =========================================================
   */

  if (selectedJob) {
    return (
      <main className="min-h-screen bg-[#03040a] text-white">
        <div className="mx-auto max-w-[1700px] px-5 py-8 sm:px-8">

          {messages}

          {/* HEADER */}

          <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <button
                type="button"
                onClick={
                  backToJobs
                }
                className="mb-5 inline-flex items-center gap-2 text-sm text-white/40 hover:text-white"
              >
                <ArrowLeft
                  size={16}
                />
                Back to Jobs
              </button>

              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-purple-200/70">
                HireX ATS
              </p>

              <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
                {selectedJob.title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/40">

                <span>
                  {selectedJob.company ||
                    "No client"}
                </span>

                <span className="text-white/15">
                  •
                </span>

                <span>
                  {selectedJob.location ||
                    "Location not specified"}
                </span>

                <span className="text-white/15">
                  •
                </span>

                <span>
                  {selectedJob.job_id ||
                    "No Job ID"}
                </span>

              </div>

            </div>

            <div className="flex items-center gap-3">

              <span
                className={`rounded-full border px-3 py-1.5 text-xs ${statusClass(
                  selectedJob.status
                )}`}
              >
                {formatStatus(
                  selectedJob.status
                )}
              </span>

              <button
                type="button"
                onClick={
                  loadCandidateData
                }
                disabled={
                  candidateLoading
                }
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/60 hover:bg-white/[0.08] hover:text-white"
              >
                <Loader2
                  size={15}
                  className={
                    candidateLoading
                      ? "animate-spin"
                      : ""
                  }
                />
                Refresh
              </button>

            </div>

          </div>

          {/* STATUS COUNTS */}

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

              <div className="flex items-center gap-3">
                <Users
                  size={19}
                  className="text-purple-300"
                />

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-white/25">
                    Candidates
                  </p>

                  <p className="mt-1 text-2xl font-semibold">
                    {getJobCandidatesCount(
                      selectedJob
                    )}
                  </p>
                </div>
              </div>

            </div>

            <div className="rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.025] p-5">

              <div className="flex items-center gap-3">
                <Send
                  size={19}
                  className="text-cyan-300"
                />

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-cyan-200/40">
                    Submissions
                  </p>

                  <p className="mt-1 text-2xl font-semibold">
                    {getJobStatusCount(
                      selectedJob,
                      "submission"
                    )}
                  </p>
                </div>
              </div>

            </div>

            <div className="rounded-2xl border border-yellow-400/10 bg-yellow-400/[0.025] p-5">

              <div className="flex items-center gap-3">
                <Clock3
                  size={19}
                  className="text-yellow-300"
                />

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-yellow-200/40">
                    Interviews
                  </p>

                  <p className="mt-1 text-2xl font-semibold">
                    {getJobStatusCount(
                      selectedJob,
                      "interview"
                    )}
                  </p>
                </div>
              </div>

            </div>

            <div className="rounded-2xl border border-orange-400/10 bg-orange-400/[0.025] p-5">

              <div className="flex items-center gap-3">
                <BadgeCheck
                  size={19}
                  className="text-orange-300"
                />

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-orange-200/40">
                    Offers
                  </p>

                  <p className="mt-1 text-2xl font-semibold">
                    {getJobStatusCount(
                      selectedJob,
                      "offer"
                    )}
                  </p>
                </div>
              </div>

            </div>

            <div className="rounded-2xl border border-green-400/10 bg-green-400/[0.025] p-5">

              <div className="flex items-center gap-3">
                <CheckCircle2
                  size={19}
                  className="text-green-300"
                />

                <div>
                  <p className="text-[10px] uppercase tracking-wider text-green-200/40">
                    Placed
                  </p>

                  <p className="mt-1 text-2xl font-semibold">
                    {getJobStatusCount(
                      selectedJob,
                      "placed"
                    )}
                  </p>
                </div>
              </div>

            </div>

          </div>

          {/* CANDIDATE TABLE */}

          <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">

            {candidateLoading ? (
              <div className="flex min-h-[400px] items-center justify-center text-white/35">
                <Loader2
                  size={20}
                  className="mr-3 animate-spin"
                />
                Loading candidates...
              </div>
            ) : jobCandidates.length ===
              0 ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center text-center">

                <Users
                  size={42}
                  className="text-white/10"
                />

                <h2 className="mt-5 text-lg font-semibold">
                  No candidates in this job
                </h2>

                <p className="mt-2 max-w-md text-sm text-white/35">
                  Candidates assigned to this job or candidates who apply to it will appear here.
                </p>

              </div>
            ) : (
              <div className="overflow-x-auto">

                <table className="w-full min-w-[1200px]">

                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.025] text-left">

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/30">
                        Candidate ID
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/30">
                        Job Candidate
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/30">
                        Candidate
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/30">
                        Current Title
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/30">
                        Contact
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/30">
                        Submission Status
                      </th>

                      <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/30">
                        Resume
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {jobCandidates.map(
                      (candidate) => {
                        const id =
                          getCandidateId(
                            candidate
                          );

                        const name =
                          getCandidateName(
                            candidate
                          );

                        const status =
                          candidateStatus(
                            candidate
                          );

                        const application =
                          getCandidateApplication(
                            candidate
                          );

                        return (
                          <tr
                            key={id}
                            onClick={() =>
                              openCandidate(
                                candidate
                              )
                            }
                            className="cursor-pointer border-b border-white/[0.06] transition hover:bg-white/[0.035]"
                          >

                            <td className="px-5 py-5">
                              <span className="font-mono text-xs text-purple-200/80">
                                {candidate.candidate_id ||
                                  "—"}
                              </span>
                            </td>

                            <td className="px-5 py-5">
                              <span className="font-mono text-xs text-cyan-200/80">
                                {application?.job_candidate_number
                                  ? `JC-${String(application.job_candidate_number).padStart(3, "0")}`
                                  : "—"}
                              </span>
                            </td>

                            <td className="px-5 py-5">

                              <p
                                className={`text-sm ${
                                  status ===
                                  "new"
                                    ? "font-semibold text-blue-300"
                                    : "font-medium text-white"
                                }`}
                              >
                                {name}
                              </p>

                              <p className="mt-1 text-xs text-white/30">
                                {candidate.email ||
                                  "No email"}
                              </p>

                            </td>

                            <td className="px-5 py-5 text-sm text-white/55">
                              {candidate.current_job_title ||
                                "—"}
                            </td>

                            <td className="px-5 py-5">

                              <div className="space-y-1">

                                <p className="text-xs text-white/55">
                                  {candidate.email ||
                                    "—"}
                                </p>

                                <p className="text-xs text-white/30">
                                  {candidate.phone ||
                                    "—"}
                                </p>

                              </div>

                            </td>

                            <td className="px-5 py-5">

                              <span
                                className={`inline-flex rounded-full border px-3 py-1.5 text-xs ${candidateStatusClass(
                                  status
                                )}`}
                              >
                                {formatStatus(
                                  status
                                )}
                              </span>

                            </td>

                            <td className="px-5 py-5">

                              <button
                                type="button"
                                onClick={(
                                  event
                                ) => {
                                  event.stopPropagation();

                                  openCandidate(
                                    candidate
                                  );
                                }}
                                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/60 hover:bg-white/[0.08] hover:text-white"
                              >
                                <FileText
                                  size={14}
                                />
                                Open Profile
                              </button>

                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </section>

        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * MAIN JOB LIST
   * =========================================================
   */

  return (
    <main className="min-h-screen bg-[#03040a] text-white">
      <div className="mx-auto max-w-[1700px] px-5 py-8 sm:px-8">

        {messages}

        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          <div>

            <Link
              href="/recruiter"
              className="mb-5 inline-flex items-center gap-2 text-sm text-white/40 hover:text-white"
            >
              <ArrowLeft
                size={16}
              />
              Back to ATS Dashboard
            </Link>

            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-purple-200/70">
              HireX ATS
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
              Jobs
            </h1>

            <p className="mt-2 text-sm text-white/40">
              Manage openings and view each job&apos;s candidate pool.
            </p>

          </div>

          <Link
            href="/recruiter/jobs/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90"
          >
            <Plus
              size={17}
            />
            Create Job
          </Link>

        </div>

        {/* FILTERS */}

        <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.025] p-4">

          <div className="flex flex-col gap-3 xl:flex-row">

            <div className="relative flex-1">

              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search job ID, position, client, location..."
                className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-purple-400/40"
              />

            </div>

            <select
              value={
                clientFilter
              }
              onChange={(event) =>
                setClientFilter(
                  event.target.value
                )
              }
              className="h-11 rounded-xl border border-white/10 bg-[#090a11] px-4 text-sm text-white/70 outline-none focus:border-purple-400/40"
            >
              <option value="all">
                All Clients
              </option>

              {clients.map(
                (client) => (
                  <option
                    key={client}
                    value={client}
                  >
                    {client}
                  </option>
                )
              )}
            </select>

            <select
              value={
                statusFilter
              }
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="h-11 rounded-xl border border-white/10 bg-[#090a11] px-4 text-sm text-white/70 outline-none focus:border-purple-400/40"
            >
              <option value="all">
                All Statuses
              </option>

              <option value="published">
                Published
              </option>

              <option value="draft">
                Draft
              </option>

              <option value="paused">
                Paused
              </option>

              <option value="closed">
                Closed
              </option>
            </select>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setClientFilter(
                  "all"
                );
                setStatusFilter(
                  "all"
                );
              }}
              className="h-11 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white/50 hover:bg-white/[0.07] hover:text-white"
            >
              Clear
            </button>

          </div>

        </section>

        {/* JOB TABLE */}

        {loading ? (
          <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.025] text-white/35">
            <Loader2
              size={20}
              className="mr-3 animate-spin"
            />
            Loading jobs...
          </div>
        ) : filteredJobs.length ===
          0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.025] text-center">

            <BriefcaseBusiness
              size={42}
              className="text-white/10"
            />

            <h2 className="mt-5 text-lg font-semibold">
              No jobs found
            </h2>

            <p className="mt-2 text-sm text-white/35">
              Try changing your search or filters.
            </p>

          </div>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1250px]">

                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.025] text-left">

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/30">
                      Job ID
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/30">
                      Position
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/30">
                      Client
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/30">
                      Location
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/30">
                      Type
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/30">
                      Status
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/30">
                      Candidates
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/30">
                      Created
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/30">
                      Actions
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {filteredJobs.map(
                    (job) => {
                      const jobStatus = normalizeJobStatus(job.status);
                      const count =
                        getJobCandidatesCount(
                          job
                        );

                      return (
                        <tr
                          key={job.id}
                          className="border-b border-white/[0.06] transition hover:bg-white/[0.025]"
                        >

                          {/* JOB ID */}

                          <td className="px-5 py-5">
                            <span className="font-mono text-xs text-purple-200/80">
                              {job.job_id ||
                                "—"}
                            </span>
                          </td>

                          {/* POSITION */}

                          <td className="px-5 py-5">

                            <button
                              type="button"
                              onClick={() =>
                                openJob(
                                  job.id
                                )
                              }
                              className="text-left"
                            >
                              <p className="font-medium text-white hover:text-purple-200">
                                {job.title ||
                                  "Untitled Job"}
                              </p>

                              <p className="mt-1 text-xs text-white/25">
                                Open job pool
                              </p>
                            </button>

                          </td>

                          {/* CLIENT */}

                          <td className="px-5 py-5 text-sm text-white/65">
                            {job.company ||
                              "—"}
                          </td>

                          {/* LOCATION */}

                          <td className="px-5 py-5 text-sm text-white/55">
                            {job.location ||
                              "—"}
                          </td>

                          {/* TYPE */}

                          <td className="px-5 py-5 text-sm text-white/55">
                            {job.type ||
                              "—"}
                          </td>

                          {/* STATUS */}

                          <td className="px-5 py-5">

                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs capitalize ${statusClass(
                                job.status
                              )}`}
                            >
                              {formatStatus(
                                job.status
                              )}
                            </span>

                          </td>

                          {/* CANDIDATES */}

                          <td className="px-5 py-5">

                            <button
                              type="button"
                              onClick={() =>
                                openJob(
                                  job.id
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-lg border border-purple-400/15 bg-purple-400/[0.05] px-3 py-2 text-sm text-purple-200 hover:bg-purple-400/10"
                            >
                              <Users
                                size={14}
                              />

                              {count}
                            </button>

                          </td>

                          {/* CREATED */}

                          <td className="px-5 py-5 text-xs text-white/40">
                            {job.created_at
                              ? new Date(
                                  job.created_at
                                ).toLocaleDateString()
                              : "—"}
                          </td>

                          {/* ACTIONS */}

                          <td className="relative px-5 py-5">

                            <button
                              type="button"
                              onClick={() =>
                                setOpenAction(
                                  openAction ===
                                    job.id
                                    ? null
                                    : job.id
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/65 hover:bg-white/[0.08] hover:text-white"
                            >
                              Actions

                              <ChevronDown
                                size={15}
                              />
                            </button>

                            {openAction ===
                              job.id && (
                              <div className="absolute right-5 top-[65px] z-50 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#0b0c13] shadow-2xl">

                                <button
                                  type="button"
                                  onClick={() =>
                                    openJob(
                                      job.id
                                    )
                                  }
                                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white/70 hover:bg-white/[0.06] hover:text-white"
                                >
                                  <Users
                                    size={15}
                                  />
                                  View Candidates
                                </button>

                                <Link
                                  href={`/recruiter/jobs/${job.id}/edit`}
                                  onClick={() =>
                                    setOpenAction(
                                      null
                                    )
                                  }
                                  className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:bg-white/[0.06] hover:text-white"
                                >
                                  <Pencil
                                    size={15}
                                  />
                                  Edit Job
                                </Link>

                                <Link
                                  href={`/jobs/${job.id}`}
                                  target="_blank"
                                  onClick={() =>
                                    setOpenAction(
                                      null
                                    )
                                  }
                                  className="flex items-center gap-3 px-4 py-3 text-sm text-white/70 hover:bg-white/[0.06] hover:text-white"
                                >
                                  <ExternalLink
                                    size={15}
                                  />
                                  View Public Job
                                </Link>

                                {jobStatus ===
                                  "active" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateJobStatus(
                                        job.id,
                                        "paused"
                                      )
                                    }
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-yellow-300/80 hover:bg-yellow-400/[0.06]"
                                  >
                                    <Pause
                                      size={15}
                                    />
                                    Pause Job
                                  </button>
                                )}

                                {(jobStatus ===
                                  "hold" ||
                                  jobStatus ===
                                    "draft") && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateJobStatus(
                                        job.id,
                                        "published"
                                      )
                                    }
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-green-300/80 hover:bg-green-400/[0.06]"
                                  >
                                    <Play
                                      size={15}
                                    />
                                    Publish Job
                                  </button>
                                )}

                                {jobStatus ===
                                  "closed" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateJobStatus(
                                        job.id,
                                        "published"
                                      )
                                    }
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-green-300/80 hover:bg-green-400/[0.06]"
                                  >
                                    <Play
                                      size={15}
                                    />
                                    Reopen Job
                                  </button>
                                )}

                                {jobStatus !==
                                  "closed" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateJobStatus(
                                        job.id,
                                        "closed"
                                      )
                                    }
                                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-300/80 hover:bg-red-400/[0.06]"
                                  >
                                    <XCircle
                                      size={15}
                                    />
                                    Close Job
                                  </button>
                                )}

                              </div>
                            )}

                            <div className="mt-3 flex min-w-[280px] flex-col gap-2">
                              <label className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
                                Assigned Recruiter
                              </label>
                              <select
                                aria-label={`Assigned recruiter for ${job.title || job.job_id || "job"}`}
                                value={getJobRecruiterSelection(job)}
                                onChange={(event) =>
                                  setJobRecruiterSelections((current) => ({
                                    ...current,
                                    [job.id]: event.target.value,
                                  }))
                                }
                                className="h-10 rounded-lg border border-white/10 bg-black/20 px-3 text-xs text-white outline-none focus:border-purple-400/40"
                              >
                                <option value="" className="bg-[#0b0c13] text-white">
                                  Select recruiter
                                </option>
                                {recruiters.map((recruiter) => (
                                  <option
                                    key={recruiter.id}
                                    value={recruiter.id}
                                    className="bg-[#0b0c13] text-white"
                                  >
                                    {recruiter.full_name || recruiter.email || recruiter.id}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                disabled={
                                  assigningRecruiter ||
                                  !getJobRecruiterSelection(job)
                                }
                                onClick={() => assignRecruiterFromJobRow(job)}
                                className="h-10 rounded-lg bg-white px-3 text-xs font-semibold text-black hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {assigningRecruiter ? "Saving..." : "Save Assignment"}
                              </button>
                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

            <div className="border-t border-white/10 px-5 py-4 text-xs text-white/30">
              {filteredJobs.length}{" "}
              {filteredJobs.length ===
              1
                ? "job"
                : "jobs"}
            </div>

          </section>
        )}

      </div>
    </main>
  );
}

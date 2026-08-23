"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness,
  Users,
  CalendarDays,
  CheckCircle2,
  XCircle,
  FileText,
  Loader2,
  RefreshCw,
  PauseCircle,
  Lock,
  ArrowRight,
  UserRound,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { normalizeApplicationStatus as normalizeSharedApplicationStatus } from "../../lib/statuses";

type Job = {
  id: string;
  job_id: string | null;
  title: string;
  company: string | null;
  location: string | null;
  status: string | null;
  openings: number | null;
  created_at: string | null;
  recruiter_id?: string | null;
};

type Application = {
  id: string;
  candidate_id: string;
  job_id: string;
  status: string | null;
  applied_at: string | null;
  recruiter_id?: string | null;
  job_candidate_number?: number | null;
};

type DateRange =
  | "all"
  | "today"
  | "yesterday"
  | "7"
  | "month"
  | "custom";

function getDateRangeStart(range: DateRange) {
  if (range === "all" || range === "custom") {
    return null;
  }

  const date = new Date();

  if (range === "today") {
    date.setHours(0, 0, 0, 0);
    return date;
  }

  if (range === "yesterday") {
    date.setDate(date.getDate() - 1);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  if (range === "month") {
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  date.setDate(date.getDate() - Number(range));

  return date;
}

function isWithinDateRange(
  value: string | null,
  range: DateRange,
  customFrom: string,
  customTo: string
) {
  if (!value || range === "all") {
    return true;
  }

  const date = new Date(value);

  if (range === "custom") {
    if (customFrom) {
      const from = new Date(`${customFrom}T00:00:00`);

      if (date < from) {
        return false;
      }
    }

    if (customTo) {
      const to = new Date(`${customTo}T23:59:59`);

      if (date > to) {
        return false;
      }
    }

    return true;
  }

  const start = getDateRangeStart(range);

  if (!start) {
    return true;
  }

  if (range === "yesterday") {
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return date < end;
  }

  return date >= start;
}

function normalizeJobStatus(status: string | null) {
  const value = (status || "").toLowerCase().trim();

  if (
    value === "published" ||
    value === "open" ||
    value === "active"
  ) {
    return "active";
  }

  if (
    value === "hold" ||
    value === "on hold" ||
    value === "paused"
  ) {
    return "hold";
  }

  if (
    value === "closed" ||
    value === "close"
  ) {
    return "closed";
  }

  if (
    value === "filled" ||
    value === "hired"
  ) {
    return "filled";
  }

  return value || "draft";
}

export default function RecruiterDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] =
    useState<Application[]>([]);
  const [candidateCount, setCandidateCount] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [currentUserId, setCurrentUserId] =
    useState("");

  const [currentUserName, setCurrentUserName] =
    useState("Recruiter");

  const [isOwner, setIsOwner] =
    useState(false);

  const [isPrivilegedUser, setIsPrivilegedUser] =
    useState(false);

  const [dateRange, setDateRange] =
    useState<DateRange>("all");

  const [customFrom, setCustomFrom] =
    useState("");

  const [customTo, setCustomTo] =
    useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          "Your recruiter session has expired."
        );
      }

      setCurrentUserId(user.id);

      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split("@")[0] ||
        "Recruiter";

      setCurrentUserName(fullName);

      const { data: profile } = await supabase
        .from("profiles")
        .select("role,status")
        .eq("id", user.id)
        .maybeSingle();

      const role = String(
        profile?.role ||
          user.user_metadata?.role ||
          user.user_metadata?.user_role ||
          ""
      ).toLowerCase();

      const privileged = [
        "owner",
        "admin",
        "super_admin",
      ].includes(role);

      setIsOwner(privileged);
      setIsPrivilegedUser(privileged);

      /*
       * JOBS
       */

      const jobsRequest = await supabase
        .from("jobs")
        .select(
          "id,job_id,title,company,location,status,openings,created_at"
        )
        .order("created_at", {
          ascending: false,
        });

      let jobsData: Job[] = [];

      if (jobsRequest.error) {
        throw new Error(`Jobs: ${jobsRequest.error.message}`);
      }

      jobsData = (jobsRequest.data as Job[]) || [];

      /*
       * APPLICATIONS
       */

      const applicationsRequest = await supabase
        .from("applications")
        .select(
          "id,candidate_id,job_id,status,applied_at,recruiter_id,job_candidate_number"
        )
          .order("applied_at", {
            ascending: false,
          });

      if (applicationsRequest.error) {
        throw new Error(
          `Applications: ${applicationsRequest.error.message}`
        );
      }

      const applicationsData =
        (applicationsRequest.data as Application[]) || [];

      /*
       * CANDIDATES
       *
       * IMPORTANT:
       * The actual primary-key column in the
       * candidates table is uppercase "ID".
       *
       * We fetch the rows and count them locally.
       */

      const candidatesRequest =
        await supabase
          .from("candidates")
          .select("ID,candidate_id,first_name,last_name");

      if (candidatesRequest.error) {
        throw new Error(
          `Candidates: ${candidatesRequest.error.message}`
        );
      }

      const candidatesData = candidatesRequest.data || [];

      setCandidateCount(
        candidatesData.length
      );

      setJobs(jobsData);
      setApplications(
        applicationsData
      );
    } catch (err) {
      console.error(
        "Recruiter dashboard error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Could not load recruiter dashboard."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadDashboard);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("recruiter-dashboard-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, () => void loadDashboard())
      .on("postgres_changes", { event: "*", schema: "public", table: "candidates" }, () => void loadDashboard())
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, () => void loadDashboard())
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, []);

  const filteredApplications =
    useMemo(() => {
      return applications.filter(
        (application) =>
          isWithinDateRange(
            application.applied_at,
            dateRange,
            customFrom,
            customTo
          )
      );
    }, [
      applications,
      dateRange,
      customFrom,
      customTo,
    ]);

  const filteredJobs =
    useMemo(() => {
      return jobs.filter(
        (job) =>
          isWithinDateRange(
            job.created_at,
            dateRange,
            customFrom,
            customTo
          )
      );
    }, [
      jobs,
      dateRange,
      customFrom,
      customTo,
    ]);

  const jobCounts = useMemo(() => {
    return {
      total: filteredJobs.length,

      active: filteredJobs.filter(
        (job) =>
          normalizeJobStatus(
            job.status
          ) === "active"
      ).length,

      hold: filteredJobs.filter(
        (job) =>
          normalizeJobStatus(
            job.status
          ) === "hold"
      ).length,

      closed: filteredJobs.filter(
        (job) =>
          normalizeJobStatus(
            job.status
          ) === "closed"
      ).length,

      filled: filteredJobs.filter(
        (job) =>
          normalizeJobStatus(
            job.status
          ) === "filled"
      ).length,
    };
  }, [filteredJobs]);

  const recruiterApplications =
    useMemo(() => {
      if (isPrivilegedUser) {
        return filteredApplications;
      }

      return filteredApplications.filter(
        (application) =>
          application.recruiter_id === currentUserId
      );
    }, [
      filteredApplications,
      currentUserId,
      isPrivilegedUser,
    ]);

  const pipelineCounts =
    useMemo(() => {
      return {
        submission: recruiterApplications.filter(
          (application) => normalizeSharedApplicationStatus(application.status) === "submission"
        ).length,
        interview: recruiterApplications.filter(
          (application) => normalizeSharedApplicationStatus(application.status) === "interview"
        ).length,
        offer: recruiterApplications.filter(
          (application) => normalizeSharedApplicationStatus(application.status) === "offer"
        ).length,
        start: recruiterApplications.filter(
          (application) => normalizeSharedApplicationStatus(application.status) === "start"
        ).length,
        rejected: recruiterApplications.filter(
          (application) => normalizeSharedApplicationStatus(application.status) === "rejected"
        ).length,
      };
    }, [recruiterApplications]);

  const recruiterJobs = useMemo(() => {
    if (isPrivilegedUser) {
      return jobs;
    }

    const assignedJobIds = new Set(
      recruiterApplications.map((application) => application.job_id)
    );

    return jobs.filter((job) => assignedJobIds.has(job.id));
  }, [jobs, isPrivilegedUser, recruiterApplications]);

  const recruiterSubmissions =
    recruiterApplications.filter(
      (application) =>
        normalizeSharedApplicationStatus(
          application.status
        ) === "submission"
    ).length;

  const recruiterInterviews =
    recruiterApplications.filter(
      (application) =>
        normalizeSharedApplicationStatus(
          application.status
        ) === "interview"
    ).length;

  const recruiterOffers =
    recruiterApplications.filter(
      (application) =>
        normalizeSharedApplicationStatus(
          application.status
        ) === "offer"
    ).length;

  const recruiterStarts =
    recruiterApplications.filter(
      (application) =>
        normalizeSharedApplicationStatus(
          application.status
        ) === "start"
    ).length;

  return (
    <main className="min-h-screen bg-[#03040a] text-white">
      <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8 lg:py-10">

        <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-purple-200/80">
              HireX ATS
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              Recruiter Dashboard
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
              Welcome back,{" "}
              {currentUserName}. Manage jobs,
              candidates, submissions and hiring
              activity.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/70 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>
        </header>

        <section className="mb-8 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold">
                Dashboard Period
              </p>

              <p className="mt-1 text-xs text-white/35">
                Choose the period used for jobs
                and recruiting activity.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", "All Time"],
                  ["today", "Today"],
                  ["yesterday", "Yesterday"],
                  ["7", "Last 7 days"],
                  ["month", "This month"],
                  ["custom", "Custom"],
                ] as [
                  DateRange,
                  string
                ][]
              ).map(
                ([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setDateRange(value)
                    }
                    className={
                      "rounded-lg border px-3 py-2 text-xs font-medium transition " +
                      (dateRange === value
                        ? "border-purple-400/30 bg-purple-400/10 text-purple-200"
                        : "border-white/10 bg-white/[0.03] text-white/45 hover:bg-white/[0.07] hover:text-white")
                    }
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          </div>

          {dateRange === "custom" && (
            <div className="mt-4 flex flex-col gap-3 border-t border-white/[0.06] pt-4 sm:flex-row">
              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-white/30">
                  From
                </label>

                <input
                  type="date"
                  value={customFrom}
                  onChange={(event) =>
                    setCustomFrom(
                      event.target.value
                    )
                  }
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white outline-none focus:border-purple-400/40"
                />
              </div>

              <div>
                <label className="mb-1 block text-[10px] uppercase tracking-wider text-white/30">
                  To
                </label>

                <input
                  type="date"
                  value={customTo}
                  onChange={(event) =>
                    setCustomTo(
                      event.target.value
                    )
                  }
                  className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-white outline-none focus:border-purple-400/40"
                />
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => setDateRange("custom")}
                  className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-black hover:bg-white/90"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDateRange("all");
                    setCustomFrom("");
                    setCustomTo("");
                  }}
                  className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/55 hover:bg-white/[0.06] hover:text-white"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </section>

        {error && (
          <section className="mb-8 rounded-2xl border border-red-400/20 bg-red-400/[0.05] p-5">
            <p className="font-semibold text-red-200">
              Dashboard could not load
            </p>

            <p className="mt-1 text-sm text-red-200/60">
              {error}
            </p>

            <button
              type="button"
              onClick={loadDashboard}
              className="mt-4 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black"
            >
              Try Again
            </button>
          </section>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24 text-white/40">
            <Loader2
              size={20}
              className="mr-3 animate-spin"
            />
            Loading dashboard...
          </div>
        ) : (
          <>
            <section>
              <SectionTitle
                title="Jobs"
                description="Company-wide job overview"
              />

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <DashboardStatLink
                  href="/recruiter/jobs"
                  label="Total Jobs"
                  value={jobCounts.total}
                  description="All jobs"
                  icon={
                    <BriefcaseBusiness
                      size={20}
                    />
                  }
                />

                <DashboardStatLink
                  href="/recruiter/jobs?status=active"
                  label="Active"
                  value={jobCounts.active}
                  description="Currently open"
                  icon={
                    <CheckCircle2
                      size={20}
                    />
                  }
                  accent="green"
                />

                <DashboardStatLink
                  href="/recruiter/jobs?status=hold"
                  label="Hold"
                  value={jobCounts.hold}
                  description="Temporarily paused"
                  icon={
                    <PauseCircle
                      size={20}
                    />
                  }
                  accent="yellow"
                />

                <DashboardStatLink
                  href="/recruiter/jobs?status=closed"
                  label="Closed"
                  value={jobCounts.closed}
                  description="Closed jobs"
                  icon={
                    <Lock size={20} />
                  }
                />

                <DashboardStatLink
                  href="/recruiter/jobs?status=filled"
                  label="Filled"
                  value={jobCounts.filled}
                  description="Successfully filled"
                  icon={
                    <CheckCircle2
                      size={20}
                    />
                  }
                  accent="blue"
                />
              </div>
            </section>

            <section className="mt-8">
              <SectionTitle
                title="Candidates & Recruiting"
                description="Candidate database and hiring pipeline"
              />

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
                <DashboardStatLink
                  href="/recruiter/candidates"
                  label="Candidates Pool"
                  value={candidateCount}
                  description="All candidates"
                  icon={
                    <Users size={20} />
                  }
                  accent="blue"
                />

                <DashboardStatLink
                  href="/recruiter/submissions"
                  label="Submissions"
                  value={
                    pipelineCounts.submission
                  }
                  description="Sent to clients"
                  icon={
                    <FileText
                      size={20}
                    />
                  }
                  accent="blue"
                />

                <DashboardStatLink
                  href="/recruiter/interviews"
                  label="Interviews"
                  value={
                    pipelineCounts.interview
                  }
                  description="Client interviews"
                  icon={
                    <CalendarDays
                      size={20}
                    />
                  }
                  accent="yellow"
                />

                <DashboardStatLink
                  href="/recruiter/offers"
                  label="Offer"
                  value={
                    pipelineCounts.offer
                  }
                  description="Offer received"
                  icon={
                    <FileText
                      size={20}
                    />
                  }
                  accent="orange"
                />

                <DashboardStatLink
                  href="/recruiter/starts"
                  label="Start"
                  value={
                    pipelineCounts.start
                  }
                  description="Candidate starts"
                  icon={
                    <CheckCircle2
                      size={20}
                    />
                  }
                  accent="green"
                />

                <DashboardStatLink
                  href="/recruiter/rejected"
                  label="Rejected"
                  value={
                    pipelineCounts.rejected
                  }
                  description="Rejected candidates"
                  icon={
                    <XCircle
                      size={20}
                    />
                  }
                  accent="red"
                />
              </div>
            </section>

            <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.025] p-6">
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    Recruiter Activity
                  </h2>

                  <p className="mt-1 text-xs text-white/35">
                    Your jobs, submissions and hiring
                    activity
                  </p>
                </div>

                <Link
                  href="/recruiter/recruiters"
                  className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/50 transition hover:bg-white/[0.07] hover:text-white"
                >
                  <UserRound size={14} />
                  View Recruiters
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <DashboardStatLink
                  href="/recruiter/recruiters"
                  label="Recruiter Jobs"
                  value={
                    recruiterJobs.length
                  }
                  description="Jobs assigned to you"
                  icon={
                    <BriefcaseBusiness
                      size={18}
                    />
                  }
                />

                <DashboardStatLink
                  href="/recruiter/recruiters"
                  label="Submissions"
                  value={
                    recruiterSubmissions
                  }
                  description="Your submissions"
                  icon={
                    <FileText size={18} />
                  }
                  accent="blue"
                />

                <DashboardStatLink
                  href="/recruiter/recruiters"
                  label="Interviews"
                  value={
                    recruiterInterviews
                  }
                  description="Your interviews"
                  icon={
                    <CalendarDays
                      size={18}
                    />
                  }
                  accent="yellow"
                />

                <DashboardStatLink
                  href="/recruiter/recruiters"
                  label="Offer"
                  value={recruiterOffers}
                  description="Your offer count"
                  icon={
                    <FileText size={18} />
                  }
                  accent="orange"
                />

                <DashboardStatLink
                  href="/recruiter/recruiters"
                  label="Start"
                  value={recruiterStarts}
                  description="Your start count"
                  icon={
                    <CheckCircle2
                      size={18}
                    />
                  }
                  accent="green"
                />
              </div>
            </section>

            <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.025] p-6">
              <div className="mb-6">
                <h2 className="text-lg font-semibold">
                  Hiring Pipeline
                </h2>

                <p className="mt-1 text-xs text-white/35">
                  Current application distribution
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <PipelineCard
                  label="Submissions"
                  value={
                    pipelineCounts.submission
                  }
                  href="/recruiter/submissions"
                />

                <PipelineCard
                  label="Interviews"
                  value={
                    pipelineCounts.interview
                  }
                  href="/recruiter/interviews"
                />

                <PipelineCard
                  label="Offer"
                  value={pipelineCounts.offer}
                  href="/recruiter/offers"
                />

                <PipelineCard
                  label="Start"
                  value={
                    pipelineCounts.start
                  }
                  href="/recruiter/starts"
                />

                <PipelineCard
                  label="Rejected"
                  value={
                    pipelineCounts.rejected
                  }
                  href="/recruiter/rejected"
                />
              </div>
            </section>

            {isOwner && (
              <section className="mt-6 rounded-2xl border border-purple-400/10 bg-purple-400/[0.03] px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold">
                      Owner Management
                    </p>

                    <p className="mt-1 text-xs text-white/35">
                      Client management is available
                      from your recruiter menu.
                    </p>
                  </div>

                  <Link
                    href="/recruiter/clients"
                    className="inline-flex items-center gap-2 rounded-lg border border-purple-400/20 bg-purple-400/10 px-3 py-2 text-xs font-medium text-purple-200 hover:bg-purple-400/15"
                  >
                    Clients
                    <ArrowRight
                      size={14}
                    />
                  </Link>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function SectionTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-lg font-semibold">
        {title}
      </h2>

      <p className="mt-1 text-xs text-white/35">
        {description}
      </p>
    </div>
  );
}

function DashboardStatLink({
  href,
  label,
  value,
  description,
  icon,
  accent = "default",
}: {
  href: string;
  label: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  accent?: string;
}) {
  const accents: Record<
    string,
    string
  > = {
    default:
      "bg-white/[0.05] text-white/60",

    purple:
      "bg-purple-400/10 text-purple-200",

    blue:
      "bg-blue-400/10 text-blue-300",

    yellow:
      "bg-yellow-400/10 text-yellow-300",

    green:
      "bg-green-400/10 text-green-300",

    orange:
      "bg-orange-400/10 text-orange-300",

    red:
      "bg-red-400/10 text-red-300",
  };

  return (
    <a
      href={href}
      className="group rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:-translate-y-0.5 hover:bg-white/[0.05]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-white/40">
            {label}
          </p>

          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {value}
          </p>

          <p className="mt-1 text-[11px] text-white/25">
            {description}
          </p>
        </div>

        <div
          className={
            "rounded-xl p-2.5 " +
            (accents[accent] ||
              accents.default)
          }
        >
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end text-white/20 transition group-hover:text-purple-200">
        <ArrowRight
          size={15}
          className="transition group-hover:translate-x-1"
        />
      </div>
    </a>
  );
}

function PipelineCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href: string;
}) {
  return (
    <a
      href={href}
      className="group rounded-2xl border border-white/[0.07] bg-black/20 p-4 transition hover:bg-white/[0.04]"
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl font-semibold">
          {value}
        </span>

        <ArrowRight
          size={14}
          className="text-white/20 transition group-hover:translate-x-1 group-hover:text-purple-200"
        />
      </div>

      <p className="mt-3 text-xs text-white/45">
        {label}
      </p>
    </a>
  );
}

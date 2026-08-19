
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  Users,
  UserPlus,
  Clock3,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

type Job = {
  id: string;
  job_id: string | null;
  title: string;
  company: string | null;
  location: string | null;
  status: string | null;
  openings: number | null;
  created_at: string;
};

type Application = {
  id: string;
  candidate_id: string;
  job_id: string;
  status: string | null;
  applied_at: string;
};

const STATUSES = [
  "new",
  "viewed",
  "screening",
  "interview",
  "offer",
  "hired",
  "rejected",
] as const;

type Status = (typeof STATUSES)[number];

const STATUS_STYLES: Record<string, string> = {
  new: "border-purple-400/20 bg-purple-400/10 text-purple-200",
  viewed: "border-white/10 bg-white/[0.05] text-white/60",
  screening: "border-blue-400/20 bg-blue-400/10 text-blue-300",
  interview: "border-yellow-400/20 bg-yellow-400/10 text-yellow-300",
  offer: "border-orange-400/20 bg-orange-400/10 text-orange-300",
  hired: "border-green-400/20 bg-green-400/10 text-green-300",
  rejected: "border-red-400/20 bg-red-400/10 text-red-300",
};

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  viewed: "Viewed",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

export default function RecruiterDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const jobsRequest = supabase
        .from("jobs")
        .select(
          "id,job_id,title,company,location,status,openings,created_at"
        )
        .order("created_at", { ascending: false });

      const applicationsRequest = supabase
        .from("applications")
        .select(
          "id,candidate_id,job_id,status,applied_at"
        )
        .order("applied_at", { ascending: false });

      const [
        { data: jobsData, error: jobsError },
        {
          data: applicationsData,
          error: applicationsError,
        },
      ] = await Promise.all([
        jobsRequest,
        applicationsRequest,
      ]);

      if (jobsError) {
        throw new Error(jobsError.message);
      }

      if (applicationsError) {
        throw new Error(applicationsError.message);
      }

      setJobs((jobsData as Job[]) || []);
      setApplications(
        (applicationsData as Application[]) || []
      );
    } catch (err) {
      console.error("Recruiter dashboard error:", err);

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
    loadDashboard();
  }, []);

  const stats = useMemo(() => {
    const count = (status: Status) =>
      applications.filter(
        (application) =>
          application.status?.toLowerCase() === status
      ).length;

    return {
      applications: applications.length,
      newApplications: count("new"),
      screening: count("screening"),
      interviews: count("interview"),
      offers: count("offer"),
      hired: count("hired"),
      rejected: count("rejected"),
      openJobs: jobs.filter(
        (job) => job.status === "published"
      ).length,
    };
  }, [applications, jobs]);

  const recentApplications = applications.slice(0, 6);
  const recentJobs = jobs.slice(0, 5);

  function formatDate(value: string) {
    if (!value) return "—";

    return new Date(value).toLocaleDateString(
      undefined,
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  }

  function statusLabel(status: string | null) {
    const value = status?.toLowerCase() || "new";

    return (
      STATUS_LABELS[value] ||
      value.charAt(0).toUpperCase() + value.slice(1)
    );
  }

  function statusStyle(status: string | null) {
    return (
      STATUS_STYLES[
        status?.toLowerCase() || "new"
      ] || STATUS_STYLES.new
    );
  }

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
              Manage your jobs, applications, candidate
              pipeline, and hiring activity from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/70 hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </header>

        <section className="mb-8 grid gap-3 sm:grid-cols-3">

          <DashboardLink
            href="/recruiter/jobs/new"
            title="Post a New Job"
            description="Create a new opening"
            icon={<Plus size={19} />}
            iconClass="text-purple-200"
          />

          <DashboardLink
            href="/applications"
            title="View Applications"
            description="Review your candidate pipeline"
            icon={<Users size={19} />}
            iconClass="text-blue-300"
          />

          <DashboardLink
            href="/recruiter/jobs"
            title="Manage Jobs"
            description="View and manage job openings"
            icon={<BriefcaseBusiness size={19} />}
            iconClass="text-green-300"
          />

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
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <StatCard
                label="Total Applications"
                value={stats.applications}
                description="All applications"
                icon={<Users size={20} />}
              />

              <StatCard
                label="New Applications"
                value={stats.newApplications}
                description="Need review"
                icon={<UserPlus size={20} />}
                accent="purple"
              />

              <StatCard
                label="Screening"
                value={stats.screening}
                description="Currently screening"
                icon={<Clock3 size={20} />}
                accent="blue"
              />

              <StatCard
                label="Interviews"
                value={stats.interviews}
                description="Candidates interviewing"
                icon={<CalendarDays size={20} />}
                accent="yellow"
              />

            </section>

            <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

              <StatCard
                label="Open Jobs"
                value={stats.openJobs}
                description="Published openings"
                icon={<BriefcaseBusiness size={20} />}
                accent="green"
              />

              <StatCard
                label="Offers"
                value={stats.offers}
                description="Offers in progress"
                icon={<FileText size={20} />}
                accent="orange"
              />

              <StatCard
                label="Hired"
                value={stats.hired}
                description="Successful hires"
                icon={<CheckCircle2 size={20} />}
                accent="green"
              />

              <StatCard
                label="Rejected"
                value={stats.rejected}
                description="Closed applications"
                icon={<XCircle size={20} />}
                accent="red"
              />

            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">

              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">

                <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Recent Applications
                    </h2>

                    <p className="mt-1 text-xs text-white/35">
                      Latest candidates entering your pipeline
                    </p>
                  </div>

                  <a
                    href="/applications"
                    className="text-xs font-medium text-purple-200 hover:text-white"
                  >
                    View all →
                  </a>
                </div>

                {recentApplications.length === 0 ? (
                  <EmptyState text="No applications yet." />
                ) : (
                  <div className="divide-y divide-white/[0.06]">
                    {recentApplications.map(
                      (application) => (
                        <div
                          key={application.id}
                          className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-white/[0.025]"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              Candidate{" "}
                              {application.candidate_id
                                ? application.candidate_id.slice(
                                    0,
                                    8
                                  )
                                : "Unknown"}
                            </p>

                            <p className="mt-1 text-xs text-white/35">
                              Applied{" "}
                              {formatDate(
                                application.applied_at
                              )}
                            </p>
                          </div>

                          <span
                            className={
                              "shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium " +
                              statusStyle(
                                application.status
                              )
                            }
                          >
                            {statusLabel(
                              application.status
                            )}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                )}

              </div>

              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">

                <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Recent Jobs
                    </h2>

                    <p className="mt-1 text-xs text-white/35">
                      Your latest openings
                    </p>
                  </div>

                  <a
                    href="/recruiter/jobs"
                    className="text-xs font-medium text-purple-200 hover:text-white"
                  >
                    View all →
                  </a>
                </div>

                {recentJobs.length === 0 ? (
                  <div className="px-6 py-16 text-center">
                    <BriefcaseBusiness
                      size={28}
                      className="mx-auto text-white/15"
                    />

                    <p className="mt-4 text-sm text-white/40">
                      No jobs created yet.
                    </p>

                    <a
                      href="/recruiter/jobs/new"
                      className="mt-4 inline-flex rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black"
                    >
                      Create your first job
                    </a>
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.06]">
                    {recentJobs.map((job) => (
                      <div
                        key={job.id}
                        className="px-6 py-4 hover:bg-white/[0.025]"
                      >
                        <div className="flex items-start justify-between gap-4">

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {job.title}
                            </p>

                            <p className="mt-1 truncate text-xs text-white/35">
                              {job.company || "HireX"}
                              {job.location
                                ? " • " + job.location
                                : ""}
                            </p>
                          </div>

                          <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-white/50">
                            {job.status || "draft"}
                          </span>

                        </div>

                        <div className="mt-3 flex items-center justify-between text-[11px] text-white/25">
                          <span>
                            {job.openings || 0}{" "}
                            {job.openings === 1
                              ? "opening"
                              : "openings"}
                          </span>

                          <span>
                            Created{" "}
                            {formatDate(job.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

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

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
                {STATUSES.map((status) => {
                  const count =
                    applications.filter(
                      (application) =>
                        application.status?.toLowerCase() ===
                        status
                    ).length;

                  return (
                    <div
                      key={status}
                      className="rounded-2xl border border-white/[0.07] bg-black/20 p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-semibold">
                          {count}
                        </span>

                        <span className="text-[10px] uppercase tracking-wider text-white/30">
                          {status}
                        </span>
                      </div>

                      <p className="mt-3 text-xs text-white/45">
                        {statusLabel(status)}
                      </p>
                    </div>
                  );
                })}
              </div>

            </section>
          </>
        )}

      </div>
    </main>
  );
}

function DashboardLink({
  href,
  title,
  description,
  icon,
  iconClass,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  iconClass: string;
}) {
  return (
    <a
      href={href}
      className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.035] px-5 py-4 hover:bg-white/[0.06]"
    >
      <div className="flex items-center gap-3">
        <div
          className={
            "rounded-xl bg-white/[0.05] p-2.5 " +
            iconClass
          }
        >
          {icon}
        </div>

        <div>
          <p className="text-sm font-semibold">
            {title}
          </p>

          <p className="mt-0.5 text-xs text-white/35">
            {description}
          </p>
        </div>
      </div>

      <ArrowRight
        size={17}
        className="text-white/30 group-hover:translate-x-1 group-hover:text-white"
      />
    </a>
  );
}

function EmptyState({
  text,
}: {
  text: string;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <Users
        size={28}
        className="mx-auto text-white/15"
      />

      <p className="mt-4 text-sm text-white/40">
        {text}
      </p>
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
  icon,
  accent = "default",
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  accent?: string;
}) {
  const accents: Record<string, string> = {
    default: "bg-white/[0.05] text-white/60",
    purple: "bg-purple-400/10 text-purple-200",
    blue: "bg-blue-400/10 text-blue-300",
    yellow: "bg-yellow-400/10 text-yellow-300",
    green: "bg-green-400/10 text-green-300",
    orange: "bg-orange-400/10 text-orange-300",
    red: "bg-red-400/10 text-red-300",
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 hover:bg-white/[0.04]">
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
            (accents[accent] || accents.default)
          }
        >
          {icon}
        </div>

      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Loader2,
  MapPin,
  Users,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { normalizeJobStatus } from "../../../lib/statuses";
import ThemeToggle from "../../ThemeToggle";

type Job = {
  id: string;
  job_id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  experience: string;
  status: string;
  openings: number;
  salary: string | null;
  deadline: string | null;
  description: string;
  responsibilities: string[];
  qualifications: string[];
  created_at: string;
};

export default function JobDetailsPage() {
  const params = useParams();
  const id = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadJob() {
      if (!id) return;

      setLoading(true);
      setError("");

      const { data, error: jobError } = await supabase
        .from("public_jobs")
        .select(
          "id,job_id,title,company,location,type,experience,status,openings,salary,deadline,description,responsibilities,qualifications,created_at"
        )
        .eq("id", id)
        .in("status", ["published", "active", "open"])
        .single();

      if (jobError) {
        console.error("Job details error:", jobError);

        if (jobError.code === "PGRST116") {
          setError("This position is no longer available.");
        } else {
          setError(jobError.message);
        }
      } else {
        const normalizedJob = data as Job;

        if (normalizeJobStatus(normalizedJob.status) !== "open") {
          setError("This position is no longer available.");
        } else {
          setJob(normalizedJob);
        }
      }

      setLoading(false);
    }

    loadJob();
  }, [id]);

  function formatDate(value: string) {
    return new Date(value).toLocaleDateString();
  }

  function formatDeadline(value: string | null) {
    if (!value) return "Open until filled";

    return new Date(value).toLocaleDateString();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#03040a] text-white">
        <div className="flex min-h-screen items-center justify-center text-white/50">
          <Loader2
            size={22}
            className="mr-3 animate-spin"
          />
          Loading position...
        </div>
      </main>
    );
  }

  if (error || !job) {
    return (
      <main className="min-h-screen bg-[#03040a] text-white">
        <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8">

          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Jobs
          </Link>

          <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.025] p-12 text-center">
            <h1 className="text-2xl font-semibold">
              Position unavailable
            </h1>

            <p className="mt-3 text-sm text-white/40">
              {error || "This position could not be found."}
            </p>

            <Link
              href="/jobs"
              className="mt-7 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              View Open Positions
            </Link>
          </div>

        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#03040a] text-white">

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">

        <div className="mb-6 flex justify-end">
          <ThemeToggle />
        </div>

        <Link
          href="/jobs"
          className="inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Jobs
        </Link>

        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.025] p-8 sm:p-10">

          <div className="flex flex-col justify-between gap-8 lg:flex-row">

            <div>

              <div className="flex flex-wrap items-center gap-3">

                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-200/70">
                  {job.job_id}
                </span>

                <span className="rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs text-green-300">
                  Open
                </span>

              </div>

              <h1 className="mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
                {job.title}
              </h1>

              <p className="mt-4 text-lg text-white/55">
                {job.company}
              </p>

            </div>

            <div className="flex shrink-0 items-start">
              <Link
                href={`/jobs/${job.id}/apply`}
                className="inline-flex items-center justify-center rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                Apply Now
              </Link>
            </div>

          </div>

          <div className="mt-10 grid gap-5 border-t border-white/10 pt-8 sm:grid-cols-2 lg:grid-cols-4">

            <div className="flex items-start gap-3">
              <MapPin
                size={18}
                className="mt-0.5 text-purple-200/60"
              />

              <div>
                <p className="text-xs uppercase tracking-wider text-white/25">
                  Location
                </p>

                <p className="mt-1 text-sm text-white/65">
                  {job.location || "Not specified"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <BriefcaseBusiness
                size={18}
                className="mt-0.5 text-purple-200/60"
              />

              <div>
                <p className="text-xs uppercase tracking-wider text-white/25">
                  Job Type
                </p>

                <p className="mt-1 text-sm text-white/65">
                  {job.type || "Not specified"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users
                size={18}
                className="mt-0.5 text-purple-200/60"
              />

              <div>
                <p className="text-xs uppercase tracking-wider text-white/25">
                  Experience
                </p>

                <p className="mt-1 text-sm text-white/65">
                  {job.experience || "Not specified"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CalendarDays
                size={18}
                className="mt-0.5 text-purple-200/60"
              />

              <div>
                <p className="text-xs uppercase tracking-wider text-white/25">
                  Deadline
                </p>

                <p className="mt-1 text-sm text-white/65">
                  {formatDeadline(job.deadline)}
                </p>
              </div>
            </div>

          </div>

        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">

          <div className="space-y-8">

            <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-8">

              <h2 className="text-xl font-semibold">
                About the Role
              </h2>

              <div className="mt-5 whitespace-pre-line text-sm leading-7 text-white/55">
                {job.description || "No description provided."}
              </div>

            </section>

            {job.responsibilities?.length > 0 && (
              <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-8">

                <h2 className="text-xl font-semibold">
                  Responsibilities
                </h2>

                <ul className="mt-6 space-y-4">

                  {job.responsibilities.map(
                    (responsibility, index) => (
                      <li
                        key={index}
                        className="flex gap-3 text-sm leading-6 text-white/55"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-300/70" />

                        <span>
                          {responsibility}
                        </span>
                      </li>
                    )
                  )}

                </ul>

              </section>
            )}

            {job.qualifications?.length > 0 && (
              <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-8">

                <h2 className="text-xl font-semibold">
                  Qualifications
                </h2>

                <ul className="mt-6 space-y-4">

                  {job.qualifications.map(
                    (qualification, index) => (
                      <li
                        key={index}
                        className="flex gap-3 text-sm leading-6 text-white/55"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-300/70" />

                        <span>
                          {qualification}
                        </span>
                      </li>
                    )
                  )}

                </ul>

              </section>
            )}

          </div>

          <aside className="lg:sticky lg:top-8 lg:self-start">

            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-7">

              <h2 className="text-lg font-semibold">
                Position Summary
              </h2>

              <div className="mt-6 space-y-5">

                <div>
                  <p className="text-xs uppercase tracking-wider text-white/25">
                    Openings
                  </p>

                  <p className="mt-1 text-sm text-white/65">
                    {job.openings || 1}
                  </p>
                </div>

                {job.salary && (
                  <div>
                    <p className="text-xs uppercase tracking-wider text-white/25">
                      Compensation
                    </p>

                    <p className="mt-1 text-sm text-white/65">
                      {job.salary}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-xs uppercase tracking-wider text-white/25">
                    Posted
                  </p>

                  <p className="mt-1 text-sm text-white/65">
                    {formatDate(job.created_at)}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-white/25">
                    Application Deadline
                  </p>

                  <p className="mt-1 text-sm text-white/65">
                    {formatDeadline(job.deadline)}
                  </p>
                </div>

              </div>

              <Link
                href={`/jobs/${job.id}/apply`}
                className="mt-8 flex w-full items-center justify-center rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                Apply Now
              </Link>

            </div>

          </aside>

        </div>

        <div className="mt-10 rounded-3xl border border-purple-300/10 bg-purple-300/[0.04] p-8 text-center">

          <h2 className="text-2xl font-semibold">
            Interested in this opportunity?
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/40">
            Submit your application and our recruiting team
            will review your profile.
          </p>

          <Link
            href={`/jobs/${job.id}/apply`}
            className="mt-6 inline-flex rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            Apply for this Position
          </Link>

        </div>

      </div>
    </main>
  );
}
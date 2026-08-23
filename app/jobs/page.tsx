"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  MapPin,
  BriefcaseBusiness,
  Clock3,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { normalizeJobStatus } from "../../lib/statuses";

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
  created_at: string;
};

export default function PublicJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadJobs() {
    setLoading(true);
    setError("");

    const { data, error: jobsError } = await supabase
      .from("jobs")
      .select(
        "id,job_id,title,company,location,type,experience,status,openings,salary,deadline,created_at"
      )
      .in("status", ["published", "active", "open"])
      .order("created_at", { ascending: false });

    if (jobsError) {
      console.error("Public jobs error:", jobsError);
      setError(jobsError.message);
    } else {
      setJobs(
        ((data ?? []) as Job[]).filter(
          (job) => normalizeJobStatus(job.status) === "open"
        )
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    void Promise.resolve().then(loadJobs);
  }, []);

  return (
    <main className="min-h-screen bg-[#03040a] text-white">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">

        {/* Back to Website */}
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to HireX
        </Link>

        {/* Header */}
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-purple-200/80">
            HireX
          </p>

          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em]">
            Open Positions
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-7 text-white/45">
            Explore current opportunities and find your next career move.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-24 text-white/50">
            <Loader2
              size={22}
              className="mr-3 animate-spin"
            />
            Loading available positions...
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-3xl border border-red-400/20 bg-red-400/5 p-8">
            <h2 className="text-lg font-semibold text-red-200">
              Could not load jobs
            </h2>

            <p className="mt-2 text-sm text-red-200/60">
              {error}
            </p>

            <button
              type="button"
              onClick={loadJobs}
              className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"
            >
              Try Again
            </button>
          </div>
        )}

        {/* No Jobs */}
        {!loading &&
          !error &&
          jobs.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-16 text-center">
              <BriefcaseBusiness
                size={38}
                className="mx-auto text-white/20"
              />

              <h2 className="mt-5 text-2xl font-semibold">
                No open positions
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/40">
                There are currently no published positions available.
                Please check back soon.
              </p>

              <Link
                href="/"
                className="mt-7 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                Return to HireX
              </Link>
            </div>
          )}

        {/* Published Jobs */}
        {!loading &&
          !error &&
          jobs.length > 0 && (
            <div className="grid gap-5 md:grid-cols-2">

              {jobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="group rounded-3xl border border-white/10 bg-white/[0.025] p-7 transition duration-200 hover:border-purple-300/20 hover:bg-white/[0.045]"
                >

                  {/* Job ID / Status */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-purple-200/70">
                      {job.job_id}
                    </span>

                    <span className="rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs text-green-300">
                      Open
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="mt-5 text-2xl font-semibold tracking-[-0.03em] transition group-hover:text-purple-100">
                    {job.title}
                  </h2>

                  {/* Company */}
                  <p className="mt-2 text-sm text-white/55">
                    {job.company}
                  </p>

                  {/* Details */}
                  <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-xs text-white/40">

                    {job.location && (
                      <span className="inline-flex items-center gap-2">
                        <MapPin size={14} />
                        {job.location}
                      </span>
                    )}

                    {job.type && (
                      <span className="inline-flex items-center gap-2">
                        <BriefcaseBusiness size={14} />
                        {job.type}
                      </span>
                    )}

                    {job.experience && (
                      <span className="inline-flex items-center gap-2">
                        <Clock3 size={14} />
                        {job.experience}
                      </span>
                    )}

                  </div>

                  {/* Bottom */}
                  <div className="mt-8 flex items-center justify-between border-t border-white/[0.07] pt-5">

                    <div>
                      {job.salary && (
                        <p className="text-sm font-medium text-white/70">
                          {job.salary}
                        </p>
                      )}

                      <p className="mt-1 text-xs text-white/30">
                        Posted{" "}
                        {new Date(
                          job.created_at
                        ).toLocaleDateString()}
                      </p>
                    </div>

                    <span className="text-sm font-medium text-purple-200 transition group-hover:text-white">
                      View Position →
                    </span>

                  </div>

                </Link>
              ))}

            </div>
          )}

        {/* Count */}
        {!loading &&
          !error &&
          jobs.length > 0 && (
            <div className="mt-8 text-xs text-white/25">
              {jobs.length}{" "}
              {jobs.length === 1
                ? "position"
                : "positions"}{" "}
              available
            </div>
          )}

      </div>
    </main>
  );
}
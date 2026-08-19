"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Pencil,
  Eye,
  Pause,
  Play,
  XCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { supabase } from "../../../lib/supabase";

type Job = {
  id: string;
  job_id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  experience: string;
  status: "draft" | "published" | "paused" | "closed";
  openings: number;
  salary: string | null;
  deadline: string | null;
  created_at: string;
};

export default function RecruiterJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadJobs() {
    setLoading(true);
    setError("");

    try {
      const { data, error: jobsError } = await supabase
        .from("jobs")
        .select(
          "id,job_id,title,company,location,type,experience,status,openings,salary,deadline,created_at"
        )
        .order("created_at", { ascending: false });

      if (jobsError) {
        console.error("Recruiter jobs error:", jobsError);
        setError(jobsError.message);
        setJobs([]);
        return;
      }

      setJobs((data ?? []) as Job[]);
    } catch (err) {
      console.error("Unexpected recruiter jobs error:", err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Could not load jobs.");
      }

      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  async function updateStatus(
    id: string,
    status: Job["status"]
  ) {
    const { error: updateError } = await supabase
      .from("jobs")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      alert("Could not update job: " + updateError.message);
      return;
    }

    setJobs((current) =>
      current.map((job) =>
        job.id === id
          ? { ...job, status }
          : job
      )
    );
  }

  function statusClass(status: Job["status"]) {
    switch (status) {
      case "published":
        return "border-green-400/20 bg-green-400/10 text-green-300";

      case "paused":
        return "border-yellow-400/20 bg-yellow-400/10 text-yellow-300";

      case "closed":
        return "border-red-400/20 bg-red-400/10 text-red-300";

      default:
        return "border-white/10 bg-white/[0.04] text-white/50";
    }
  }

  return (
    <main className="min-h-screen bg-[#03040a] text-white">
      <div className="mx-auto max-w-[1600px] px-5 py-10 sm:px-8">

        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <Link
              href="/"
              className="mb-5 inline-flex items-center gap-2 text-sm text-white/40 hover:text-white"
            >
              <ArrowLeft size={16} />
              Back to HireX
            </Link>

            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-purple-200/80">
              HireX ATS
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
              Jobs
            </h1>

            <p className="mt-2 text-sm text-white/45">
              Create and manage your job openings.
            </p>
          </div>

          <Link
            href="/recruiter/jobs/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
          >
            <Plus size={17} />
            Create Job
          </Link>

        </div>

        {/* LOADING */}
        {loading && (
          <div className="flex items-center justify-center rounded-3xl border border-white/10 bg-white/[0.025] py-24 text-white/50">
            <Loader2
              className="mr-3 animate-spin"
              size={20}
            />
            Loading jobs...
          </div>
        )}

        {/* ERROR */}
        {!loading && error && (
          <div className="rounded-3xl border border-red-400/20 bg-red-400/5 p-8">

            <h2 className="font-semibold text-red-200">
              Could not load jobs
            </h2>

            <p className="mt-2 text-sm text-red-200/60">
              {error}
            </p>

            <button
              type="button"
              onClick={loadJobs}
              className="mt-5 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black"
            >
              Try Again
            </button>

          </div>
        )}

        {/* EMPTY */}
        {!loading && !error && jobs.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-12 text-center">

            <h2 className="text-xl font-semibold">
              No jobs yet
            </h2>

            <p className="mt-2 text-sm text-white/40">
              Create your first job opening to get started.
            </p>

            <Link
              href="/recruiter/jobs/new"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"
            >
              <Plus size={17} />
              Create Job
            </Link>

          </div>
        )}

        {/* JOB TABLE */}
        {!loading && !error && jobs.length > 0 && (
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#05060b]/90 shadow-2xl">

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1250px]">

                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.025] text-left">

                    {[
                      "Job ID",
                      "Position",
                      "Company",
                      "Location",
                      "Type",
                      "Experience",
                      "Status",
                      "Openings",
                      "Created",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white/35"
                      >
                        {heading}
                      </th>
                    ))}

                  </tr>
                </thead>

                <tbody>

                  {jobs.map((job) => (

                    <tr
                      key={job.id}
                      className="border-b border-white/[0.06] transition hover:bg-white/[0.025]"
                    >

                      <td className="px-5 py-5 text-sm font-medium text-purple-200">
                        {job.job_id}
                      </td>

                      <td className="px-5 py-5">
                        <div className="font-medium">
                          {job.title}
                        </div>
                      </td>

                      <td className="px-5 py-5 text-sm text-white/65">
                        {job.company}
                      </td>

                      <td className="px-5 py-5 text-sm text-white/65">
                        {job.location}
                      </td>

                      <td className="px-5 py-5 text-sm text-white/65">
                        {job.type}
                      </td>

                      <td className="px-5 py-5 text-sm text-white/65">
                        {job.experience}
                      </td>

                      <td className="px-5 py-5">

                        <span
                          className={`inline-flex rounded-full border px-3 py-1 text-xs ${statusClass(
                            job.status
                          )}`}
                        >
                          {job.status}
                        </span>

                      </td>

                      <td className="px-5 py-5 text-sm text-white/65">
                        {job.openings}
                      </td>

                      <td className="px-5 py-5 text-xs text-white/45">
                        {new Date(
                          job.created_at
                        ).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-5">

                        <div className="flex items-center gap-2">

                          {/* EDIT */}
                          <Link
                            href={`/recruiter/jobs/${job.id}/edit`}
                            title="Edit"
                            className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-white/60 hover:bg-white/[0.08] hover:text-white"
                          >
                            <Pencil size={15} />
                          </Link>

                          {/* VIEW */}
                          <Link
                            href={`/jobs/${job.id}`}
                            title="View"
                            className="rounded-lg border border-white/10 bg-white/[0.04] p-2 text-white/60 hover:bg-white/[0.08] hover:text-white"
                          >
                            <Eye size={15} />
                          </Link>

                          {/* PAUSE */}
                          {job.status === "published" && (
                            <button
                              type="button"
                              title="Pause"
                              onClick={() =>
                                updateStatus(
                                  job.id,
                                  "paused"
                                )
                              }
                              className="rounded-lg border border-yellow-400/10 bg-yellow-400/5 p-2 text-yellow-300/70 hover:text-yellow-300"
                            >
                              <Pause size={15} />
                            </button>
                          )}

                          {/* PUBLISH */}
                          {(job.status === "paused" ||
                            job.status === "draft") && (
                            <button
                              type="button"
                              title="Publish"
                              onClick={() =>
                                updateStatus(
                                  job.id,
                                  "published"
                                )
                              }
                              className="rounded-lg border border-green-400/10 bg-green-400/5 p-2 text-green-300/70 hover:text-green-300"
                            >
                              <Play size={15} />
                            </button>
                          )}

                          {/* CLOSE */}
                          {job.status !== "closed" && (
                            <button
                              type="button"
                              title="Close"
                              onClick={() =>
                                updateStatus(
                                  job.id,
                                  "closed"
                                )
                              }
                              className="rounded-lg border border-red-400/10 bg-red-400/5 p-2 text-red-300/70 hover:text-red-300"
                            >
                              <XCircle size={15} />
                            </button>
                          )}

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            <div className="border-t border-white/10 px-5 py-4 text-xs text-white/30">
              {jobs.length}{" "}
              {jobs.length === 1 ? "job" : "jobs"}
            </div>

          </div>
        )}

      </div>
    </main>
  );
}
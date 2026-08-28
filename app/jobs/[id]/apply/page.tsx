"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  Loader2,
  Upload,
} from "lucide-react";
import { supabase } from "../../../../lib/supabase";
import { normalizeJobStatus } from "../../../../lib/statuses";
import ThemeToggle from "../../../ThemeToggle";

type Job = {
  id: string;
  job_id: string;
  title: string;
  company: string;
  status: string;
};

export default function ApplyPage() {
  const params = useParams();
  const id = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loadingJob, setLoadingJob] = useState(true);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [currentJobTitle, setCurrentJobTitle] = useState("");
  const [resume, setResume] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadJob() {
      if (!id) return;

      setLoadingJob(true);

      const { data, error: jobError } = await supabase
        .from("public_jobs")
        .select("id,job_id,title,company,status")
        .eq("id", id)
        .in("status", ["published", "active", "open"])
        .single();

      if (jobError) {
        console.error("Job loading error:", jobError);
      } else {
        const normalizedJob = data as Job;

        if (normalizeJobStatus(normalizedJob.status) !== "open") {
          setError("Applications are closed for this position.");
        } else {
          setJob(normalizedJob);
        }
      }

      setLoadingJob(false);
    }

    loadJob();
  }, [id]);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!job) {
      setError("Job could not be found.");
      return;
    }

    if (!firstName.trim()) {
      setError("Please enter your first name.");
      return;
    }

    if (!lastName.trim()) {
      setError("Please enter your last name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    if (!resume) {
      setError("Please upload your resume.");
      return;
    }

    if (resume.type !== "application/pdf") {
      setError("Please upload your resume as a PDF.");
      return;
    }

    if (resume.size > 10 * 1024 * 1024) {
      setError("Resume must be smaller than 10 MB.");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("jobId", job.id);
      formData.append("firstName", firstName.trim());
      formData.append("lastName", lastName.trim());
      formData.append("email", email.trim().toLowerCase());
      formData.append("phone", phone.trim());
      formData.append("currentJobTitle", currentJobTitle.trim());
      formData.append("resume", resume);

      const response = await fetch("/api/applications", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || "Unable to submit your application."
        );
      }

      setSuccess(true);

    } catch (submitError) {
      console.error("Application error:", submitError);

      if (submitError instanceof Error) {
        setError(submitError.message);
      } else {
        setError(
          "Something went wrong while submitting your application."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingJob) {
    return (
      <main className="min-h-screen bg-[#03040a] text-white">
        <div className="flex min-h-screen items-center justify-center text-white/50">
          <Loader2
            size={22}
            className="mr-3 animate-spin"
          />
          Loading application...
        </div>
      </main>
    );
  }

  if (!job) {
    return (
      <main className="min-h-screen bg-[#03040a] text-white">
        <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
          <div className="mb-6 flex justify-end"><ThemeToggle /></div>

          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 text-sm text-white/45 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Jobs
          </Link>

          <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.025] p-12 text-center">

            <h1 className="text-2xl font-semibold">
              Position unavailable
            </h1>

            <p className="mt-3 text-sm text-white/40">
              This position could not be found or is no longer accepting applications.
            </p>

            <Link
              href="/jobs"
              className="mt-7 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black"
            >
              View Jobs
            </Link>

          </div>

        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[#03040a] text-white">

        <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-5 py-12">

          <div className="w-full rounded-3xl border border-white/10 bg-white/[0.025] p-10 text-center sm:p-14">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-green-400/20 bg-green-400/10">
              <FileText
                size={28}
                className="text-green-300"
              />
            </div>

            <p className="mt-7 text-xs font-semibold uppercase tracking-[0.25em] text-purple-200/70">
              Application Submitted
            </p>

            <h1 className="mt-4 text-3xl font-semibold">
              Thank you, {firstName}.
            </h1>

            <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-white/45">
              Your application for{" "}
              <span className="text-white/70">
                {job.title}
              </span>{" "}
              at{" "}
              <span className="text-white/70">
                Confidential Client
              </span>{" "}
              has been submitted successfully.
            </p>

            <Link
              href="/jobs"
              className="mt-8 inline-flex rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
            >
              View More Jobs
            </Link>

          </div>

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#03040a] text-white">

      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8">

        <div className="mb-6 flex justify-end"><ThemeToggle /></div>

        <Link
          href={`/jobs/${job.id}`}
          className="inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Position
        </Link>

        {/* Header */}
        <div className="mt-10">

          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-purple-200/70">
            Apply to HireX
          </p>

          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.04em]">
            {job.title}
          </h1>

          <p className="mt-3 text-sm text-white/45">
            Confidential Client · {job.job_id}
          </p>

        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="mt-10 rounded-3xl border border-white/10 bg-white/[0.025] p-7 sm:p-10"
        >

          <div>
            <h2 className="text-xl font-semibold">
              Your Information
            </h2>

            <p className="mt-2 text-sm text-white/35">
              Please provide your contact information and resume.
            </p>
          </div>

          {/* Name */}
          <div className="mt-8 grid gap-5 sm:grid-cols-2">

            <div>
              <label className="text-sm text-white/65">
                First Name *
              </label>

              <input
                value={firstName}
                onChange={(event) =>
                  setFirstName(event.target.value)
                }
                type="text"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-300/40"
                placeholder="First name"
              />
            </div>

            <div>
              <label className="text-sm text-white/65">
                Last Name *
              </label>

              <input
                value={lastName}
                onChange={(event) =>
                  setLastName(event.target.value)
                }
                type="text"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-300/40"
                placeholder="Last name"
              />
            </div>

          </div>

          {/* Contact */}
          <div className="mt-5 grid gap-5 sm:grid-cols-2">

            <div>
              <label className="text-sm text-white/65">
                Email *
              </label>

              <input
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                type="email"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-300/40"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="text-sm text-white/65">
                Phone *
              </label>

              <input
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                type="tel"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-300/40"
                placeholder="Phone number"
              />
            </div>

          </div>

          {/* Current Job */}
          <div className="mt-5">

            <label className="text-sm text-white/65">
              Current Job Title
            </label>

            <input
              value={currentJobTitle}
              onChange={(event) =>
                setCurrentJobTitle(event.target.value)
              }
              type="text"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-purple-300/40"
              placeholder="e.g. Senior Software Engineer"
            />

          </div>

          {/* Resume */}
          <div className="mt-8">

            <label className="text-sm text-white/65">
              Resume *
            </label>

            <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/20 px-6 py-10 text-center transition hover:border-purple-300/30 hover:bg-white/[0.02]">

              <Upload
                size={28}
                className="text-white/30"
              />

              <span className="mt-4 text-sm font-medium text-white/65">
                {resume
                  ? resume.name
                  : "Upload your resume"}
              </span>

              <span className="mt-2 text-xs text-white/30">
                PDF only · Maximum 10 MB
              </span>

              <input
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(event) => {
                  const file =
                    event.target.files?.[0] || null;

                  setResume(file);
                }}
              />

            </label>

          </div>

          {/* Error */}
          {error && (
            <div className="mt-6 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-200/80">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="mt-8 flex w-full items-center justify-center rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2
                  size={18}
                  className="mr-2 animate-spin"
                />
                Submitting Application...
              </>
            ) : (
              "Submit Application"
            )}
          </button>

          <p className="mt-4 text-center text-xs text-white/25">
            By submitting this application, you agree that HireX
            may review your information for recruitment purposes.
          </p>

        </form>

      </div>

    </main>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { supabase } from "../../../../../lib/supabase";

type Job = {
  id: string;
  job_id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  experience: string;
  description: string;
  responsibilities: string[];
  qualifications: string[];
  status: "draft" | "published" | "paused" | "closed";
  openings: number;
  salary: string | null;
  deadline: string | null;
  created_at: string;
};

export default function EditJobPage() {
  const params = useParams();
  const router = useRouter();

  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [job, setJob] = useState<Job | null>(null);

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [experience, setExperience] = useState("");
  const [description, setDescription] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [status, setStatus] =
    useState<Job["status"]>("draft");
  const [openings, setOpenings] = useState("1");
  const [salary, setSalary] = useState("");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    async function loadJob() {
      if (!id) {
        setError("Job ID is missing.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const { data, error: jobError } = await supabase
        .from("jobs")
        .select(
          "id,job_id,title,company,location,type,experience,description,responsibilities,qualifications,status,openings,salary,deadline,created_at"
        )
        .eq("id", id)
        .single();

      if (jobError) {
        console.error("Load job error:", jobError);
        setError(jobError.message);
        setLoading(false);
        return;
      }

      const loadedJob = data as Job;

      setJob(loadedJob);

      setTitle(loadedJob.title || "");
      setCompany(loadedJob.company || "");
      setLocation(loadedJob.location || "");
      setType(loadedJob.type || "");
      setExperience(loadedJob.experience || "");
      setDescription(loadedJob.description || "");

      setResponsibilities(
        Array.isArray(loadedJob.responsibilities)
          ? loadedJob.responsibilities.join("\n")
          : ""
      );

      setQualifications(
        Array.isArray(loadedJob.qualifications)
          ? loadedJob.qualifications.join("\n")
          : ""
      );

      setStatus(loadedJob.status || "draft");
      setOpenings(String(loadedJob.openings ?? 1));
      setSalary(loadedJob.salary || "");
      setDeadline(
        loadedJob.deadline
          ? loadedJob.deadline.substring(0, 10)
          : ""
      );

      setLoading(false);
    }

    loadJob();
  }, [id]);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!job) {
      setError("Job could not be found.");
      return;
    }

    if (!title.trim()) {
      setError("Please enter a job title.");
      return;
    }

    if (!company.trim()) {
      setError("Please enter a company name.");
      return;
    }

    if (!location.trim()) {
      setError("Please enter a location.");
      return;
    }

    if (!type.trim()) {
      setError("Please enter the job type.");
      return;
    }

    if (!experience.trim()) {
      setError("Please enter the experience requirement.");
      return;
    }

    if (!description.trim()) {
      setError("Please enter a job description.");
      return;
    }

    const parsedOpenings = Number(openings);

    if (
      !Number.isFinite(parsedOpenings) ||
      parsedOpenings < 1
    ) {
      setError("Openings must be at least 1.");
      return;
    }

    setSaving(true);

    const responsibilityList = responsibilities
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const qualificationList = qualifications
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    const { error: updateError } = await supabase
      .from("jobs")
      .update({
        title: title.trim(),
        company: company.trim(),
        location: location.trim(),
        type: type.trim(),
        experience: experience.trim(),
        description: description.trim(),
        responsibilities: responsibilityList,
        qualifications: qualificationList,
        status,
        openings: parsedOpenings,
        salary: salary.trim() || null,
        deadline: deadline || null,
      })
      .eq("id", job.id);

    if (updateError) {
      console.error("Update job error:", updateError);
      setError(
        "Could not update job: " + updateError.message
      );
      setSaving(false);
      return;
    }

    setSaving(false);
    setSuccess("Job updated successfully.");

    setTimeout(() => {
      router.push("/recruiter/jobs");
      router.refresh();
    }, 700);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#03040a] text-white">
        <div className="flex min-h-screen items-center justify-center text-white/50">
          <Loader2
            size={22}
            className="mr-3 animate-spin"
          />
          Loading job...
        </div>
      </main>
    );
  }

  if (!job) {
    return (
      <main className="min-h-screen bg-[#03040a] text-white">
        <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">

          <Link
            href="/recruiter/jobs"
            className="inline-flex items-center gap-2 text-sm text-white/45 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Jobs
          </Link>

          <div className="mt-12 rounded-3xl border border-red-400/20 bg-red-400/5 p-10 text-center">

            <h1 className="text-2xl font-semibold">
              Job not found
            </h1>

            <p className="mt-3 text-sm text-white/40">
              {error || "This job could not be found."}
            </p>

          </div>

        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#03040a] text-white">

      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">

        <Link
          href="/recruiter/jobs"
          className="inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Jobs
        </Link>

        <div className="mt-8">

          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-purple-200/80">
            HireX ATS
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
            Edit Job
          </h1>

          <p className="mt-2 text-sm text-white/45">
            {job.job_id} · Update the job opening.
          </p>

        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 rounded-3xl border border-white/10 bg-[#05060b]/90 p-7 shadow-2xl sm:p-10"
        >

          {/* BASIC INFORMATION */}

          <div>
            <h2 className="text-xl font-semibold">
              Job Information
            </h2>

            <p className="mt-2 text-sm text-white/35">
              Update the basic information for this position.
            </p>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">

            <div className="sm:col-span-2">
              <label className="text-sm text-white/65">
                Job Title *
              </label>

              <input
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                type="text"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-purple-300/40"
                placeholder="Senior Software Engineer"
              />
            </div>

            <div>
              <label className="text-sm text-white/65">
                Company *
              </label>

              <input
                value={company}
                onChange={(event) =>
                  setCompany(event.target.value)
                }
                type="text"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-purple-300/40"
              />
            </div>

            <div>
              <label className="text-sm text-white/65">
                Location *
              </label>

              <input
                value={location}
                onChange={(event) =>
                  setLocation(event.target.value)
                }
                type="text"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-purple-300/40"
              />
            </div>

            <div>
              <label className="text-sm text-white/65">
                Job Type *
              </label>

              <input
                value={type}
                onChange={(event) =>
                  setType(event.target.value)
                }
                type="text"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-purple-300/40"
                placeholder="Full-time"
              />
            </div>

            <div>
              <label className="text-sm text-white/65">
                Experience *
              </label>

              <input
                value={experience}
                onChange={(event) =>
                  setExperience(event.target.value)
                }
                type="text"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-purple-300/40"
                placeholder="3-5 years"
              />
            </div>

            <div>
              <label className="text-sm text-white/65">
                Openings *
              </label>

              <input
                value={openings}
                onChange={(event) =>
                  setOpenings(event.target.value)
                }
                type="number"
                min="1"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-purple-300/40"
              />
            </div>

            <div>
              <label className="text-sm text-white/65">
                Salary
              </label>

              <input
                value={salary}
                onChange={(event) =>
                  setSalary(event.target.value)
                }
                type="text"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-purple-300/40"
                placeholder="e.g. $100,000 - $130,000"
              />
            </div>

            <div>
              <label className="text-sm text-white/65">
                Application Deadline
              </label>

              <input
                value={deadline}
                onChange={(event) =>
                  setDeadline(event.target.value)
                }
                type="date"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-purple-300/40"
              />
            </div>

            <div>
              <label className="text-sm text-white/65">
                Status
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as Job["status"]
                  )
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-purple-300/40"
              >
                <option value="draft">
                  Draft
                </option>

                <option value="published">
                  Published
                </option>

                <option value="paused">
                  Paused
                </option>

                <option value="closed">
                  Closed
                </option>
              </select>
            </div>

          </div>

          {/* DESCRIPTION */}

          <div className="mt-10">

            <h2 className="text-xl font-semibold">
              Job Description
            </h2>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              rows={8}
              className="mt-4 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 outline-none focus:border-purple-300/40"
              placeholder="Describe the position..."
            />

          </div>

          {/* RESPONSIBILITIES */}

          <div className="mt-8">

            <label className="text-sm font-medium text-white/65">
              Responsibilities
            </label>

            <p className="mt-1 text-xs text-white/30">
              Enter one responsibility per line.
            </p>

            <textarea
              value={responsibilities}
              onChange={(event) =>
                setResponsibilities(event.target.value)
              }
              rows={7}
              className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 outline-none focus:border-purple-300/40"
              placeholder={
                "Lead engineering projects\nBuild scalable applications\nCollaborate with product teams"
              }
            />

          </div>

          {/* QUALIFICATIONS */}

          <div className="mt-8">

            <label className="text-sm font-medium text-white/65">
              Qualifications
            </label>

            <p className="mt-1 text-xs text-white/30">
              Enter one qualification per line.
            </p>

            <textarea
              value={qualifications}
              onChange={(event) =>
                setQualifications(event.target.value)
              }
              rows={7}
              className="mt-3 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 outline-none focus:border-purple-300/40"
              placeholder={
                "Bachelor's degree\n3+ years of experience\nStrong communication skills"
              }
            />

          </div>

          {/* ERROR */}

          {error && (
            <div className="mt-7 rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-200/80">
              {error}
            </div>
          )}

          {/* SUCCESS */}

          {success && (
            <div className="mt-7 rounded-xl border border-green-400/20 bg-green-400/5 px-4 py-3 text-sm text-green-200/80">
              {success}
            </div>
          )}

          {/* ACTIONS */}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={() =>
                router.push("/recruiter/jobs")
              }
              className="rounded-xl border border-white/10 bg-white/[0.04] px-6 py-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.08] hover:text-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2
                    size={17}
                    className="mr-2 animate-spin"
                  />
                  Saving...
                </>
              ) : (
                <>
                  <Save
                    size={17}
                    className="mr-2"
                  />
                  Save Changes
                </>
              )}
            </button>

          </div>

        </form>

      </div>

    </main>
  );
}
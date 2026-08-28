"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Plus, X } from "lucide-react";
import { supabase } from "../../../../lib/supabase";

type Recruiter = {
  id: string;
  full_name: string | null;
  email: string | null;
};

export default function NewJobPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("");
  const [experience, setExperience] = useState("");
  const [salary, setSalary] = useState("");
  const [openings, setOpenings] = useState("1");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [recruiterSearch, setRecruiterSearch] = useState("");
  const [selectedRecruiterId, setSelectedRecruiterId] = useState("");
  const [assignmentNotice, setAssignmentNotice] = useState("");

  const [responsibilities, setResponsibilities] = useState<string[]>([""]);
  const [qualifications, setQualifications] = useState<string[]>([""]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRecruiters() {
      const { data, error: recruitersError } = await supabase
        .from("profiles")
        .select("id,full_name,email")
        .in("role", ["owner", "admin", "recruiter"])
        .eq("status", "active")
        .order("full_name", { ascending: true });

      if (recruitersError) {
        setError(recruitersError.message);
        return;
      }

      setRecruiters((data || []) as Recruiter[]);
    }

    void loadRecruiters();
  }, []);

  async function createJob(status: "draft" | "published") {
    setSaving(true);
    setError("");
    setAssignmentNotice("");

    if (!title.trim() || !company.trim()) {
      setError("Job title and company are required.");
      setSaving(false);
      return;
    }

    const { data: existingJobs, error: countError } =
      await supabase
        .from("jobs")
        .select("job_id");

    if (countError) {
      setError(countError.message);
      setSaving(false);
      return;
    }

    const year = new Date().getFullYear();
    const existingJobIds = new Set(
      (existingJobs ?? []).map((job) => job.job_id)
    );
    let jobId = "";

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const randomNumber = crypto.getRandomValues(
        new Uint32Array(1)
      )[0] % 1000;
      const candidateJobId = `HX-${year}-${String(
        randomNumber
      ).padStart(3, "0")}`;

      if (!existingJobIds.has(candidateJobId)) {
        jobId = candidateJobId;
        break;
      }
    }

    if (!jobId) {
      setError("Unable to allocate a job number. Please try again.");
      setSaving(false);
      return;
    }

    const { data: createdJob, error: insertError } = await supabase
      .from("jobs")
      .insert({
        job_id: jobId,
        title: title.trim(),
        company: company.trim(),
        location: location.trim(),
        type: type.trim(),
        experience: experience.trim(),
        salary: salary.trim() || null,
        openings: Number(openings) || 1,
        deadline: deadline || null,
        description: description.trim(),
        responsibilities: responsibilities
          .map((item) => item.trim())
          .filter(Boolean),
        qualifications: qualifications
          .map((item) => item.trim())
          .filter(Boolean),
        recruiter_id: selectedRecruiterId || null,
        status,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error(insertError);
      setError(insertError.message);
      setSaving(false);
      return;
    }

    if (selectedRecruiterId && createdJob) {
      setAssignmentNotice("The selected recruiter was saved to this job.");
    }

    router.push("/recruiter/jobs");
    router.refresh();
  }

  const filteredRecruiters = recruiters.filter((recruiter) => {
    const query = recruiterSearch.trim().toLowerCase();
    return (
      !query ||
      `${recruiter.full_name || ""} ${recruiter.email || ""}`
        .toLowerCase()
        .includes(query)
    );
  });

  const selectedRecruiter = recruiters.find(
    (recruiter) => recruiter.id === selectedRecruiterId
  );

  return (
    <main className="min-h-screen bg-[#03040a] text-white">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">

        <button
          type="button"
          onClick={() => router.push("/recruiter/jobs")}
          className="mb-8 inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Jobs
        </button>

        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-purple-200/80">
            HireX ATS
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
            Create Job
          </h1>

          <p className="mt-2 text-sm text-white/45">
            Create a new job opening for HireX.
          </p>
        </div>

        <div className="space-y-6">

          <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
            <h2 className="text-lg font-semibold">
              Job Information
            </h2>

            <div className="mt-6 grid gap-5 md:grid-cols-2">

              <Field
                label="Job Title *"
                value={title}
                onChange={setTitle}
                placeholder="Senior Software Engineer"
              />

              <Field
                label="Company *"
                value={company}
                onChange={setCompany}
                placeholder="Company name"
              />

              <Field
                label="Location"
                value={location}
                onChange={setLocation}
                placeholder="Remote / New York, NY"
              />

              <Field
                label="Job Type"
                value={type}
                onChange={setType}
                placeholder="Full-time"
              />

              <Field
                label="Experience"
                value={experience}
                onChange={setExperience}
                placeholder="5+ years"
              />

              <Field
                label="Salary"
                value={salary}
                onChange={setSalary}
                placeholder="$100,000 - $130,000"
              />

              <Field
                label="Openings"
                value={openings}
                onChange={setOpenings}
                type="number"
                placeholder="1"
              />

              <Field
                label="Application Deadline"
                value={deadline}
                onChange={setDeadline}
                type="date"
              />

            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
            <h2 className="text-lg font-semibold">Recruiter Assignment</h2>
            <p className="mt-2 text-sm text-white/45">
              Select an internal recruiter by name or email. New jobs have no applications to assign until candidates apply.
            </p>

            <label className="mt-5 block">
              <span className="text-xs font-medium uppercase tracking-wider text-white/40">
                Recruiter
              </span>
              <input
                value={recruiterSearch}
                onChange={(event) => setRecruiterSearch(event.target.value)}
                placeholder="Search name or email"
                aria-label="Search recruiters by name or email"
                className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-purple-300/40"
              />
            </label>

            <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
              {filteredRecruiters.length === 0 ? (
                <p className="rounded-xl border border-white/10 px-4 py-3 text-sm text-white/40">
                  No active recruiters found.
                </p>
              ) : (
                filteredRecruiters.map((recruiter) => {
                  const selected = recruiter.id === selectedRecruiterId;
                  return (
                    <button
                      key={recruiter.id}
                      type="button"
                      onClick={() => {
                        setSelectedRecruiterId(selected ? "" : recruiter.id);
                        setRecruiterSearch(
                          selected
                            ? ""
                            : recruiter.full_name || recruiter.email || ""
                        );
                      }}
                      className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition ${
                        selected
                          ? "border-purple-300/50 bg-purple-300/10 text-white"
                          : "border-white/10 bg-black/20 text-white/70 hover:border-white/25 hover:text-white"
                      }`}
                    >
                      <span>
                        <span className="block font-medium">
                          {recruiter.full_name || "Unnamed recruiter"}
                        </span>
                        <span className="block text-xs text-white/40">
                          {recruiter.email || "No email"}
                        </span>
                      </span>
                      {selected && <Check size={16} />}
                    </button>
                  );
                })
              )}
            </div>

            {selectedRecruiter && (
              <p className="mt-3 text-xs text-purple-200/70">
                Selected: {selectedRecruiter.full_name || selectedRecruiter.email}
              </p>
            )}
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
            <h2 className="text-lg font-semibold">
              Job Description
            </h2>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the position..."
              rows={8}
              className="mt-5 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-purple-300/40"
            />
          </section>

          <ListSection
            title="Responsibilities"
            items={responsibilities}
            setItems={setResponsibilities}
            placeholder="Example: Lead software development projects"
          />

          <ListSection
            title="Qualifications"
            items={qualifications}
            setItems={setQualifications}
            placeholder="Example: 5+ years of software engineering experience"
          />

          {error && (
            <div className="rounded-2xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          {assignmentNotice && (
            <div className="rounded-2xl border border-purple-300/20 bg-purple-300/5 p-4 text-sm text-purple-100">
              {assignmentNotice}
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-6">

            <button
              type="button"
              onClick={() => router.push("/recruiter/jobs")}
              className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-white/60 hover:bg-white/[0.05] hover:text-white"
            >
              {assignmentNotice ? "Continue to Jobs" : "Cancel"}
            </button>

            <button
              type="button"
              disabled={saving || Boolean(assignmentNotice)}
              onClick={() => createJob("draft")}
              className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white hover:bg-white/[0.09] disabled:opacity-50"
            >
              Save Draft
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => createJob("published")}
              className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Publish Job"}
            </button>

          </div>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wider text-white/40">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-purple-300/40"
      />
    </label>
  );
}

function ListSection({
  title,
  items,
  setItems,
  placeholder,
}: {
  title: string;
  items: string[];
  setItems: React.Dispatch<React.SetStateAction<string[]>>;
  placeholder: string;
}) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
      <h2 className="text-lg font-semibold">
        {title}
      </h2>

      <div className="mt-5 space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex gap-2">
            <input
              value={item}
              onChange={(e) =>
                setItems((current) =>
                  current.map((value, i) =>
                    i === index ? e.target.value : value
                  )
                )
              }
              placeholder={placeholder}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-purple-300/40"
            />

            <button
              type="button"
              onClick={() =>
                setItems((current) =>
                  current.length === 1
                    ? current
                    : current.filter(
                        (_, i) => i !== index
                      )
                )
              }
              className="rounded-xl border border-white/10 px-3 text-white/40 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() =>
          setItems((current) => [...current, ""])
        }
        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-purple-200 hover:text-white"
      >
        <Plus size={16} />
        Add {title.toLowerCase().slice(0, -1)}
      </button>
    </section>
  );
}
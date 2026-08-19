"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function RecruitersPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const [jobsResult, applicationsResult] = await Promise.all([
        supabase.from("jobs").select("*").order("created_at", { ascending: false }),
        supabase.from("applications").select("*").order("applied_at", { ascending: false }),
      ]);

      setJobs(jobsResult.data || []);
      setApplications(applicationsResult.data || []);
    }

    load();
  }, []);

  const recruiters = Array.from(
    new Set([
      ...jobs.map((x) => x.recruiter_id).filter(Boolean),
      ...applications.map((x) => x.recruiter_id).filter(Boolean),
    ])
  );

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">
      <h1 className="text-3xl font-semibold">Recruiter Activity</h1>
      <p className="mt-2 text-sm text-white/40">
        Jobs, submissions, interviews, offers and starts by recruiter.
      </p>

      <div className="mt-8 grid gap-4">
        {recruiters.length === 0 ? (
          <div className="rounded-2xl border border-white/10 p-10 text-center text-sm text-white/35">
            No recruiter activity found.
          </div>
        ) : (
          recruiters.map((recruiter) => {
            const recruiterJobs = jobs.filter(
              (x) => x.recruiter_id === recruiter
            );

            const recruiterApps = applications.filter(
              (x) => x.recruiter_id === recruiter
            );

            return (
              <div
                key={recruiter}
                className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"
              >
                <p className="font-semibold">{recruiter}</p>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <Stat label="Jobs" value={recruiterJobs.length} />
                  <Stat
                    label="Submissions"
                    value={
                      recruiterApps.filter((x) =>
                        ["submitted", "submission"].includes(
                          String(x.status).toLowerCase()
                        )
                      ).length
                    }
                  />
                  <Stat
                    label="Interviews"
                    value={
                      recruiterApps.filter((x) =>
                        ["interview", "interviewing"].includes(
                          String(x.status).toLowerCase()
                        )
                      ).length
                    }
                  />
                  <Stat
                    label="Offers"
                    value={
                      recruiterApps.filter((x) =>
                        ["offer", "offered"].includes(
                          String(x.status).toLowerCase()
                        )
                      ).length
                    }
                  />
                  <Stat
                    label="Starts"
                    value={
                      recruiterApps.filter((x) =>
                        ["hired", "started", "start"].includes(
                          String(x.status).toLowerCase()
                        )
                      ).length
                    }
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/20 p-4">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-white/35">{label}</p>
    </div>
  );
}

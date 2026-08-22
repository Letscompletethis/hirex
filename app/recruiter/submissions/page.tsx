"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import {
  type ApplicationSummary,
  formatApplicationStatus,
  formatJobCandidateNumber,
} from "../../../lib/application-display";
import { getRecruiterApplicationScope } from "../../../lib/recruiter-scope";

export default function SubmissionsPage() {
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const recruiterId = await getRecruiterApplicationScope(supabase);
      let request = supabase
        .from("applications")
        .select("id,candidate_id,job_id,status,applied_at,recruiter_id,job_candidate_number")
        .order("applied_at", { ascending: false });

      if (recruiterId === "") {
        setApplications([]);
        setLoading(false);
        return;
      }

      if (recruiterId) {
        request = request.eq("recruiter_id", recruiterId);
      }

      const { data, error } = await request;

      if (!error) setApplications(data || []);
      setLoading(false);
    }

    load();
  }, []);

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">
      <h1 className="text-3xl font-semibold">Submissions</h1>
      <p className="mt-2 text-sm text-white/40">
        Candidates submitted to clients.
      </p>

      {loading ? (
        <p className="mt-10 text-white/40">Loading...</p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
          <div className="grid grid-cols-5 border-b border-white/10 bg-white/[0.03] px-5 py-4 text-xs text-white/40">
            <span>Candidate</span>
            <span>Job Candidate</span>
            <span>Job</span>
            <span>Status</span>
            <span>Date</span>
          </div>

          {applications.length === 0 ? (
            <div className="p-10 text-center text-sm text-white/35">
              No submissions found.
            </div>
          ) : (
            applications.map((application) => (
              <div
                key={application.id}
                className="grid grid-cols-5 border-b border-white/[0.06] px-5 py-4 text-sm"
              >
                <span>{application.candidate_id || "-"}</span>
                <span>{formatJobCandidateNumber(application.job_candidate_number)}</span>
                <span>{application.job_id || "-"}</span>
                <span>{formatApplicationStatus(application.status)}</span>
                <span>
                  {application.applied_at
                    ? new Date(application.applied_at).toLocaleDateString()
                    : "-"}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

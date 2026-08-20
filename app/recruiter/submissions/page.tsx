"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function SubmissionsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .order("applied_at", { ascending: false });

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
          <div className="grid grid-cols-4 border-b border-white/10 bg-white/[0.03] px-5 py-4 text-xs text-white/40">
            <span>Candidate</span>
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
                className="grid grid-cols-4 border-b border-white/[0.06] px-5 py-4 text-sm"
              >
                <span>{application.candidate_id || "-"}</span>
                <span>{application.job_id || "-"}</span>
                <span>{application.status || "-"}</span>
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

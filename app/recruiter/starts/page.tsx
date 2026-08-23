"use client";

import RecruiterActivityPage from "../activity/page";
/* import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import {
  type ApplicationSummary,
  formatJobCandidateNumber,
} from "../../../lib/application-display";
import { getRecruiterApplicationScope } from "../../../lib/recruiter-scope"; */

export default function StartsPage() {
  return <RecruiterActivityPage status="start" />;
/*
  const [items, setItems] = useState<ApplicationSummary[]>([]);

  useEffect(() => {
    async function load() {
      const recruiterId = await getRecruiterApplicationScope(supabase);
      let request = supabase
        .from("applications")
        .select("id,candidate_id,job_id,status,applied_at,recruiter_id,job_candidate_number")
        .in("status", ["hired", "started", "start"])
        .order("applied_at", { ascending: false });

      if (recruiterId === "") {
        setItems([]);
        return;
      }

      if (recruiterId) request = request.eq("recruiter_id", recruiterId);
      const { data } = await request;

      setItems(data || []);
    }

    load();
  }, []);

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">
      <h1 className="text-3xl font-semibold">Starts</h1>
      <p className="mt-2 text-sm text-white/40">
        Candidates who have started.
      </p>

      <div className="mt-8 rounded-2xl border border-white/10">
        {items.length === 0 ? (
          <div className="p-10 text-center text-sm text-white/35">
            No starts found.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="border-b border-white/[0.06] px-5 py-4"
            >
              <p className="text-sm">{item.candidate_id}</p>
              <p className="mt-1 text-xs text-white/35">
                Job: {item.job_id} · {formatJobCandidateNumber(item.job_candidate_number)}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
*/
}

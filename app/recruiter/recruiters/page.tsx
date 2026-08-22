"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Recruiter = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  status: string;
  created_at: string | null;
};

type Application = {
  recruiter_id: string | null;
  status: string | null;
};

export default function RecruitersPage() {
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRecruiters() {
    setLoading(true);
    setError("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      setError("Your recruiter session has expired.");
      setLoading(false);
      return;
    }

    const [usersResponse, applicationsResult] = await Promise.all([
      fetch("/api/recruiter/users", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }),
      supabase.from("applications").select("recruiter_id,status"),
    ]);

    const usersResult = await usersResponse.json();

    if (!usersResponse.ok) {
      setError(usersResult?.error || "Unable to load recruiters.");
    } else {
      setRecruiters((usersResult.users || []).filter(
        (user: Recruiter) =>
          ["owner", "admin", "recruiter"].includes(user.role)
      ) as Recruiter[]);
    }

    if (!applicationsResult.error) {
      setApplications((applicationsResult.data || []) as Application[]);
    }

    setLoading(false);
  }

  useEffect(() => {
    void Promise.resolve().then(loadRecruiters);
  }, []);

  return (
    <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Recruiters</h1>
          <p className="mt-2 text-sm text-white/40">
            HireX recruiter accounts and their assigned applications.
          </p>
        </div>
        <button
          type="button"
          onClick={loadRecruiters}
          disabled={loading}
          className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/70 hover:bg-white/[0.08] disabled:opacity-50"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <p className="mt-10 text-white/40">Loading recruiters...</p>
      ) : (
        <div className="mt-8 grid gap-4">
          {recruiters.length === 0 ? (
            <div className="rounded-2xl border border-white/10 p-10 text-center text-sm text-white/35">
              No recruiter profiles found.
            </div>
          ) : (
            recruiters.map((recruiter) => {
              const assigned = applications.filter(
                (application) => application.recruiter_id === recruiter.id
              );

              return (
                <div
                  key={recruiter.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">
                        {recruiter.full_name || "Unnamed recruiter"}
                      </p>
                      <p className="mt-1 text-sm text-white/45">
                        {recruiter.email || "No email"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded-full border border-white/10 px-3 py-1 text-white/60">
                        {recruiter.role}
                      </span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-white/60">
                        {recruiter.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Stat label="Assigned" value={assigned.length} />
                    <Stat label="Submissions" value={assigned.filter((item) => ["submission", "submitted"].includes(String(item.status).toLowerCase())).length} />
                    <Stat label="Interviews" value={assigned.filter((item) => ["interview", "interviewing"].includes(String(item.status).toLowerCase())).length} />
                    <Stat label="Offers" value={assigned.filter((item) => ["offer", "offered"].includes(String(item.status).toLowerCase())).length} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
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

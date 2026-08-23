"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import {
  formatApplicationStatus,
  formatJobCandidateNumber,
  type ApplicationSummary,
} from "../../../lib/application-display";
import {
  normalizeApplicationStatus,
  type ApplicationStatus,
} from "../../../lib/statuses";
import { getRecruiterApplicationScope } from "../../../lib/recruiter-scope";

type DateRange = "all" | "today" | "week" | "month" | "custom";
type Recruiter = { id: string; full_name: string | null; email: string | null };

const statusLabels: Record<ApplicationStatus, string> = {
  submission: "Submissions", interview: "Interviews", offer: "Offers", start: "Starts",
  rejected: "Rejected", withdrawn: "Withdrawn", hold: "On hold",
};

function inDateRange(value: string | null, range: DateRange, from: string, to: string) {
  if (!value || range === "all") return true;
  const date = new Date(value);
  if (range === "custom") {
    return (!from || date >= new Date(`${from}T00:00:00`)) && (!to || date <= new Date(`${to}T23:59:59`));
  }
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  if (range === "week") start.setDate(start.getDate() - 6);
  if (range === "month") start.setDate(1);
  return date >= start;
}

export default function RecruiterActivityPage({ status }: { status: ApplicationStatus }) {
  const [items, setItems] = useState<ApplicationSummary[]>([]);
  const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [recruiterFilter, setRecruiterFilter] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [draftRange, setDraftRange] = useState<DateRange>("all");
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");

  async function loadActivity() {
    setLoading(true); setError("");
    const scope = await getRecruiterApplicationScope(supabase);
    if (scope === "") { setItems([]); setLoading(false); return; }
    let request = supabase.from("applications").select("id,candidate_id,job_id,status,applied_at,recruiter_id,job_candidate_number").order("applied_at", { ascending: false });
    if (scope) request = request.eq("recruiter_id", scope);
    const [{ data, error: applicationsError }, { data: recruiterData }] = await Promise.all([
      request,
      scope === null ? supabase.from("profiles").select("id,full_name,email").in("role", ["owner", "admin", "recruiter"]).eq("status", "active") : Promise.resolve({ data: [] as Recruiter[] }),
    ]);
    if (applicationsError) setError(applicationsError.message);
    setItems((data || []) as ApplicationSummary[]);
    setRecruiters((recruiterData || []) as Recruiter[]);
    setLoading(false);
  }

  useEffect(() => {
    void Promise.resolve().then(loadActivity);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel(`recruiter-activity-${status}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "applications" }, () => void loadActivity())
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [status]);

  const filtered = useMemo(() => items.filter((item) => {
    const haystack = `${item.candidate_id || ""} ${item.job_id || ""} ${item.job_candidate_number || ""}`.toLowerCase();
    return normalizeApplicationStatus(item.status) === status && (!recruiterFilter || item.recruiter_id === recruiterFilter) && haystack.includes(query.toLowerCase()) && inDateRange(item.applied_at, dateRange, customFrom, customTo);
  }), [items, status, recruiterFilter, query, dateRange, customFrom, customTo]);

  function clearFilters() {
    setDraftRange("all"); setDraftFrom(""); setDraftTo(""); setDateRange("all"); setCustomFrom(""); setCustomTo(""); setQuery(""); setRecruiterFilter("");
  }

  return <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-8">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-semibold">{statusLabels[status]}</h1><p className="mt-2 text-sm text-white/40">Actual applications in the {formatApplicationStatus(status).toLowerCase()} stage.</p></div><span className="text-sm text-white/45">{filtered.length} records</span></div>
    <div className="mt-6 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4 md:grid-cols-[1fr_180px_150px_150px_auto]"><label className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-white/35" /><input aria-label="Search activity" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search candidate, job, ID" className="w-full rounded-lg border border-white/10 bg-black/20 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-white/30" /></label><select aria-label="Recruiter filter" value={recruiterFilter} onChange={(event) => setRecruiterFilter(event.target.value)} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm"><option value="">All recruiters</option>{recruiters.map((recruiter) => <option key={recruiter.id} value={recruiter.id}>{recruiter.full_name || recruiter.email || recruiter.id}</option>)}</select><select aria-label="Date range" value={draftRange} onChange={(event) => setDraftRange(event.target.value as DateRange)} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm"><option value="all">All time</option><option value="today">Today</option><option value="week">This week</option><option value="month">This month</option><option value="custom">Custom</option></select>{draftRange === "custom" ? <><input aria-label="From date" type="date" value={draftFrom} onChange={(event) => setDraftFrom(event.target.value)} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm" /><input aria-label="To date" type="date" value={draftTo} onChange={(event) => setDraftTo(event.target.value)} className="rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm" /></> : <span />}</div>
    <div className="mt-3 flex gap-2"><button type="button" onClick={() => { setDateRange(draftRange); setCustomFrom(draftFrom); setCustomTo(draftTo); }} className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-black"><SlidersHorizontal className="h-4 w-4" />Apply</button><button type="button" onClick={clearFilters} className="rounded-lg border border-white/10 px-3 py-2 text-sm text-white/65">Clear</button></div>
    {error && <p className="mt-5 rounded-lg border border-red-400/20 bg-red-400/5 p-3 text-sm text-red-200">{error}</p>}<div className="mt-6 overflow-x-auto rounded-2xl border border-white/10"><div className="min-w-[760px]"><div className="grid grid-cols-6 border-b border-white/10 bg-white/[0.03] px-5 py-3 text-xs text-white/45"><span>Candidate</span><span>Job candidate</span><span>Job</span><span>Status</span><span>Recruiter</span><span>Date</span></div>{loading ? <p className="p-10 text-center text-sm text-white/40">Loading activity...</p> : filtered.length === 0 ? <p className="p-10 text-center text-sm text-white/35">No matching applications found.</p> : filtered.map((item) => <div key={item.id} className="grid grid-cols-6 border-b border-white/[0.06] px-5 py-3 text-sm"><span>{item.candidate_id || "-"}</span><span>{formatJobCandidateNumber(item.job_candidate_number)}</span><span>{item.job_id || "-"}</span><span>{formatApplicationStatus(item.status)}</span><span>{recruiters.find((recruiter) => recruiter.id === item.recruiter_id)?.full_name || item.recruiter_id || "-"}</span><span>{item.applied_at ? new Date(item.applied_at).toLocaleDateString() : "-"}</span></div>)}</div></div>
  </div>;
}
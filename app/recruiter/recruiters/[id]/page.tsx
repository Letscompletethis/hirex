"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { supabase } from "../../../../lib/supabase";
import { normalizeApplicationStatus, type ApplicationStatus } from "../../../../lib/statuses";

type DateRange = "all" | "today" | "week" | "month" | "custom";
type Profile = { id: string; email: string | null; full_name: string | null; role: string; status: string; created_at: string | null };
type Activity = { job_id: string | null; status: string | null; applied_at: string | null };

const metrics: { status: ApplicationStatus; label: string }[] = [
  { status: "submission", label: "Submission" }, { status: "interview", label: "Interview" },
  { status: "offer", label: "Offer" }, { status: "start", label: "Start" },
  { status: "withdrawn", label: "Withdrawn" },
];

function matchesDate(value: string | null, range: DateRange, from: string, to: string) {
  if (!value || range === "all") return true;
  const date = new Date(value);
  if (range === "custom") return (!from || date >= new Date(`${from}T00:00:00`)) && (!to || date <= new Date(`${to}T23:59:59`));
  const start = new Date(); start.setHours(0, 0, 0, 0);
  if (range === "week") start.setDate(start.getDate() - 6);
  if (range === "month") start.setDate(1);
  return date >= start;
}

export default function RecruiterProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userAuth, setUserAuth] = useState<{ emailConfirmed: string | null; lastSignIn: string | null }>({ emailConfirmed: null, lastSignIn: null });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [jobCount, setJobCount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<DateRange>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [draftRange, setDraftRange] = useState<DateRange>("all");
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { id } = await params;
        const { data: current } = await supabase.auth.getUser();
        if (!current.user) throw new Error("Your recruiter session has expired.");
        const { data: currentProfile } = await supabase.from("profiles").select("role,status").eq("id", current.user.id).maybeSingle();
        if (!currentProfile || !["owner", "admin", "super_admin"].includes(String(currentProfile.role).toLowerCase()) || String(currentProfile.status).toLowerCase() !== "active") throw new Error("You do not have permission to view recruiter profiles.");
        const { data: sessionData } = await supabase.auth.getSession();
        const [{ data: profileData, error: profileError }, { data: activityData, error: activityError }] = await Promise.all([
          supabase.from("profiles").select("id,email,full_name,role,status,created_at").eq("id", id).maybeSingle(),
          supabase.from("applications").select("job_id,status,applied_at").eq("recruiter_id", id),
        ]);
        if (profileError) throw new Error(profileError.message);
        if (activityError) throw new Error(activityError.message);
        if (!profileData) throw new Error("Recruiter profile not found.");
        const usersResponse = await fetch("/api/recruiter/users", { headers: { Authorization: `Bearer ${sessionData.session?.access_token || ""}` } });
        const usersResult = await usersResponse.json();
        const authProfile = (usersResult.users || []).find((user: Profile & { email_confirmed_at: string | null; last_sign_in_at: string | null }) => user.id === id);
        const jobIds = [...new Set((activityData || []).map((item) => item.job_id).filter(Boolean))];
        if (active) {
          setProfile(profileData as Profile); setActivities((activityData || []) as Activity[]); setJobCount(jobIds.length);
          setUserAuth({ emailConfirmed: authProfile?.email_confirmed_at || null, lastSignIn: authProfile?.last_sign_in_at || null });
        }
      } catch (err) { if (active) setError(err instanceof Error ? err.message : "Unable to load recruiter profile."); }
      finally { if (active) setLoading(false); }
    }
    void load(); return () => { active = false; };
  }, [params]);

  const filtered = useMemo(() => activities.filter((item) => matchesDate(item.applied_at, range, from, to)), [activities, range, from, to]);
  function clear() { setDraftRange("all"); setDraftFrom(""); setDraftTo(""); setRange("all"); setFrom(""); setTo(""); }

  if (loading) return <div className="mx-auto max-w-[1200px] px-5 py-8 text-white/45">Loading recruiter profile...</div>;
  if (error || !profile) return <div className="mx-auto max-w-[1200px] px-5 py-8"><Link href="/recruiter/recruiters" className="inline-flex items-center gap-2 text-sm text-white/65"><ArrowLeft className="h-4 w-4" />Back to recruiters</Link><p className="mt-6 rounded-xl border border-red-400/20 bg-red-400/5 p-4 text-sm text-red-200">{error || "Recruiter profile not found."}</p></div>;

  return <main className="mx-auto max-w-[1200px] px-5 py-8 sm:px-8"><Link href="/recruiter/recruiters" className="inline-flex items-center gap-2 text-sm text-white/65"><ArrowLeft className="h-4 w-4" />Back to recruiters</Link><div className="mt-5 flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-semibold">{profile.full_name || "Unnamed recruiter"}</h1><p className="mt-2 flex items-center gap-2 text-sm text-white/45"><Mail className="h-4 w-4" />{profile.email || "No email"}</p></div><div className="flex gap-2 text-xs"><span className="rounded-full border border-white/10 px-3 py-1 text-white/65">{profile.role}</span><span className="rounded-full border border-white/10 px-3 py-1 text-white/65">{profile.status}</span></div></div>
    <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Info label="Email verification" value={userAuth.emailConfirmed ? "Verified" : "Not verified"} icon={userAuth.emailConfirmed ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <ShieldCheck className="h-4 w-4 text-white/40" />} /><Info label="Assigned applications" value={String(activities.length)} /><Info label="Assigned jobs" value={String(jobCount)} /><Info label="Last sign in" value={userAuth.lastSignIn ? new Date(userAuth.lastSignIn).toLocaleDateString() : "-"} /></section>
    <div className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4"><label className="text-xs text-white/45">Date range<select value={draftRange} onChange={(event) => setDraftRange(event.target.value as DateRange)} className="mt-1 block rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"><option value="all">All time</option><option value="today">Today</option><option value="week">This week</option><option value="month">This month</option><option value="custom">Custom</option></select></label>{draftRange === "custom" && <><label className="text-xs text-white/45">From<input type="date" value={draftFrom} onChange={(event) => setDraftFrom(event.target.value)} className="mt-1 block rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm" /></label><label className="text-xs text-white/45">To<input type="date" value={draftTo} onChange={(event) => setDraftTo(event.target.value)} className="mt-1 block rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm" /></label></>}<button type="button" onClick={() => { setRange(draftRange); setFrom(draftFrom); setTo(draftTo); }} className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black">Apply</button><button type="button" onClick={clear} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/65">Clear</button></div>
    <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{metrics.map((metric) => <div key={metric.status} className="rounded-xl border border-white/10 bg-white/[0.025] p-4"><p className="text-2xl font-semibold">{filtered.filter((item) => normalizeApplicationStatus(item.status) === metric.status).length}</p><p className="mt-1 text-xs text-white/45">{metric.label}</p></div>)}</section>
    <p className="mt-5 text-xs text-white/35">Profile created {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : "-"}</p>
  </main>;
}

function Info({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) { return <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4"><p className="flex items-center gap-2 text-xs text-white/45">{icon}{label}</p><p className="mt-2 text-sm font-medium">{value}</p></div>; }
"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ExternalLink, FileText, History, Mail, Phone, StickyNote, User, X } from "lucide-react";
import { parseCandidateNotes, serializeCandidateNotes, type CandidateNote } from "../../../lib/candidate-notes";
import { supabase } from "../../../lib/supabase";

export type CandidateProfileCandidate = {
  ID?: string; id?: string; candidate_id?: string | null; first_name?: string | null; last_name?: string | null;
  email?: string | null; phone?: string | null; resume_path?: string | null; job_id?: string | null; job_title?: string | null;
  status?: string | null; created_at?: string | null; viewed_at?: string | null; current_job_title?: string | null;
  current_company?: string | null; location?: string | null; experience?: string | null; skills?: string[] | null;
  education?: Record<string, unknown> | null; notes?: string | null;
};

export type CandidateProfileApplication = {
  id?: string; candidate_id?: string | null; job_id?: string | null; status?: string | null; applied_at?: string | null;
  created_at?: string | null; recruiter_id?: string | null; job_candidate_number?: number | null;
};

type CandidateProfileJob = { id: string; title?: string | null };

export default function CandidateProfile({ candidate, applications = [], jobs = [], resumeUrl, statusOptions, status, statusClass, formatStatus, onStatusChange, onOpenResume, onClose, onPrevious, onNext, index, count, jobContext, onAddNote, onEditNote }: {
  candidate: CandidateProfileCandidate; applications?: CandidateProfileApplication[]; jobs?: CandidateProfileJob[]; resumeUrl: string;
  statusOptions: string[]; status: string; statusClass: (status: string | null) => string; formatStatus: (status: string | null | undefined) => string;
  onStatusChange: (status: string) => void | Promise<void>; onOpenResume: () => void | Promise<void>; onClose: () => void;
  onPrevious?: () => void; onNext?: () => void; index?: number; count?: number;
  jobContext?: { title: string; company?: string | null; application?: CandidateProfileApplication | null };
  onAddNote?: (text: string) => Promise<string | null>; onEditNote?: (noteId: string, text: string) => Promise<string | null>;
}) {
  const [panel, setPanel] = useState<"notes" | "history" | null>(null);
  const [noteText, setNoteText] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [savedNotes, setSavedNotes] = useState(() => parseCandidateNotes(candidate.notes));
  const [events, setEvents] = useState<Array<{ event_type: string; old_value: string | null; new_value: string | null; metadata: Record<string, unknown>; created_at: string }>>([]);
  const notes = savedNotes;
  const databaseId = candidate.ID || candidate.id || "";
  const name = `${candidate.first_name || ""} ${candidate.last_name || ""}`.trim() || "Unnamed Candidate";
  const candidateId = candidate.candidate_id || "—";
  const candidateApplications = applications.filter((application) => [candidate.ID, candidate.id, candidate.candidate_id].includes(application.candidate_id || ""));
  useEffect(() => {
    if (!databaseId) return;
    let cancelled = false;
    async function loadHistory() {
      const [{ data: noteRows }, { data: eventRows }] = await Promise.all([
        supabase.from("candidate_notes").select("id,body,author_id,created_at,updated_at,application_id").eq("candidate_id", databaseId).is("deleted_at", null).order("created_at", { ascending: false }),
        supabase.from("candidate_activity_events").select("event_type,old_value,new_value,metadata,created_at").eq("candidate_id", databaseId).order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;
      if (noteRows?.length) setSavedNotes(noteRows.map((note) => ({ id: note.id, text: note.body, author: note.author_id || "HireX", createdAt: note.created_at, editedAt: note.updated_at || undefined })));
      setEvents((eventRows || []) as typeof events);
    }
    void loadHistory();
    return () => { cancelled = true; };
  }, [databaseId]);

    // Real-time subscription for activity events and notes
    useEffect(() => {
      if (!databaseId) return;
      let cancelled = false;

      // Subscribe to activity events
      const eventSubscription = supabase
        .channel(`candidate-events-${databaseId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "candidate_activity_events", filter: `candidate_id=eq.${databaseId}` },
          (payload) => {
            if (cancelled) return;
            const newEvent = payload.new as typeof events[0];
            setEvents((prev) => [newEvent, ...prev]);
          }
        )
        .subscribe();

      // Subscribe to notes
      const noteSubscription = supabase
        .channel(`candidate-notes-${databaseId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "candidate_notes", filter: `candidate_id=eq.${databaseId}` },
          async (payload) => {
            if (cancelled) return;
            const oldNote = payload.old as Record<string, unknown>;
            const newNotePayload = payload.new as Record<string, unknown>;
            if (payload.eventType === "DELETE" || newNotePayload.deleted_at) {
              setSavedNotes((prev) => prev.filter((n) => n.id !== (oldNote.id || newNotePayload.id)));
            } else if (payload.new) {
              const newNote = { id: String(newNotePayload.id || crypto.randomUUID()), text: String(newNotePayload.body || ""), author: String(newNotePayload.author_id || "HireX"), createdAt: String(newNotePayload.created_at || ""), editedAt: newNotePayload.updated_at ? String(newNotePayload.updated_at) : undefined };
              setSavedNotes((prev) => {
                const existing = prev.findIndex((n) => n.id === newNote.id);
                return existing >= 0 ? prev.map((n, i) => i === existing ? newNote : n) : [...prev, newNote];
              });
            }
          }
        )
        .subscribe();

      return () => {
        cancelled = true;
        void eventSubscription.unsubscribe();
        void noteSubscription.unsubscribe();
      };
    }, [databaseId]);
  const timeline = [
    candidate.created_at ? { label: "Candidate record created", timestamp: candidate.created_at } : null,
    candidate.viewed_at ? { label: "Profile viewed", timestamp: candidate.viewed_at } : null,
    ...candidateApplications.map((application) => ({ label: `Application${application.job_id ? ` · ${jobs.find((job) => job.id === application.job_id)?.title || application.job_id}` : ""}`, timestamp: application.applied_at || application.created_at })),
    ...events.map((event) => ({ label: `${event.event_type.replaceAll("_", " ")}${event.new_value ? `: ${event.new_value}` : ""}`, timestamp: event.created_at })),
    ...notes.flatMap((note) => [note.createdAt ? { label: `Note added by ${note.author}`, timestamp: note.createdAt } : null, note.editedAt ? { label: `Note edited by ${note.author}`, timestamp: note.editedAt } : null]),
  ].filter((event): event is { label: string; timestamp: string } => Boolean(event));

  async function saveNotes(nextNotes: CandidateNote[]) {
    const databaseId = candidate.ID || candidate.id;
    if (!databaseId) return false;
    let result = await supabase.from("candidates").update({ notes: serializeCandidateNotes(nextNotes) }).eq("ID", databaseId);
    if (result.error) result = await supabase.from("candidates").update({ notes: serializeCandidateNotes(nextNotes) }).eq("id", databaseId);
    if (result.error) return false;
    setSavedNotes(nextNotes);
    return true;
  }

  async function addNote() {
    const text = noteText.trim(); if (!text) return; setSavingNote(true);
    const { data: auth } = await supabase.auth.getUser();
    const { data: profile } = auth.user ? await supabase.from("profiles").select("full_name,email").eq("id", auth.user.id).maybeSingle() : { data: null };
    const note: CandidateNote = { id: crypto.randomUUID(), text, author: profile?.full_name || profile?.email || auth.user?.email || "HireX", createdAt: new Date().toISOString() };
    let saved: string | null = null;
    if (onAddNote) {
      saved = await onAddNote(text);
    } else if (databaseId) {
      const { data: { session } } = await supabase.auth.getSession();
      const response = session?.access_token ? await fetch(`/api/recruiter/candidates/${databaseId}/notes`, { method: "POST", headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" }, body: JSON.stringify({ body: text, applicationId: jobContext?.application?.id || null }) }) : null;
      const result = response ? await response.json() as { notes?: string } : {};
      if (response?.ok && result.notes) { saved = result.notes; setSavedNotes(parseCandidateNotes(result.notes)); }
    } else {
      saved = (await saveNotes([...notes, note])) ? serializeCandidateNotes([...notes, note]) : null;
    }
    if (saved) setNoteText(""); setSavingNote(false);
  }
  async function editNote(note: CandidateNote) {
    const text = editingNoteText.trim(); if (!text) return; setSavingNote(true);
    const updated = { ...note, text, editedAt: new Date().toISOString() };
    const saved = onEditNote ? await onEditNote(note.id, text) : await saveNotes(notes.map((item) => item.id === note.id ? updated : item));
    if (saved) { setEditingNoteId(null); setEditingNoteText(""); } setSavingNote(false);
  }

  return <div className="fixed inset-0 z-50 bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`${name} candidate profile`}>
    <div className="mx-auto flex h-full max-w-[1500px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#080910] shadow-2xl">
      <header className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4"><div className="flex items-center gap-3"><div className="rounded-xl bg-purple-400/10 p-2.5 text-purple-200"><User size={20} /></div><div><h2 className="text-lg font-semibold">{name}</h2><p className="text-xs text-white/35">{candidateId}</p></div></div><button type="button" onClick={onClose} className="rounded-lg border border-white/10 p-2 text-white/50" aria-label="Close profile"><X size={18} /></button></header>
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3"><div className="flex items-center gap-3">{onPrevious && <button type="button" onClick={onPrevious} disabled={!index || index <= 0} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60 disabled:opacity-25"><ChevronLeft size={14} /> Previous</button>}{typeof index === "number" && typeof count === "number" && <span className="text-xs text-white/30">Candidate {index + 1} of {count}</span>}{onNext && <button type="button" onClick={onNext} disabled={typeof index === "number" && typeof count === "number" && index >= count - 1} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60 disabled:opacity-25">Next <ChevronRight size={14} /></button>}</div><select value={status} onChange={(event) => void onStatusChange(event.target.value)} className={`rounded-lg border bg-[#090a11] px-4 py-2.5 text-xs font-medium outline-none ${statusClass(status)}`} aria-label="Candidate status">{statusOptions.map((option) => <option key={option} value={option}>{formatStatus(option)}</option>)}</select></div>
      {jobContext && <div className="border-b border-purple-400/20 bg-purple-400/[0.04] px-5 py-4"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-purple-200/55">Application context</p><p className="mt-1 text-lg font-semibold">{jobContext.title}</p><p className="text-sm text-white/40">{jobContext.company || "No company"}{jobContext.application?.job_candidate_number ? ` · JC-${String(jobContext.application.job_candidate_number).padStart(3, "0")}` : ""}</p></div>}
      <div className="grid min-h-0 flex-1 lg:grid-cols-[360px_1fr]"><aside className="overflow-y-auto border-b border-white/10 p-5 lg:border-b-0 lg:border-r"><h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">Candidate Details</h3><div className="mt-5 space-y-4"><Detail label="Email" icon={<Mail size={14} />} value={candidate.email} /><Detail label="Phone" icon={<Phone size={14} />} value={candidate.phone} /><Detail label="Current Title" value={candidate.current_job_title} /><Detail label="Current Company" value={candidate.current_company} /><Detail label="Location" value={candidate.location} /><Detail label="Experience" value={candidate.experience} /><Detail label="Candidate ID" value={candidateId} mono />{candidate.skills?.length ? <Detail label="Skills" value={candidate.skills.join(", ")} /> : null}{candidate.education && <Detail label="Education" value={Object.values(candidate.education).filter(Boolean).join(" · ")} />}<div className="grid grid-cols-2 gap-2 pt-2"><button type="button" onClick={() => setPanel("notes")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-400/20 bg-purple-400/[0.06] px-3 py-2.5 text-xs text-purple-100"><StickyNote size={14} /> Notes</button><button type="button" onClick={() => setPanel("history")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs text-white/70"><History size={14} /> History</button></div></div></aside><section className="min-h-0 bg-[#11121a]">{resumeUrl ? <div className="flex h-full flex-col"><div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3"><span className="inline-flex items-center gap-2 text-xs text-white/50"><FileText size={15} /> Resume</span><a href={resumeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60"><ExternalLink size={13} /> Open in New Tab</a></div><iframe src={resumeUrl} title={`${name} resume`} className="min-h-0 flex-1 w-full" /></div> : <div className="flex h-full flex-col items-center justify-center px-5 text-center"><FileText size={45} className="text-white/10" /><h3 className="mt-5 text-lg font-semibold">Resume unavailable</h3><p className="mt-2 text-sm text-white/35">This candidate does not currently have a resume that can be displayed.</p>{candidate.resume_path && <button type="button" onClick={() => void onOpenResume()} className="mt-4 text-sm text-purple-300">Open resume</button>}</div>}</section></div>
    </div>
    {panel && <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={() => setPanel(null)}><aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-[#0a0b12]" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-200/70">{panel === "notes" ? "Notes" : "History"}</p><p className="mt-1 text-sm text-white/45">{name}</p></div><button type="button" onClick={() => setPanel(null)} className="p-2 text-white/50" aria-label="Close panel"><X size={17} /></button></div>{panel === "notes" ? <div className="flex-1 space-y-4 overflow-y-auto p-5">{notes.length === 0 && <p className="text-sm text-white/35">No notes saved.</p>}{notes.map((note) => <div key={note.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">{editingNoteId === note.id ? <textarea value={editingNoteText} onChange={(event) => setEditingNoteText(event.target.value)} rows={4} className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" /> : <p className="whitespace-pre-wrap text-sm text-white/75">{note.text}</p>}<p className="mt-3 text-[11px] text-white/35">{note.author}{note.createdAt ? ` · ${new Date(note.createdAt).toLocaleString()}` : ""}</p>{onEditNote && <div className="mt-3">{editingNoteId === note.id ? <button type="button" disabled={savingNote} onClick={() => void editNote(note)} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black">Save</button> : <button type="button" onClick={() => { setEditingNoteId(note.id); setEditingNoteText(note.text); }} className="text-xs text-purple-200">Edit</button>}</div>}</div>)}{onAddNote && <div className="border-t border-white/10 pt-4"><textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="Write a note..." rows={4} className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white" /><button type="button" disabled={savingNote || !noteText.trim()} onClick={() => void addNote()} className="mt-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-black disabled:opacity-40">{savingNote ? "Saving..." : "Add Note"}</button></div>}</div> : <div className="flex-1 space-y-3 overflow-y-auto p-5">{timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((event) => <div key={`${event.label}-${event.timestamp}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><p className="text-sm text-white/75">{event.label}</p><p className="mt-1 text-xs text-white/35">{new Date(event.timestamp).toLocaleString()}</p></div>)}<div className="rounded-xl border border-white/10 bg-white/[0.03] p-3"><p className="text-sm text-white/75">Current status: {formatStatus(status)}</p><p className="mt-1 text-xs text-white/35">Status-change timestamps are not available.</p></div></div>}</aside></div>}
  </div>;
}

function Detail({ label, value, icon, mono }: { label: string; value?: string | null; icon?: React.ReactNode; mono?: boolean }) {
  return <div><p className="text-xs text-white/25">{label}</p><p className={`mt-1 flex items-start gap-2 text-sm text-white/70 ${mono ? "font-mono text-purple-200" : ""}`}>{icon}{value || "—"}</p></div>;
}
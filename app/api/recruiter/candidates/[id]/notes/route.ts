import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseCandidateNotes, serializeCandidateNotes, type CandidateNote } from "../../../../../../lib/candidate-notes";

function client() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function actor(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const admin = client();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await admin.from("profiles").select("full_name,email,role,status").eq("id", user.id).maybeSingle();
  const role = String(profile?.role || "").toLowerCase();
  if (!profile || !["owner", "admin", "super_admin", "recruiter"].includes(role) || (profile.status && String(profile.status).toLowerCase() !== "active")) return null;
  return { admin, user, profile };
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const current = await actor(request);
  if (!current) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  const body = await request.json() as { body?: string; applicationId?: string };
  const text = body.body?.trim();
  if (!text) return NextResponse.json({ error: "Note text is required." }, { status: 400 });
  const { data: candidate, error: candidateError } = await current.admin.from("candidates").select("ID,notes").eq("ID", id).maybeSingle();
  if (candidateError) return NextResponse.json({ error: candidateError.message }, { status: 500 });
  if (!candidate) return NextResponse.json({ error: "Candidate not found." }, { status: 404 });
  const databaseId = String(candidate.ID || id);
  const note: CandidateNote = { id: crypto.randomUUID(), text, author: current.profile.full_name || current.profile.email || current.user.email || "HireX", createdAt: new Date().toISOString() };
  const { error: noteError } = await current.admin.from("candidate_notes").insert({ candidate_id: databaseId, application_id: body.applicationId || null, author_id: current.user.id, body: text });
  if (noteError) return NextResponse.json({ error: noteError.message }, { status: 500 });
  const notes = [...parseCandidateNotes(candidate.notes), note];
  const { error: updateError } = await current.admin.from("candidates").update({ notes: serializeCandidateNotes(notes) }).eq("ID", databaseId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  await current.admin.from("candidate_activity_events").insert({ candidate_id: databaseId, application_id: body.applicationId || null, actor_id: current.user.id, event_type: "note_added", metadata: { note_id: note.id } });
  return NextResponse.json({ note, notes: serializeCandidateNotes(notes) }, { status: 201 });
}
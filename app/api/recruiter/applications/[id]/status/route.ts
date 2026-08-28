import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { normalizeApplicationStatus } from "../../../../../../lib/statuses";

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function getActor(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  const admin = adminClient();
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await admin.from("profiles").select("role,status").eq("id", user.id).maybeSingle();
  const role = String(profile?.role || "").toLowerCase();
  const status = String(profile?.status || "").toLowerCase();
  if (!profile || !["owner", "admin", "super_admin", "recruiter"].includes(role) || (status && status !== "active")) return null;
  return { admin, user };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getActor(request);
  if (!actor) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const { id } = await params;
  const body = await request.json() as { status?: string };
  const nextStatus = normalizeApplicationStatus(body.status);
  const { data: application, error: lookupError } = await actor.admin
    .from("applications")
    .select("id,candidate_id,job_id,status")
    .eq("id", id)
    .maybeSingle();
  if (lookupError) return NextResponse.json({ error: lookupError.message }, { status: 500 });
  if (!application) return NextResponse.json({ error: "Application not found." }, { status: 404 });

  const { data: updated, error: updateError } = await actor.admin
    .from("applications")
    .update({ status: nextStatus })
    .eq("id", id)
    .select("id,candidate_id,job_id,status")
    .single();
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  if (String(application.status) !== nextStatus) {
    const { error: eventError } = await actor.admin.from("candidate_activity_events").insert({
      candidate_id: application.candidate_id,
      application_id: application.id,
      actor_id: actor.user.id,
      event_type: "status_changed",
      old_value: application.status,
      new_value: nextStatus,
      metadata: { job_id: application.job_id },
    });
    if (eventError) return NextResponse.json({ error: eventError.message }, { status: 500 });
  }
  return NextResponse.json({ application: updated });
}
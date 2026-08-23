import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { allocateCandidateNumber } from "../../../../../lib/candidate-number";
import { extractResumeText } from "../../../../../lib/resume-text-extraction";

export const runtime = "nodejs";

type ImportProfile = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  currentJobTitle?: string;
  linkedinProfileUrl?: string;
  resumeText?: string;
};

function getAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("CONFIGURATION: Supabase server credentials are required for LinkedIn imports.");
  return createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function authenticate(request: NextRequest) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const token = header.slice("Bearer ".length).trim();
  if (!token) throw new Error("UNAUTHORIZED");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (url && publishableKey) {
    const authClient = createClient(url, publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: { user }, error } = await authClient.auth.getUser(token);
    if (error || !user) throw new Error("UNAUTHORIZED");
    return;
  }

  if (!process.env.LINKEDIN_IMPORT_TOKEN) throw new Error("CONFIGURATION: Set Supabase variables or LINKEDIN_IMPORT_TOKEN.");
  if (token !== process.env.LINKEDIN_IMPORT_TOKEN) throw new Error("UNAUTHORIZED");
}

export async function POST(request: NextRequest) {
  try {
    await authenticate(request);
    const body = await request.json() as { source?: string; profile?: ImportProfile };
    const profile = body.profile || {};
    const email = String(profile.email || "").trim().toLowerCase();
    const linkedinProfileUrl = String(profile.linkedinProfileUrl || "").trim() || null;
    const phone = String(profile.phone || "").trim() || null;
    const parsedResume = profile.resumeText?.trim() ? extractResumeText(profile.resumeText) : null;
    const resolvedEmail = email || parsedResume?.email || "";
    const resolvedPhone = phone || parsedResume?.phone || null;
    if (body.source !== "user-selected") return NextResponse.json({ error: "Only user-selected, user-provided profile information can be imported." }, { status: 400 });
    if (!resolvedEmail && !linkedinProfileUrl && !resolvedPhone) return NextResponse.json({ error: "Email, LinkedIn profile URL, or phone is required to match or create a candidate." }, { status: 400 });

    const admin = getAdminClient();
    let existing: Record<string, unknown> | undefined;
    if (email) {
      const lookup = await admin.from("candidates").select("*").ilike("email", email).limit(1);
      if (lookup.error) throw new Error(lookup.error.message);
      existing = lookup.data?.[0] as Record<string, unknown> | undefined;
    }
    if (!existing && linkedinProfileUrl) {
      const lookup = await admin.from("candidates").select("*").eq("linkedin_profile_url", linkedinProfileUrl).limit(1);
      if (lookup.error) throw new Error(lookup.error.message);
      existing = lookup.data?.[0] as Record<string, unknown> | undefined;
    }
    if (!existing && phone) {
      const lookup = await admin.from("candidates").select("*").eq("phone", phone).limit(1);
      if (lookup.error) throw new Error(lookup.error.message);
      existing = lookup.data?.[0] as Record<string, unknown> | undefined;
    }
    const values = {
      first_name: String(profile.firstName || parsedResume?.name?.split(/\s+/)[0] || "").trim() || null,
      last_name: String(profile.lastName || parsedResume?.name?.split(/\s+/).slice(1).join(" ") || "").trim() || null,
      email: resolvedEmail,
      phone: resolvedPhone,
      current_job_title: String(profile.currentJobTitle || "").trim() || null,
      ...(linkedinProfileUrl ? { linkedin_profile_url: linkedinProfileUrl } : {}),
    };

    if (existing) {
      const databaseId = String(existing.ID || existing.id || "");
      if (!databaseId) throw new Error("Existing candidate has no database ID.");
      const candidateId = String(existing.candidate_id || "").trim() || await allocateCandidateNumber(admin);
      const updateValues = { ...values, candidate_id: candidateId };
      let result = await admin.from("candidates").update(updateValues).eq("ID", databaseId).select("*").single();
      if (result.error) result = await admin.from("candidates").update(updateValues).eq("id", databaseId).select("*").single();
      if (result.error) throw new Error(result.error.message);
      return NextResponse.json({ candidate: result.data, created: false, resumeParsed: Boolean(parsedResume), persistence: "Existing candidate updated; external profile data is matched by stored LinkedIn URL when available." });
    }

    const candidateId = await allocateCandidateNumber(admin);
    const { data: candidate, error: insertError } = await admin.from("candidates").insert({ candidate_id: candidateId, ...values, status: "new" }).select("*").single();
    if (insertError) throw new Error(insertError.message);
    return NextResponse.json({ candidate, created: true, resumeParsed: Boolean(parsedResume), persistence: "Candidate created with the existing schema; user-provided LinkedIn URL is stored for future matching." }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to import candidate.";
    const status = message === "UNAUTHORIZED" ? 401 : message.startsWith("CONFIGURATION:") ? 503 : 500;
    return NextResponse.json({ error: message.replace(/^CONFIGURATION: /, "") }, { status });
  }
}
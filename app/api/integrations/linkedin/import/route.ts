import { NextRequest, NextResponse } from "next/server";
import { allocateCandidateNumber } from "../../../../../lib/candidate-number";
import { extractResumeText } from "../../../../../lib/resume-text-extraction";
import { requireAuthorizedHireXUser } from "../../../../../lib/server-auth";
import { getGoogleDriveStatus } from "../../../../../lib/google-drive";
import { ensureCandidateFolder } from "../../../../../lib/drive-application-upload";

export const runtime = "nodejs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ImportProfile = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  currentJobTitle?: string;
  linkedinProfileUrl?: string;
  resumeText?: string;
};

async function authenticate(request: NextRequest) {
  return requireAuthorizedHireXUser(request);
}

export async function POST(request: NextRequest) {
  try {
    const { admin } = await authenticate(request);
    const body = await request.json() as { source?: string; profile?: ImportProfile };
    const profile = body.profile || {};
    const email = String(profile.email || "").trim().toLowerCase();
    const linkedinProfileUrl = String(profile.linkedinProfileUrl || "").trim() || null;
    const phone = String(profile.phone || "").trim() || null;
    const parsedResume = profile.resumeText?.trim() ? extractResumeText(profile.resumeText) : null;
    const resolvedEmail = email || parsedResume?.email || "";
    const resolvedPhone = phone || parsedResume?.phone || null;
    if (body.source !== "user-selected") return NextResponse.json({ error: "Only user-selected, user-provided profile information can be imported." }, { status: 400, headers: corsHeaders });
    if (!resolvedEmail && !linkedinProfileUrl && !resolvedPhone) return NextResponse.json({ error: "Email, LinkedIn profile URL, or phone is required to match or create a candidate." }, { status: 400, headers: corsHeaders });

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
      ...(resolvedEmail ? { email: resolvedEmail } : {}),
      phone: resolvedPhone,
      current_job_title: String(profile.currentJobTitle || parsedResume?.currentJobTitle || "").trim() || null,
      ...(linkedinProfileUrl ? { linkedin_profile_url: linkedinProfileUrl } : {}),
    };

    const nonEmptyValues = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== null && value !== ""));

    // Prepare candidate name for Drive folder
    const candidateName = String(profile.firstName || "").trim() && String(profile.lastName || "").trim()
      ? `${String(profile.firstName || "").trim()} ${String(profile.lastName || "").trim()}`
      : String(profile.email || "").split("@")[0] || "Candidate";

    let driveStatus = "not_configured";
    let driveError: string | null = null;

    if (existing) {
      const databaseId = String(existing.ID || existing.id || "");
      if (!databaseId) throw new Error("Existing candidate has no database ID.");
      const candidateId = String(existing.candidate_id || "").trim() || await allocateCandidateNumber(admin);
      const updateValues = { ...nonEmptyValues, candidate_id: candidateId };
      let result = await admin.from("candidates").update(updateValues).eq("ID", databaseId).select("*").single();
      if (result.error) result = await admin.from("candidates").update(updateValues).eq("id", databaseId).select("*").single();
      if (result.error) throw new Error(result.error.message);

      // Attempt to create/update Drive folder (non-blocking)
      try {
        const driveStatus_ = await getGoogleDriveStatus();
        if (driveStatus_.configured && driveStatus_.connected) {
          driveStatus = "creating";
          const candidateFolderId = await ensureCandidateFolder(candidateName);

          // Update candidate with Drive folder ID
          const { error: candUpdateError } = await admin
            .from("candidates")
            .update({ google_drive_folder_id: candidateFolderId })
            .eq(databaseId === String(existing.ID) ? "ID" : "id", databaseId);

          if (candUpdateError) {
            driveError = `Drive folder created but record failed: ${candUpdateError.message}`;
          } else {
            driveStatus = "created";
          }
        }
      } catch (driveErr) {
        const driveErrorMsg = driveErr instanceof Error ? driveErr.message : "unknown error";
        console.error("[linkedin-import-drive]", driveErrorMsg);
        driveError = driveErrorMsg;
        driveStatus = "failed";
      }

      return NextResponse.json({ candidate: result.data, created: false, resumeParsed: Boolean(parsedResume), driveStatus, driveError: driveError || undefined, persistence: "Existing candidate updated; external profile data is matched by stored LinkedIn URL when available." }, { headers: corsHeaders });
    }

    const candidateId = await allocateCandidateNumber(admin);
    const { data: candidate, error: insertError } = await admin.from("candidates").insert({ candidate_id: candidateId, ...nonEmptyValues, status: "new" }).select("*").single();
    if (insertError) throw new Error(insertError.message);

    // Attempt to create Drive folder (non-blocking)
    try {
      const driveStatus_ = await getGoogleDriveStatus();
      if (driveStatus_.configured && driveStatus_.connected) {
        driveStatus = "creating";
        const candidateFolderId = await ensureCandidateFolder(candidateName);

        // Update candidate with Drive folder ID
        const { error: candUpdateError } = await admin
          .from("candidates")
          .update({ google_drive_folder_id: candidateFolderId })
          .eq("id", String(candidate.id || candidate.ID || ""));

        if (candUpdateError) {
          driveError = `Drive folder created but record failed: ${candUpdateError.message}`;
        } else {
          driveStatus = "created";
        }
      }
    } catch (driveErr) {
      const driveErrorMsg = driveErr instanceof Error ? driveErr.message : "unknown error";
      console.error("[linkedin-import-drive]", driveErrorMsg);
      driveError = driveErrorMsg;
      driveStatus = "failed";
    }

    return NextResponse.json({ candidate, created: true, resumeParsed: Boolean(parsedResume), driveStatus, driveError: driveError || undefined, persistence: "Candidate created with the existing schema; user-provided LinkedIn URL is stored for future matching." }, { status: 201, headers: corsHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to import candidate.";
    const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" || message === "PROFILE_UNAVAILABLE" ? 403 : message.startsWith("CONFIGURATION:") ? 503 : 500;
    return NextResponse.json({ error: message.replace(/^CONFIGURATION: /, "") }, { status, headers: corsHeaders });
  }
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

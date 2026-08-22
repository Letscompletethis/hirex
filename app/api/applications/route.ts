import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { allocateJobCandidateNumber } from "../../../lib/job-candidate-number";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error("Missing Supabase environment variables.");
}

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

type CandidateRecord = {
  ID?: string;
  id?: string;
  candidate_id?: string | null;
  resume_path?: string | null;
};

function getDatabaseId(candidate: CandidateRecord) {
  return candidate.ID || candidate.id || "";
}

function createCandidateId() {
  const number = Math.floor(Math.random() * 100000);
  return `HX-CAN-${String(number).padStart(5, "0")}`;
}

async function createAvailableCandidateId() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidateId = createCandidateId();
    const { data, error } = await supabaseAdmin
      .from("candidates")
      .select("*")
      .eq("candidate_id", candidateId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return candidateId;
    }
  }

  throw new Error("Unable to allocate a candidate number.");
}

export async function POST(request: NextRequest) {
  let uploadedResumePath = "";
  let createdCandidateId = "";
  let createdApplicationId = "";

  try {
    const formData = await request.formData();
    const jobId = String(formData.get("jobId") || "").trim();
    const firstName = String(formData.get("firstName") || "").trim();
    const lastName = String(formData.get("lastName") || "").trim();
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const phone = String(formData.get("phone") || "").trim();
    const currentJobTitle = String(formData.get("currentJobTitle") || "").trim();
    const resume = formData.get("resume");

    if (!jobId || !firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        { error: "All required application fields must be provided." },
        { status: 400 }
      );
    }

    if (!(resume instanceof File) || resume.size === 0) {
      return NextResponse.json(
        { error: "Please upload your resume." },
        { status: 400 }
      );
    }

    if (resume.type !== "application/pdf" || resume.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Resume must be a PDF smaller than 10 MB." },
        { status: 400 }
      );
    }

    const { data: job, error: jobError } = await supabaseAdmin
      .from("jobs")
      .select("id,title,status")
      .eq("id", jobId)
      .eq("status", "published")
      .maybeSingle();

    if (jobError) {
      throw new Error(jobError.message);
    }

    if (!job) {
      return NextResponse.json(
        { error: "This job is no longer available." },
        { status: 404 }
      );
    }

    const { data: matchingCandidates, error: candidateLookupError } =
      await supabaseAdmin
        .from("candidates")
        .select("*")
        .ilike("email", email);

    if (candidateLookupError) {
      throw new Error(candidateLookupError.message);
    }

    const existingCandidates = (matchingCandidates || []) as CandidateRecord[];
    const existingCandidateIds = existingCandidates
      .map(getDatabaseId)
      .filter(Boolean);

    if (existingCandidateIds.length > 0) {
      const { data: existingApplications, error: applicationLookupError } =
        await supabaseAdmin
          .from("applications")
          .select("id")
          .in("candidate_id", existingCandidateIds)
          .eq("job_id", job.id)
          .limit(1);

      if (applicationLookupError) {
        throw new Error(applicationLookupError.message);
      }

      if (existingApplications && existingApplications.length > 0) {
        return NextResponse.json(
          { error: "An application already exists for this email and job." },
          { status: 409 }
        );
      }
    }

    const existingCandidate = existingCandidates[0];
    let candidate = existingCandidate;

    if (!candidate) {
      const candidateId = await createAvailableCandidateId();
      const resumePath = `${candidateId}/${Date.now()}-${crypto.randomUUID()}.pdf`;
      uploadedResumePath = resumePath;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("resumes")
        .upload(resumePath, resume, {
          contentType: "application/pdf",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Resume upload failed: ${uploadError.message}`);
      }

      const { data: createdCandidate, error: candidateError } =
        await supabaseAdmin
          .from("candidates")
          .insert({
            candidate_id: candidateId,
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
            resume_path: resumePath,
            job_id: job.id,
            job_title: job.title,
            current_job_title: currentJobTitle || null,
            status: "new",
          })
          .select("*")
          .single();

      if (candidateError || !createdCandidate) {
        throw new Error(
          `Could not create candidate: ${candidateError?.message || "unknown error"}`
        );
      }

      candidate = createdCandidate as CandidateRecord;
      createdCandidateId = getDatabaseId(candidate);
    }

    const candidateDatabaseId = getDatabaseId(candidate);

    if (!candidateDatabaseId) {
      throw new Error("Candidate database ID is missing.");
    }

    const jobCandidateNumber = await allocateJobCandidateNumber(
      supabaseAdmin,
      job.id
    );

    const { data: createdApplication, error: applicationError } =
      await supabaseAdmin
        .from("applications")
        .insert({
          candidate_id: candidateDatabaseId,
          job_id: job.id,
          status: "new",
          job_candidate_number: jobCandidateNumber,
        })
        .select("id")
        .single();

    if (applicationError || !createdApplication) {
      throw new Error(
        `Could not create application: ${applicationError?.message || "unknown error"}`
      );
    }

    createdApplicationId = createdApplication.id;

    return NextResponse.json({
      candidateId: candidate.candidate_id || null,
      applicationId: createdApplicationId,
      jobCandidateNumber,
    });
  } catch (error) {
    if (createdApplicationId) {
      await supabaseAdmin
        .from("applications")
        .delete()
        .eq("id", createdApplicationId);
    }

    if (createdCandidateId) {
      const candidateDelete = await supabaseAdmin
        .from("candidates")
        .delete()
        .eq("ID", createdCandidateId);

      if (candidateDelete.error) {
        await supabaseAdmin
          .from("candidates")
          .delete()
          .eq("id", createdCandidateId);
      }
    }

    if (uploadedResumePath) {
      await supabaseAdmin.storage
        .from("resumes")
        .remove([uploadedResumePath]);
    }

    console.error("Application creation error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to submit application.",
      },
      { status: 500 }
    );
  }
}

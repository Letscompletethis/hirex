import { NextRequest, NextResponse } from "next/server";
import { GoogleDriveConfigurationError, uploadCandidateFile } from "../../../../../lib/google-drive";
import { getServiceRoleClient, requireBearerUser } from "../../../../../lib/integration-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await requireBearerUser(request);
    const formData = await request.formData();
    const candidateId = String(formData.get("candidateId") || "").trim();
    const file = formData.get("file");
    const refreshToken = request.headers.get("x-google-drive-refresh-token") || undefined;
    if (!candidateId || !(file instanceof File) || file.size === 0) return NextResponse.json({ error: "candidateId and a non-empty file are required." }, { status: 400 });

    const admin = getServiceRoleClient();
    const candidateLookup = await admin
      .from("candidates")
      .select("ID,id,candidate_id,google_drive_folder_id")
      .or(`ID.eq.${candidateId},id.eq.${candidateId},candidate_id.eq.${candidateId}`)
      .limit(1)
      .maybeSingle();

    if (candidateLookup.error) throw new Error(candidateLookup.error.message);
    if (!candidateLookup.data) return NextResponse.json({ error: "Candidate was not found." }, { status: 404 });

    const databaseCandidateId = String(
      candidateLookup.data.ID || candidateLookup.data.id || candidateLookup.data.candidate_id
    );
    const existingDocument = await admin
      .from("candidate_documents")
      .select("id,file_name,drive_file_id,drive_folder_id,mime_type,web_view_link,created_at,updated_at")
      .eq("candidate_id", databaseCandidateId)
      .eq("file_name", file.name)
      .limit(1)
      .maybeSingle();

    if (existingDocument.error) throw new Error(existingDocument.error.message);
    if (existingDocument.data) {
      return NextResponse.json({
        ...existingDocument.data,
        duplicate: true,
        persistence: "Existing HireX candidate document relationship returned.",
      });
    }

    const result = await uploadCandidateFile({ candidateId, file, refreshToken });
    const folderUpdate = await admin
      .from("candidates")
      .update({ google_drive_folder_id: result.candidateFolderId })
      .or(`ID.eq.${databaseCandidateId},id.eq.${databaseCandidateId}`);

    if (folderUpdate.error) throw new Error(folderUpdate.error.message);

    const documentInsert = await admin.from("candidate_documents").insert({
      candidate_id: databaseCandidateId,
      file_name: result.file.name,
      drive_file_id: result.file.id,
      drive_folder_id: result.candidateFolderId,
      mime_type: result.file.mimeType,
      web_view_link: result.file.webViewLink || null,
    }).select("*").single();

    if (documentInsert.error) throw new Error(documentInsert.error.message);

    return NextResponse.json({
      ...result,
      document: documentInsert.data,
      persistence: "Drive folder and file relationships persisted in HireX.",
    });
  } catch (error) {
    const message = error instanceof GoogleDriveConfigurationError ? error.message : error instanceof Error ? error.message : "Unable to upload to Google Drive.";
    const status = message === "UNAUTHORIZED" ? 401 : error instanceof GoogleDriveConfigurationError ? 503 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
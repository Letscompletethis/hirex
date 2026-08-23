import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient, requireBearerUser } from "../../../../../lib/integration-auth";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ candidateId: string }> }
) {
  try {
    await requireBearerUser(request);
    const { candidateId } = await params;
    const admin = getServiceRoleClient();
    const { data, error } = await admin
      .from("candidate_resume_versions")
      .select("id,candidate_id,file_name,storage_path,drive_file_id,drive_folder_id,mime_type,is_current,uploaded_at,created_at")
      .eq("candidate_id", candidateId)
      .order("uploaded_at", { ascending: false });
    if (error) throw new Error(error.message);
    return NextResponse.json({ versions: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load resume history.";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 500 });
  }
}

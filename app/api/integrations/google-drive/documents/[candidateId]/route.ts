import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient, requireBearerUser } from "../../../../../../lib/integration-auth";

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
      .from("candidate_documents")
      .select("id,candidate_id,file_name,drive_file_id,drive_folder_id,mime_type,web_view_link,created_at,updated_at")
      .eq("candidate_id", candidateId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return NextResponse.json({ documents: data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load candidate documents.";
    return NextResponse.json(
      { error: message },
      { status: message === "UNAUTHORIZED" ? 401 : 500 }
    );
  }
}

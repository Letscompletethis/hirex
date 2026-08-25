import { NextRequest, NextResponse } from "next/server";
import { ResumeParseError, parseResumeFile } from "../../../lib/server-resume-parser";
import { requireAuthorizedHireXUser } from "../../../lib/server-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await requireAuthorizedHireXUser(request);
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "A non-empty PDF file is required." }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Resume files must be 10 MB or smaller." }, { status: 413 });
    const parsed = await parseResumeFile(file);
    return NextResponse.json({ parsed, parser: parsed.parser || "fallback" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not parse resume.";
    const status = message === "UNAUTHORIZED" ? 401 : message === "PROFILE_UNAVAILABLE" || message === "FORBIDDEN" ? 403 : error instanceof ResumeParseError ? 422 : 500;
    return NextResponse.json({ error: message, code: error instanceof ResumeParseError ? error.code : undefined }, { status });
  }
}

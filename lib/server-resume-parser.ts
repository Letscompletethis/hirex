import { PDFParse } from "pdf-parse";
import { getData } from "pdf-parse/worker";
import { extractResumeText, type ParsedResume } from "./resume-text-extraction";
import { parseWithConfiguredLeverParser } from "./resume-parser";

PDFParse.setWorker(getData());

export class ResumeParseError extends Error {
  constructor(message: string, public readonly code: "OCR_REQUIRED" | "UNSUPPORTED" | "PARSE_FAILED") { super(message); }
}

export async function parseResumeFile(file: File): Promise<ParsedResume> {
  const fileName = file.name.toLowerCase();
  const isPdf = file.type === "application/pdf" || fileName.endsWith(".pdf");
  const isDocx = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || fileName.endsWith(".docx");
  const isText = file.type.startsWith("text/") || /\.(txt|md|rtf)$/.test(fileName);
  if (!isPdf && !isDocx && !isText) throw new ResumeParseError("Only PDF, DOCX, and text resume files are supported.", "UNSUPPORTED");

  if (process.env.LEVERPARSER_URL) {
    try {
      const parsed = await parseWithConfiguredLeverParser(file);
      if (parsed) return parsed;
    } catch (error) {
      console.warn("Configured LeverParser failed; using local extraction.", error instanceof Error ? error.message : error);
    }
  }

  let text = "";
  let parser: PDFParse | null = null;
  try {
    if (isPdf) {
      parser = new PDFParse({ data: new Uint8Array(await file.arrayBuffer()) });
      text = (await parser.getText()).text;
    } else if (isDocx) {
      const mammoth = await import("mammoth");
      text = (await mammoth.extractRawText({ buffer: Buffer.from(await file.arrayBuffer()) })).value;
    } else text = await file.text();
  } catch {
    throw new ResumeParseError("The resume could not be read.", "PARSE_FAILED");
  } finally { await parser?.destroy(); }

  if (!text.trim()) {
    throw new ResumeParseError(isPdf ? "This PDF contains no extractable text and likely requires OCR." : "The resume contains no extractable text.", isPdf ? "OCR_REQUIRED" : "PARSE_FAILED");
  }
  try { return extractResumeText(text); }
  catch { throw new ResumeParseError("The resume text could not be converted into candidate fields.", "PARSE_FAILED"); }
}

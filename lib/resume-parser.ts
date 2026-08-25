import type { ParsedResume } from "./resume-text-extraction";

type LeverParserResponse = {
  contact_info?: { name?: string | null; email?: string | null; phone?: string | null; linkedin?: string | null; address?: string | null };
  summary?: string | null;
  experience?: Array<{ title?: string | null; company?: string | null; start_date?: string | null; end_date?: string | null; current?: boolean; description?: string | null; responsibilities?: string[]; location?: string | null }>;
  education?: Array<{ degree?: string | null; institution?: string | null; graduation_date?: string | null; major?: string | null }>;
  skills?: Array<{ name?: string | null; category?: string | null }>;
  certifications?: Array<Record<string, unknown>>;
  languages?: string[];
  projects?: Array<Record<string, unknown>>;
  confidence_scores?: Record<string, number>;
  extraction_metadata?: { overall_confidence?: number };
};

function splitName(fullName: string | null | undefined) {
  const parts = (fullName || "").trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || null, lastName: parts.slice(1).join(" ") || null };
}

export function mapLeverParserResult(result: LeverParserResponse): ParsedResume {
  const contact = result.contact_info || {};
  const experiences = result.experience || [];
  const current = experiences.find((item) => item.current || /present|current/i.test(String(item.end_date || ""))) || experiences[0];
  const fullName = contact.name || null;
  const { firstName, lastName } = splitName(fullName);
  return {
    name: fullName,
    fullName,
    firstName,
    lastName,
    email: contact.email || null,
    phone: contact.phone || null,
    linkedinUrl: contact.linkedin || null,
    linkedin: contact.linkedin || null,
    location: contact.address || current?.location || null,
    currentJobTitle: current?.title || null,
    currentCompany: current?.company || null,
    experience: experiences.map((item) => ({ title: item.title || null, company: item.company || null, startDate: item.start_date || null, endDate: item.end_date || null, current: Boolean(item.current), description: item.description || null, responsibilities: item.responsibilities || [], location: item.location || null })),
    skills: (result.skills || []).map((item) => item.name).filter((item): item is string => Boolean(item)),
    degree: result.education?.[0]?.degree || null,
    institution: result.education?.[0]?.institution || null,
    graduationInformation: result.education?.[0]?.graduation_date || null,
    summary: result.summary || null,
    education: result.education || [],
    certifications: result.certifications || [],
    languages: result.languages || [],
    projects: result.projects || [],
    confidence: { overall: result.extraction_metadata?.overall_confidence ?? null, sections: result.confidence_scores || {} },
    parser: "leverparser",
  };
}

export async function parseWithConfiguredLeverParser(file: File) {
  const endpoint = process.env.LEVERPARSER_URL;
  if (!endpoint) return null;
  const body = new FormData();
  body.append("file", file, file.name);
  const response = await fetch(endpoint, { method: "POST", body, signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`LeverParser service returned HTTP ${response.status}.`);
  return mapLeverParserResult(await response.json() as LeverParserResponse);
}

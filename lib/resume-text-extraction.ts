export type ParsedResume = {
  name: string | null;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  linkedin: string | null;
  location: string | null;
  currentJobTitle: string | null;
  currentCompany: string | null;
  experience: string | Array<{ title: string | null; company: string | null; startDate: string | null; endDate: string | null; current: boolean; description: string | null; responsibilities: string[]; location: string | null }> | null;
  skills: string[];
  degree: string | null;
  institution: string | null;
  graduationInformation: string | null;
  summary?: string | null;
  education?: Array<Record<string, unknown>>;
  certifications?: Array<Record<string, unknown>>;
  languages?: string[];
  projects?: Array<Record<string, unknown>>;
  confidence?: { overall: number | null; sections: Record<string, number> };
  parser?: "leverparser" | "fallback";
};

export async function extractResumeFile(file: File) {
  const name = file.name.toLowerCase();
  const isTextFile = file.type.startsWith("text/") || /\.(txt|md|rtf)$/.test(name);
  const isDocxFile = file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || name.endsWith(".docx");

  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    return extractPdfText(await file.arrayBuffer());
  }

  if (!isTextFile && !isDocxFile) {
    throw new Error("Unsupported format: legacy DOC files are not supported. Use PDF, DOCX, or text.");
  }

  return extractResumeFileThroughApi(file);
}

async function extractResumeFileThroughApi(file: File) {
  const formData = new FormData();
  formData.append("file", file, file.name);
  const response = await fetch("/api/parse-resume", { method: "POST", body: formData, headers: await resumeAuthHeaders() });
  const result = await response.json() as { text?: string; parsed?: ParsedResume; error?: string };
  if (!response.ok || (!result.text && !result.parsed)) throw new Error(result.error || "Could not parse resume.");
  return result.parsed || extractResumeText(result.text || "");
}

async function extractPdfText(data: ArrayBuffer) {
  const formData = new FormData();
  formData.append("file", new File([data], "resume.pdf", { type: "application/pdf" }));
  const response = await fetch("/api/parse-resume", { method: "POST", body: formData, headers: await resumeAuthHeaders() });
  const result = await response.json() as { text?: string; parsed?: ParsedResume; error?: string };
  if (!response.ok || (!result.text && !result.parsed)) {
    throw new Error(result.error || "Could not extract PDF text.");
  }
  if (process.env.NODE_ENV !== "production" && process.env.DEBUG_RESUME_PARSING === "true") {
    console.info("[resume-debug] browser received fields:", Object.keys(result.parsed || {}).join(", "));
    console.info("[resume-debug] browser consumed fields: name, email, phone, currentJobTitle");
  }
  return result.parsed || extractResumeText(result.text || "");
}

function labelledValue(lines: string[], labels: string[]) {
  const pattern = new RegExp(`^(?:${labels.join("|")})\\s*[:\\-]\\s*(.+)$`, "i");
  const line = lines.find((item) => pattern.test(item));
  return line?.match(pattern)?.[1]?.trim() || null;
}

function cleanResumeLines(text: string) {
  return text
    .replace(/\r/g, "")
    .split(/\n+/)
    .map((line) => line.replace(/^\s*[-*\u2022]\s*/, "").replace(/\s+/g, " ").trim())
    .filter((line) => line && !/^--\s*\d+\s+of\s+\d+\s*--$/i.test(line));
}

function inferredHeader(lines: string[]) {
  const contactIndex = lines.findIndex((line) => /@|linkedin\.com|(?:\+?\d[\d\s().-]{7,}\d)/i.test(line));
  const header = lines.slice(0, contactIndex >= 0 ? contactIndex + 1 : 8);
  const namePattern = /^[A-Za-z][A-Za-z.'-]*(?:\s+[A-Za-z][A-Za-z.'-]*){0,3}$/;
  const excludedName = /^(resume(?:\/cv)?|curriculum vitae|cv|email|phone|mobile|linkedin|github|address|experience|education|skills|projects|certifications?|summary|profile|objective|professional summary|work experience|technical skills|(?:bachelor|master|diploma|b\.?tech|m\.?tech|mba|mca)(?:\s+in)?\b)/i;
  const pipeHeader = header.find((line) => line.includes("|"));
  if (pipeHeader) {
    const [name, title] = pipeHeader.split("|").map((part) => part.trim());
    if (namePattern.test(name) && !excludedName.test(name) && title) return { name, title };
  }
  const nameIndex = header.findIndex((line) => namePattern.test(line) && !excludedName.test(line));
  const name = nameIndex >= 0 ? header[nameIndex] : null;
  const title = nameIndex >= 0
    ? header.slice(nameIndex + 1).find((line) => line.length <= 100 && !/:/.test(line) && !/@/.test(line) && !/^\+?[\d\s().-]+$/.test(line) && !/^(resume|curriculum vitae|cv|profile|summary|experience|education|skills|projects|contact)$/i.test(line)) || null
    : null;
  return { name, title };
}

function splitName(name: string | null) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || null,
    lastName: parts.length > 1 ? parts.slice(1).join(" ") : null,
  };
}

function findPhone(lines: string[], content: string) {
  const labelled = labelledValue(lines, ["phone", "mobile", "contact", "tel", "telephone"]);
  const candidates = `${labelled || ""} ${content}`.match(/(?:\+?\d[\d\s().-]{8,}\d)/g) || [];
  return candidates
    .map((value) => value.trim())
    .find((value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 15 && !/^\d{4}[\s./-]\d{1,2}[\s./-]\d{1,2}$/.test(value) && !/^\d{4}$/.test(value);
    }) || null;
}

function findCurrentEmployment(lines: string[]) {
  const start = lines.findIndex((line) => /^(professional )?(experience|work experience|employment history)$/i.test(line));
  if (start < 0) return { title: null, company: null, experience: null };
  const employment = lines.slice(start + 1, start + 16);
  const dateIndex = employment.findIndex((line) => /\b(?:19|20)\d{2}\b/.test(line) || /present|current/i.test(line));
  if (dateIndex < 0) return { title: null, company: null, experience: employment.slice(0, 5).join(" ") || null };
  const preceding = employment.slice(Math.max(0, dateIndex - 2), dateIndex).filter((line) => line.length <= 100 && !/^[•*-]/.test(line));
  const titlePattern = /\b(engineer|developer|designer|manager|director|officer|analyst|specialist|consultant|recruiter|architect|lead|coordinator|executive|administrator|scientist|accountant|nurse|teacher)\b/i;
  const title = preceding.find((line) => titlePattern.test(line)) || preceding[0] || null;
  return {
    title,
    company: preceding.find((line) => line !== title) || null,
    experience: employment.slice(0, Math.min(employment.length, 8)).join(" ") || null,
  };
}

export function extractResumeText(text: string): ParsedResume {
  if (!text.trim()) throw new Error("Resume text is empty.");

  const lines = cleanResumeLines(text);
  const content = lines.join(" ");
  const emailCandidates = content.replace(/\s*(?=@|\.)\s*/g, "").match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [];
  const email = emailCandidates.find((value) => !/^(info|hello|contact|careers|jobs|admin|noreply)@/i.test(value))?.toLowerCase() || emailCandidates[0]?.toLowerCase() || null;
  const phone = findPhone(lines, content);
  const header = inferredHeader(lines);
  const name = labelledValue(lines, ["name", "full name", "candidate name"]) || header.name;
  const { firstName, lastName } = splitName(name);
  const employment = findCurrentEmployment(lines);
  const currentJobTitle = labelledValue(lines, ["current title", "professional title", "job title", "designation", "current role", "current job title", "professional headline", "headline"]) || employment.title || header.title;
  const linkedinUrl = content.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[\w/-]+/i)?.[0] || null;
  const location = labelledValue(lines, ["location", "address", "based in"]);
  const degree = lines.find((line) => /\b(bachelor|master|mba|mca|ph\.?d|doctorate|diploma|b\.?tech|m\.?tech)\b/i.test(line)) || null;
  const institution = degree ? lines[lines.indexOf(degree) + 1] || null : null;
  const graduationInformation = lines.find((line) => /graduat|class of|\b(?:19|20)\d{2}\b/i.test(line)) || null;
  const skillsLine = lines.find((line) => /^skills?(?:\s*&\s*technologies)?\s*:/i.test(line));
  const skills = skillsLine ? skillsLine.replace(/^skills?(?:\s*&\s*technologies)?\s*:\s*/i, "").split(/[,|;]/).map((item) => item.trim()).filter(Boolean) : [];

  return {
    name,
    fullName: name,
    firstName,
    lastName,
    email,
    phone,
    linkedinUrl,
    linkedin: linkedinUrl,
    location,
    currentJobTitle,
    currentCompany: employment.company,
    experience: employment.experience,
    skills,
    degree,
    institution,
    graduationInformation,
    summary: null,
    education: degree ? [{ degree, institution, graduationInformation }] : [],
    certifications: [],
    languages: [],
    projects: [],
    confidence: { overall: null, sections: {} },
    parser: "fallback",
  };
}

async function resumeAuthHeaders() {
  const { supabase } = await import("./supabase");
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("Your recruiter session has expired.");
  return { Authorization: `Bearer ${session.access_token}` };
}

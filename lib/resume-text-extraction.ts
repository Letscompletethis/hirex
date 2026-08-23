export type ParsedResume = {
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  skills: string[];
};

export async function extractResumeFile(file: File) {
  const name = file.name.toLowerCase();
  const isTextFile = file.type.startsWith("text/") || /\.(txt|md|rtf)$/.test(name);

  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    return extractPdfText(await file.arrayBuffer());
  }

  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    const mammoth = await import("mammoth/mammoth.browser");
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return extractResumeText(result.value);
  }

  if (!isTextFile) {
    throw new Error("Unsupported format: legacy DOC files are not supported. Use PDF, DOCX, or text.");
  }

  return extractResumeText(await file.text());
}

async function extractPdfText(data: ArrayBuffer) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const document = await pdfjs.getDocument({
    data: new Uint8Array(data),
  }).promise;
  const pages: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(
      content.items
        .map((item) => ("str" in item ? item.str : ""))
        .filter(Boolean)
        .join(" ")
    );
  }

  return extractResumeText(pages.join("\n"));
}

function labelledValue(lines: string[], labels: string[]) {
  const pattern = new RegExp(`^(?:${labels.join("|")})\\s*[:\\-]\\s*(.+)$`, "i");
  const line = lines.find((item) => pattern.test(item));
  return line?.match(pattern)?.[1]?.trim() || null;
}

export function extractResumeText(text: string): ParsedResume {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/^\s*[-*\u2022]\s*/, "").trim())
    .filter(Boolean);
  const content = lines.join(" ");
  const email = content.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || null;
  const phone = content.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim() || null;
  const skillsValue = labelledValue(lines, ["skills", "technical skills", "core skills"]);
  const skills = skillsValue
    ? skillsValue
        .split(/[,;|]/)
        .map((skill) => skill.trim())
        .filter((skill) => skill.length > 1 && skill.length < 50)
        .slice(0, 20)
    : [];

  return {
    name: labelledValue(lines, ["name", "full name"]),
    email,
    phone,
    location: labelledValue(lines, ["location", "address", "city"]),
    skills,
  };
}
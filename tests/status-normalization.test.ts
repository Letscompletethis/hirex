import assert from "node:assert/strict";
import test from "node:test";
import { isSubmittedApplicationStatus, normalizeStatus, normalizeApplicationStatus, normalizeStoredApplicationStatus } from "../lib/statuses.ts";
import { extractResumeText } from "../lib/resume-text-extraction.ts";
import { mapLeverParserResult } from "../lib/resume-parser.ts";

test("normalizes start and offer aliases", () => {
  assert.equal(normalizeStatus("start"), "start");
  assert.equal(normalizeStatus(" starts "), "start");
  assert.equal(normalizeStatus("START"), "start");
  assert.equal(normalizeStatus("offer"), "offer");
  assert.equal(normalizeStatus(" Offers "), "offer");
  assert.equal(normalizeStatus("OFFER"), "offer");
});

test("counts legacy aliases as one canonical dashboard category", () => {
  const statuses = ["start", "starts", "offer", "offers"];
  const normalized = statuses.map(normalizeApplicationStatus);

  assert.equal(normalized.filter((status) => status === "start").length, 2);
  assert.equal(normalized.filter((status) => status === "offer").length, 2);
  assert.equal(normalized.includes("starts" as never), false);
  assert.equal(normalized.includes("offers" as never), false);
});

test("keeps viewed applications out of submissions", () => {
  assert.equal(normalizeStoredApplicationStatus("starts"), "start");
  assert.equal(normalizeStoredApplicationStatus("offers"), "offer");
  assert.equal(normalizeStoredApplicationStatus("viewed"), "viewed");
  assert.equal(isSubmittedApplicationStatus("submission"), true);
  assert.equal(isSubmittedApplicationStatus("new"), false);
  assert.equal(isSubmittedApplicationStatus("viewed"), false);
});

test("extracts reliable resume fields without inventing missing data", () => {
  const parsed = extractResumeText(
    "Jane Doe\nEmail: jane@example.com\nPhone: +1 555 123 4567\nProfessional Title: Senior Engineer"
  );

  assert.equal(parsed.email, "jane@example.com");
  assert.equal(parsed.phone, "+1 555 123 4567");
  assert.equal(parsed.currentJobTitle, "Senior Engineer");
  assert.throws(() => extractResumeText(""), /empty/i);
});

test("extracts name and title from common resume headers", () => {
  const parsed = extractResumeText("John Smith\nSenior Software Engineer\njohn@example.com\n+1 555 123 4567");
  assert.equal(parsed.name, "John Smith");
  assert.equal(parsed.firstName, "John");
  assert.equal(parsed.lastName, "Smith");
  assert.equal(parsed.email, "john@example.com");
  assert.equal(parsed.phone, "+1 555 123 4567");
  assert.equal(parsed.currentJobTitle, "Senior Software Engineer");
  assert.equal(extractResumeText("John Smith | Senior Software Engineer\nEmail: john@example.com").name, "John Smith");
  assert.equal(extractResumeText("John Smith | Senior Software Engineer\nEmail: john@example.com").currentJobTitle, "Senior Software Engineer");
});

test("prefers the current role in an employment history block", () => {
  const parsed = extractResumeText(
    "Maya Singh\nmaya@example.com\nExperience\nSenior Developer\nAcme Labs\n2022 - Present\nDeveloper\nOld Systems\n2019 - 2022\nSkills: TypeScript, SQL"
  );

  assert.equal(parsed.currentJobTitle, "Senior Developer");
  assert.equal(parsed.currentCompany, "Acme Labs");
  assert.deepEqual(parsed.skills, ["TypeScript", "SQL"]);
});

test("leaves optional fields blank when resume text does not support them", () => {
  const parsed = extractResumeText("AMIR\nEmail: amir@example.com\nPhone: 9999999999");

  assert.equal(parsed.firstName, "AMIR");
  assert.equal(parsed.lastName, null);
  assert.equal(parsed.linkedinUrl, null);
  assert.equal(parsed.degree, null);
  assert.equal(parsed.currentJobTitle, null);
});

test("maps LeverParser output into the canonical HireX contract", () => {
  const parsed = mapLeverParserResult({
    contact_info: { name: "Riley Chen", email: "riley@example.com", phone: "+1 555 010 2020", linkedin: "https://linkedin.com/in/riley-chen", address: "Austin, TX" },
    experience: [{ title: "Staff Engineer", company: "Northstar", start_date: "2023-01", end_date: "Present", current: true }],
    education: [{ degree: "B.S. Computer Science", institution: "State University", graduation_date: "2022" }],
    skills: [{ name: "TypeScript" }],
    confidence_scores: { contact_info: 1, experience: 0.9 },
    extraction_metadata: { overall_confidence: 0.95 },
  });

  assert.equal(parsed.fullName, "Riley Chen");
  assert.equal(parsed.firstName, "Riley");
  assert.equal(parsed.lastName, "Chen");
  assert.equal(parsed.linkedin, "https://linkedin.com/in/riley-chen");
  assert.equal(parsed.currentJobTitle, "Staff Engineer");
  assert.equal(parsed.currentCompany, "Northstar");
  assert.equal(parsed.confidence?.overall, 0.95);
});

test("extracts names and emails without mistaking education for a name", () => {
  const cases = [
    ["AMIR\nDiploma in Computer Applications\nEmail: amir@example.com\nPhone: 9999999999", "AMIR", "amir@example.com"],
    ["John Smith\nSenior Software Engineer\njohn.smith@gmail.com\n+1 555 123 4567", "John Smith", "john.smith@gmail.com"],
    ["Name: Priya Sharma\nDesignation: HR Manager\npriya.sharma@company.com", "Priya Sharma", "priya.sharma@company.com"],
    ["Jane Doe | Product Designer\njane.doe@gmail.com", "Jane Doe", "jane.doe@gmail.com"],
    ["DIPLOMA IN COMPUTER APPLICATIONS\nEducation\nExperience\nEmail: test@example.com", null, "test@example.com"],
  ] as const;

  for (const [text, expectedName, expectedEmail] of cases) {
    const parsed = extractResumeText(text);
    assert.equal(parsed.name, expectedName);
    assert.equal(parsed.email, expectedEmail);
  }
});

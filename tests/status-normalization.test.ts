import assert from "node:assert/strict";
import test from "node:test";
import { normalizeStatus, normalizeApplicationStatus } from "../lib/statuses.ts";
import { extractResumeText } from "../lib/resume-text-extraction.ts";

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

test("extracts reliable resume fields without inventing missing data", () => {
  const parsed = extractResumeText(
    "Jane Doe\nEmail: jane@example.com\nPhone: +1 555 123 4567\nLocation: Pune\nSkills: TypeScript, React"
  );

  assert.equal(parsed.email, "jane@example.com");
  assert.equal(parsed.phone, "+1 555 123 4567");
  assert.equal(parsed.location, "Pune");
  assert.deepEqual(parsed.skills, ["TypeScript", "React"]);
  assert.throws(() => extractResumeText(""), /empty/i);
});

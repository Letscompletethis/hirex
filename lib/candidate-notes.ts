export type CandidateNote = {
  id: string;
  text: string;
  author: string;
  createdAt: string;
};

const NOTES_PREFIX = "HIREX_NOTES_V1:";

export function parseCandidateNotes(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  if (!value.startsWith(NOTES_PREFIX)) {
    return [
      {
        id: "legacy-note",
        text: value,
        author: "HireX",
        createdAt: "",
      },
    ];
  }

  try {
    const parsed = JSON.parse(value.slice(NOTES_PREFIX.length));
    return Array.isArray(parsed) ? (parsed as CandidateNote[]) : [];
  } catch {
    return [];
  }
}

export function serializeCandidateNotes(notes: CandidateNote[]) {
  return `${NOTES_PREFIX}${JSON.stringify(notes)}`;
}

"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Check,
  X,
  FileText,
  BriefcaseBusiness,
  Filter,
  Users,
  Loader2,
  ArrowLeft,
  Mail,
  Phone,
  ExternalLink,
  User,
  Upload,
  History,
  StickyNote,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { allocateJobCandidateNumber } from "../../../lib/job-candidate-number";
import { allocateCandidateNumber } from "../../../lib/candidate-number";
import {
  parseCandidateNotes,
  serializeCandidateNotes,
  type CandidateNote,
} from "../../../lib/candidate-notes";
import {
  APPLICATION_STATUSES,
  formatApplicationStatus,
} from "../../../lib/statuses";
import { extractResumeFile, type ParsedResume } from "../../../lib/resume-text-extraction";

type Candidate = {
  ID?: string;
  id?: string;
  candidate_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  resume_path: string | null;
  job_id: string | null;
  job_title: string | null;
  status: string | null;
  created_at: string | null;
  current_job_title: string | null;
  notes: string | null;
  viewed_at?: string | null;
  candidate_number?: number | null;
};

type Job = {
  id: string;
  job_id?: string | null;
  title: string;
  company?: string | null;
  status?: string | null;
};

type CandidateApplication = {
  id: string;
  candidate_id: string;
  job_id: string | null;
  applied_at: string | null;
  recruiter_id: string | null;
  status: string | null;
};

type UploadItem = {
  id: string;
  file: File;
  state: "ready" | "parsing" | "parsed" | "duplicate" | "updated" | "unsupported" | "failed" | "skipped";
  parsed?: ParsedResume;
  message?: string;
  candidateId?: string;
};

const PAGE_SIZE = 100;

const STATUS_OPTIONS = [
  "submission",
  "interview",
  "offer",
  "start",
  "rejected",
  "withdrawn",
  "hold",
];

export default function RecruiterCandidatesPage() {
  const router = useRouter();

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  const [loading, setLoading] = useState(true);
  const [changingStatus, setChangingStatus] = useState(false);
  const [bulkRecruiterId, setBulkRecruiterId] = useState("");
  const [bulkRecruiterSearch, setBulkRecruiterSearch] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [currentPage, setCurrentPage] = useState(1);

  const [sortColumn, setSortColumn] =
    useState<string>("created_at");

  const [sortDirection, setSortDirection] =
    useState<"asc" | "desc">("desc");

  const [assignJobId, setAssignJobId] = useState("");
  const [assignJobSearch, setAssignJobSearch] = useState("");
  const [recruiters, setRecruiters] = useState<
    { id: string; full_name: string | null; email: string | null }[]
  >([]);

  const [selectedCandidateIndex, setSelectedCandidateIndex] =
    useState<number | null>(null);

  const [resumeUrl, setResumeUrl] = useState("");
  const [noteText, setNoteText] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [applications, setApplications] = useState<CandidateApplication[]>([]);
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [processingUploads, setProcessingUploads] = useState(false);
  const [confirmingImports, setConfirmingImports] = useState(false);
  const [notesPanelOpen, setNotesPanelOpen] = useState(false);
  const [historyPanelOpen, setHistoryPanelOpen] = useState(false);

  async function loadCandidates() {
    setLoading(true);
    setError("");

    try {
      const candidatesRequest = await supabase
        .from("candidates")
        .select("*");

      if (candidatesRequest.error) {
        throw new Error(
          candidatesRequest.error.message ||
            "Could not load candidates."
        );
      }

      setCandidates(
        (candidatesRequest.data as Candidate[]) || []
      );

      const jobsRequest = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (jobsRequest.error) {
        throw new Error(
          jobsRequest.error.message ||
            "Could not load jobs."
        );
      }

      setJobs((jobsRequest.data as Job[]) || []);

      const applicationsRequest = await supabase
        .from("applications")
        .select("id,candidate_id,job_id,applied_at,recruiter_id,status");
      if (!applicationsRequest.error) {
        setApplications((applicationsRequest.data as CandidateApplication[]) || []);
      }

      const recruitersRequest = await supabase
        .from("profiles")
        .select("id,full_name,email")
        .in("role", ["owner", "admin", "recruiter"])
        .eq("status", "active")
        .order("full_name", { ascending: true });

      if (!recruitersRequest.error) {
        setRecruiters(recruitersRequest.data || []);
      }
    } catch (err) {
      console.error("Recruiter candidates error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Could not load candidate pool."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(loadCandidates);
  }, []);

  function getCandidateDbId(candidate: Candidate) {
    return candidate.ID || candidate.id || "";
  }

  const filteredCandidates = useMemo(() => {
    const searchValue = search
      .toLowerCase()
      .trim();

    const result = candidates.filter((candidate) => {
      if (
        statusFilter !== "all" &&
        (candidate.status || "new").toLowerCase() !==
          statusFilter.toLowerCase()
      ) {
        return false;
      }

      if (
        jobFilter !== "all" &&
        (candidate.job_id || "") !== jobFilter
      ) {
        return false;
      }

      if (!searchValue) {
        return true;
      }

      const searchable = [
        candidate.candidate_id,
        candidate.first_name,
        candidate.last_name,
        candidate.email,
        candidate.phone,
        candidate.current_job_title,
        candidate.job_title,
        candidate.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(searchValue);
    });

    result.sort((a, b) => {
      let aValue = "";
      let bValue = "";

      if (sortColumn === "name") {
        aValue =
          `${a.first_name || ""} ${a.last_name || ""}`.trim();

        bValue =
          `${b.first_name || ""} ${b.last_name || ""}`.trim();
      } else if (sortColumn === "candidate_id") {
        aValue = a.candidate_id || "";
        bValue = b.candidate_id || "";
      } else if (sortColumn === "current_job_title") {
        aValue = a.current_job_title || "";
        bValue = b.current_job_title || "";
      } else if (sortColumn === "job_title") {
        aValue = a.job_title || "";
        bValue = b.job_title || "";
      } else if (sortColumn === "status") {
        aValue = a.status || "";
        bValue = b.status || "";
      } else if (sortColumn === "created_at") {
        aValue = a.created_at || "";
        bValue = b.created_at || "";
      }

      const comparison = aValue
        .toLowerCase()
        .localeCompare(bValue.toLowerCase());

      return sortDirection === "asc"
        ? comparison
        : -comparison;
    });

    return result;
  }, [
    candidates,
    search,
    statusFilter,
    jobFilter,
    sortColumn,
    sortDirection,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredCandidates.length / PAGE_SIZE
    )
  );

  const safePage = Math.min(
    currentPage,
    totalPages
  );

  const pageStart =
    (safePage - 1) * PAGE_SIZE;

  const pageEnd = Math.min(
    pageStart + PAGE_SIZE,
    filteredCandidates.length
  );

  const visibleCandidates =
    filteredCandidates.slice(
      pageStart,
      pageEnd
    );

  useEffect(() => {
    void Promise.resolve().then(() => setCurrentPage(1));
  }, [
    search,
    statusFilter,
    jobFilter,
  ]);

  function toggleCandidate(candidate: Candidate) {
    const id = getCandidateDbId(candidate);

    if (!id) return;

    setSelectedIds((previous) =>
      previous.includes(id)
        ? previous.filter(
            (item) => item !== id
          )
        : [...previous, id]
    );
  }

  function toggleAllVisible() {
    const visibleIds = visibleCandidates
      .map(getCandidateDbId)
      .filter(Boolean);

    const allSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) =>
        selectedIds.includes(id)
      );

    if (allSelected) {
      setSelectedIds((previous) =>
        previous.filter(
          (id) =>
            !visibleIds.includes(id)
        )
      );
    } else {
      setSelectedIds((previous) =>
        Array.from(
          new Set([
            ...previous,
            ...visibleIds,
          ])
        )
      );
    }
  }

  function handleSort(column: string) {
    if (sortColumn === column) {
      setSortDirection(
        sortDirection === "asc"
          ? "desc"
          : "asc"
      );
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  const filteredBulkRecruiters = recruiters.filter((recruiter) => {
    const query = bulkRecruiterSearch.toLowerCase().trim();
    return !query || `${recruiter.full_name || ""} ${recruiter.email || ""}`.toLowerCase().includes(query);
  });

  function selectedCandidates() {
    return candidates.filter((candidate) => selectedIds.includes(getCandidateDbId(candidate)));
  }

  function handleUploadSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    setUploadItems((previous) => [
      ...previous,
      ...files.map((file) => ({ id: crypto.randomUUID(), file, state: "ready" as const })),
    ]);
    event.target.value = "";
  }

  async function uploadAndParseResumes() {
    const readyItems = uploadItems.filter((item) => item.state === "ready" || item.state === "failed" || item.state === "unsupported");
    if (!readyItems.length) return;
    setProcessingUploads(true);
    setError("");
    try {
      for (const item of readyItems) {
        setUploadItems((previous) => previous.map((current) => current.id === item.id ? { ...current, state: "parsing", message: undefined } : current));
        try {
          const parsed = await extractResumeFile(item.file);
          setUploadItems((previous) => previous.map((current) => current.id === item.id ? { ...current, state: "parsed", parsed } : current));
        } catch (err) {
          const message = err instanceof Error ? err.message : "Could not process this file.";
          const unsupported = message.startsWith("Unsupported format:");
          setUploadItems((previous) => previous.map((current) => current.id === item.id ? { ...current, state: unsupported ? "unsupported" : "failed", message } : current));
        }
      }
    } finally {
      setProcessingUploads(false);
    }
  }

  function updateUploadField(id: string, field: keyof ParsedResume, value: string) {
    setUploadItems((previous) => previous.map((item) => item.id === id && item.parsed
      ? { ...item, parsed: { ...item.parsed, [field]: field === "skills" ? value.split(",").map((skill) => skill.trim()).filter(Boolean) : value } }
      : item));
  }

  function skipUpload(id: string) {
    setUploadItems((previous) => previous.map((item) => item.id === id ? { ...item, state: "skipped" } : item));
  }

  async function retryUpload(item: UploadItem) {
    setUploadItems((previous) => previous.map((current) => current.id === item.id ? { ...current, state: "parsing", message: undefined } : current));
    try {
      const parsed = await extractResumeFile(item.file);
      setUploadItems((previous) => previous.map((current) => current.id === item.id ? { ...current, state: "parsed", parsed } : current));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not process this file.";
      setUploadItems((previous) => previous.map((current) => current.id === item.id ? { ...current, state: message.startsWith("Unsupported format:") ? "unsupported" : "failed", message } : current));
    }
  }

  async function confirmImports() {
    const importable = uploadItems.filter((item) => item.state === "parsed" && item.parsed);
    if (!importable.length) return;
    setConfirmingImports(true);
    setError("");
    setSuccess("");
    let createdCount = 0;
    try {
      const knownEmails = new Set(candidates.map((candidate) => candidate.email?.trim().toLowerCase()).filter(Boolean));
      for (const item of importable) {
        const parsed = item.parsed as ParsedResume;
        const email = parsed.email?.trim().toLowerCase() || "";
        if (!email) {
          setUploadItems((previous) => previous.map((current) => current.id === item.id ? { ...current, state: "failed", message: "Email is required before import." } : current));
          continue;
        }
        const duplicateLookup = await supabase.from("candidates").select("ID,id,candidate_id").ilike("email", email).limit(1);
        if (duplicateLookup.error) throw new Error(duplicateLookup.error.message);
        const existingCandidate = duplicateLookup.data?.[0] as { ID?: string; id?: string; candidate_id?: string } | undefined;
        if (existingCandidate) {
          const existingId = existingCandidate.ID || existingCandidate.id || "";
          if (!existingId) throw new Error("Existing candidate has no database ID.");
          const resumePath = `${existingCandidate.candidate_id || existingId}/${Date.now()}-${crypto.randomUUID()}-${item.file.name}`;
          const upload = await supabase.storage.from("resumes").upload(resumePath, item.file, { contentType: item.file.type || "application/octet-stream", upsert: false });
          if (upload.error) throw new Error(`Resume upload failed: ${upload.error.message}`);
          const candidateNumber = existingCandidate.candidate_id || await allocateCandidateNumber(supabase);
          const versionUpdate = await supabase.from("candidate_resume_versions").update({ is_current: false }).eq("candidate_id", existingId).eq("is_current", true);
          if (versionUpdate.error) throw new Error(versionUpdate.error.message);
          const version = await supabase.from("candidate_resume_versions").insert({ candidate_id: existingId, file_name: item.file.name, storage_path: resumePath, mime_type: item.file.type || null, is_current: true }).select("id").single();
          if (version.error) throw new Error(version.error.message);
          const nameParts = (parsed.name || "").trim().split(/\s+/).filter(Boolean);
          const updateValues = { candidate_id: candidateNumber, first_name: nameParts[0] || null, last_name: nameParts.slice(1).join(" ") || null, phone: parsed.phone, resume_path: resumePath };
          let updated = await supabase.from("candidates").update(updateValues).eq("ID", existingId);
          if (updated.error) updated = await supabase.from("candidates").update(updateValues).eq("id", existingId);
          if (updated.error) throw new Error(updated.error.message);
          knownEmails.add(email);
          setUploadItems((previous) => previous.map((current) => current.id === item.id ? { ...current, state: "updated", candidateId: candidateNumber, message: `Updated ${candidateNumber}; previous resume retained.` } : current));
          continue;
        }
        if (knownEmails.has(email)) {
          knownEmails.add(email);
          setUploadItems((previous) => previous.map((current) => current.id === item.id ? { ...current, state: "duplicate", message: `${email} already exists.` } : current));
          continue;
        }
        const candidateId = await allocateCandidateNumber(supabase);
        const resumePath = `${candidateId}/${Date.now()}-${crypto.randomUUID()}-${item.file.name}`;
        const upload = await supabase.storage.from("resumes").upload(resumePath, item.file, { contentType: item.file.type || "application/octet-stream", upsert: false });
        if (upload.error) throw new Error(`Resume upload failed: ${upload.error.message}`);
        const nameParts = (parsed.name || "").trim().split(/\s+/).filter(Boolean);
        const created = await supabase.from("candidates").insert({ candidate_id: candidateId, first_name: nameParts[0] || null, last_name: nameParts.slice(1).join(" ") || null, email, phone: parsed.phone, resume_path: resumePath, status: "new" }).select("*").single();
        if (created.error) {
          await supabase.storage.from("resumes").remove([resumePath]);
          throw new Error(created.error.message);
        }
        const version = await supabase.from("candidate_resume_versions").insert({ candidate_id: String((created.data as Candidate).ID || (created.data as Candidate).id || candidateId), file_name: item.file.name, storage_path: resumePath, mime_type: item.file.type || null, is_current: true });
        if (version.error) throw new Error(version.error.message);
        knownEmails.add(email);
        createdCount += 1;
        setUploadItems((previous) => previous.map((current) => current.id === item.id ? { ...current, candidateId, message: `Created ${candidateId}.` } : current));
      }
      await loadCandidates();
      setUploadModalOpen(false);
      setUploadItems([]);
      setSuccess(`${createdCount} candidate${createdCount === 1 ? "" : "s"} imported successfully.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not confirm imports.");
    } finally {
      setConfirmingImports(false);
    }
  }

  async function assignRecruiterToCandidates() {
    if (!bulkRecruiterId || selectedIds.length === 0) return;
    setBulkActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const { error: updateError } = await supabase
        .from("applications")
        .update({ recruiter_id: bulkRecruiterId })
        .in("candidate_id", selectedIds);
      if (updateError) throw new Error(updateError.message);
      setSuccess(`Recruiter assigned to ${selectedIds.length} selected candidate${selectedIds.length === 1 ? "" : "s"}.`);
      setSelectedIds([]);
      setBulkRecruiterId("");
      setBulkRecruiterSearch("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not assign recruiter.");
    } finally {
      setBulkActionLoading(false);
    }
  }

  async function changeSelectedApplicationStatuses() {
    if (!bulkStatus || selectedIds.length === 0) return;
    setBulkActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const { error: updateError } = await supabase
        .from("applications")
        .update({ status: bulkStatus })
        .in("candidate_id", selectedIds);
      if (updateError) throw new Error(updateError.message);
      setSuccess(`${selectedIds.length} candidate${selectedIds.length === 1 ? "" : "s"} moved to ${formatApplicationStatus(bulkStatus)}.`);
      setSelectedIds([]);
      setBulkStatus("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change application status.");
    } finally {
      setBulkActionLoading(false);
    }
  }

  async function transferCandidatesToJob() {
    if (!assignJobId || selectedIds.length === 0) return;
    const destinationJob = jobs.find((job) => job.id === assignJobId);
    if (!destinationJob) return;
    setBulkActionLoading(true);
    setError("");
    setSuccess("");
    try {
      let transferred = 0;
      for (const candidateId of selectedIds) {
        const existing = await supabase.from("applications").select("id").eq("candidate_id", candidateId).eq("job_id", destinationJob.id).limit(1);
        if (existing.error) throw new Error(existing.error.message);
        if ((existing.data || []).length > 0) continue;
        const jobCandidateNumber = await allocateJobCandidateNumber(supabase, destinationJob.id);
        const inserted = await supabase.from("applications").insert({ candidate_id: candidateId, job_id: destinationJob.id, status: "submission", job_candidate_number: jobCandidateNumber });
        if (inserted.error) throw new Error(inserted.error.message);
        transferred += 1;
      }
      setSuccess(`${transferred} candidate${transferred === 1 ? "" : "s"} transferred to ${destinationJob.title}.`);
      setSelectedIds([]);
      setAssignJobId("");
      setAssignJobSearch("");
      await loadCandidates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not transfer candidates.");
    } finally {
      setBulkActionLoading(false);
    }
  }

  async function addNoteToSelectedCandidates() {
    const text = window.prompt("Add note to selected candidates:")?.trim();
    if (!text || selectedIds.length === 0) return;
    setBulkActionLoading(true);
    setError("");
    setSuccess("");
    try {
      const { data: user } = await supabase.auth.getUser();
      const { data: profile } = user.user
        ? await supabase.from("profiles").select("full_name,email").eq("id", user.user.id).maybeSingle()
        : { data: null };
      const author = profile?.full_name || profile?.email || user.user?.email || "HireX";
      for (const candidate of selectedCandidates()) {
        const candidateId = getCandidateDbId(candidate);
        const note: CandidateNote = { id: crypto.randomUUID(), text, author, createdAt: new Date().toISOString() };
        const notes = [...parseCandidateNotes(candidate.notes), note];
        let result = await supabase.from("candidates").update({ notes: serializeCandidateNotes(notes) }).eq("ID", candidateId);
        if (result.error) result = await supabase.from("candidates").update({ notes: serializeCandidateNotes(notes) }).eq("id", candidateId);
        if (result.error) throw new Error(result.error.message);
      }
      setSuccess(`Note added to ${selectedIds.length} selected candidate${selectedIds.length === 1 ? "" : "s"}.`);
      setSelectedIds([]);
      await loadCandidates();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add note.");
    } finally {
      setBulkActionLoading(false);
    }
  }

  async function openCandidate(candidate: Candidate) {
    const index =
      filteredCandidates.findIndex(
        (item) =>
          getCandidateDbId(item) ===
          getCandidateDbId(candidate)
      );

    setSelectedCandidateIndex(
      index >= 0 ? index : null
    );

    setResumeUrl("");
    setError("");

    if (
      (candidate.status || "new").toLowerCase() ===
        "new" &&
      getCandidateDbId(candidate)
    ) {
      await updateCandidateStatus(
        candidate,
        "viewed",
        true
      );
    }

    if (candidate.resume_path) {
      await openResume(candidate.resume_path);
    }
  }

  async function openResume(path: string) {
    try {
      const finalPath = path;

      if (
        finalPath.startsWith("http://") ||
        finalPath.startsWith("https://")
      ) {
        setResumeUrl(finalPath);
        return;
      }

      const { data, error } =
        await supabase.storage
          .from("resumes")
          .createSignedUrl(
            finalPath,
            60 * 60
          );

      if (error || !data?.signedUrl) {
        setError(
          error?.message ||
            "Unable to open resume."
        );
        return;
      }

      setResumeUrl(data.signedUrl);
    } catch (err) {
      console.error(
        "Resume error:",
        err
      );

      setError(
        "Unable to open resume."
      );
    }
  }

  async function updateCandidateStatus(
    candidate: Candidate,
    newStatus: string,
    silent = false
  ) {
    const candidateId =
      getCandidateDbId(candidate);

    if (!candidateId) {
      setError(
        "Candidate database ID is missing."
      );
      return;
    }

    setChangingStatus(true);

    if (!silent) {
      setError("");
      setSuccess("");
    }

    try {
      let result = await supabase
        .from("candidates")
        .update({
          status: newStatus,
        })
        .eq("ID", candidateId);

      if (result.error) {
        result = await supabase
          .from("candidates")
          .update({
            status: newStatus,
          })
          .eq("id", candidateId);
      }

      if (result.error) {
        throw new Error(
          result.error.message
        );
      }

      setCandidates((previous) =>
        previous.map((item) =>
          getCandidateDbId(item) ===
          candidateId
            ? {
                ...item,
                status: newStatus,
              }
            : item
        )
      );

      if (!silent) {
        setSuccess(
          `Candidate status changed to ${formatStatus(
            newStatus
          )}.`
        );
      }
    } catch (err) {
      console.error(
        "Status update error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update candidate status."
      );
    } finally {
      setChangingStatus(false);
    }
  }

  function closeProfile() {
    setSelectedCandidateIndex(null);
    setResumeUrl("");
    setNoteText("");
    setEditingNoteId(null);
    setEditingNoteText("");
    setNotesPanelOpen(false);
    setHistoryPanelOpen(false);
  }

  async function addCandidateNote(candidate: Candidate) {
    const text = noteText.trim();
    const candidateId = getCandidateDbId(candidate);

    if (!text || !candidateId) {
      return;
    }

    setSavingNote(true);
    setError("");

    try {
      const { data: user } = await supabase.auth.getUser();
      const { data: profile } = user.user
        ? await supabase
            .from("profiles")
            .select("full_name,email")
            .eq("id", user.user.id)
            .maybeSingle()
        : { data: null };
      const notes = parseCandidateNotes(candidate.notes);
      const note: CandidateNote = {
        id: crypto.randomUUID(),
        text,
        author:
          profile?.full_name ||
          profile?.email ||
          user.user?.email ||
          "HireX",
        createdAt: new Date().toISOString(),
      };

      const result = await supabase
        .from("candidates")
        .update({
          notes: serializeCandidateNotes([...notes, note]),
        })
        .eq("ID", candidateId);

      if (result.error) {
        throw new Error(result.error.message);
      }

      setCandidates((current) =>
        current.map((item) =>
          getCandidateDbId(item) === candidateId
            ? {
                ...item,
                notes: serializeCandidateNotes([...notes, note]),
              }
            : item
        )
      );
      setNoteText("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save note."
      );
    } finally {
      setSavingNote(false);
    }
  }

  async function saveEditedNote(candidate: Candidate) {
    if (!editingNoteId || !editingNoteText.trim()) return;

    const candidateId = getCandidateDbId(candidate);
    const notes = parseCandidateNotes(candidate.notes);
    const updatedNotes = notes.map((note) => note.id === editingNoteId
      ? { ...note, text: editingNoteText.trim(), editedAt: new Date().toISOString() }
      : note
    );

    setSavingNote(true);
    setError("");
    const result = await supabase
      .from("candidates")
      .update({ notes: serializeCandidateNotes(updatedNotes) })
      .eq("ID", candidateId);

    if (result.error) {
      setError(result.error.message);
    } else {
      setCandidates((current) => current.map((item) =>
        getCandidateDbId(item) === candidateId
          ? { ...item, notes: serializeCandidateNotes(updatedNotes) }
          : item
      ));
      setEditingNoteId(null);
      setEditingNoteText("");
    }
    setSavingNote(false);
  }

  function goToPreviousCandidate() {
    if (
      selectedCandidateIndex === null ||
      filteredCandidates.length === 0
    ) {
      return;
    }

    if (selectedCandidateIndex <= 0) {
      return;
    }

    const candidate =
      filteredCandidates[
        selectedCandidateIndex - 1
      ];

    setSelectedCandidateIndex(
      selectedCandidateIndex - 1
    );

    setResumeUrl("");
    if (
      (candidate.status || "new").toLowerCase() ===
      "new"
    ) {
      updateCandidateStatus(
        candidate,
        "viewed",
        true
      );
    }

    if (candidate.resume_path) {
      openResume(candidate.resume_path);
    }
  }

  function goToNextCandidate() {
    if (
      selectedCandidateIndex === null ||
      filteredCandidates.length === 0
    ) {
      return;
    }

    if (
      selectedCandidateIndex >=
      filteredCandidates.length - 1
    ) {
      return;
    }

    const candidate =
      filteredCandidates[
        selectedCandidateIndex + 1
      ];

    setSelectedCandidateIndex(
      selectedCandidateIndex + 1
    );

    setResumeUrl("");

    if (
      (candidate.status || "new").toLowerCase() ===
      "new"
    ) {
      updateCandidateStatus(
        candidate,
        "viewed",
        true
      );
    }

    if (candidate.resume_path) {
      openResume(candidate.resume_path);
    }
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setJobFilter("all");
    setCurrentPage(1);
  }

  function formatDate(value: string | null) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString(
      undefined,
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  }

  function formatStatus(status: string | null) {
    const value = (
      status || "new"
    ).toLowerCase();

    return value
      .charAt(0)
      .toUpperCase() +
      value.slice(1);
  }

  function statusClass(status: string | null) {
    const value = (
      status || "new"
    ).toLowerCase();

    if (value === "hired") {
      return "border-green-400/20 bg-green-400/10 text-green-300";
    }

    if (value === "interview") {
      return "border-yellow-400/20 bg-yellow-400/10 text-yellow-300";
    }

    if (value === "offer") {
      return "border-orange-400/20 bg-orange-400/10 text-orange-300";
    }

    if (value === "rejected") {
      return "border-red-400/20 bg-red-400/10 text-red-300";
    }

    if (value === "submissions") {
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";
    }

    if (value === "viewed") {
      return "border-purple-400/20 bg-purple-400/10 text-purple-300";
    }

    return "border-white/10 bg-white/[0.04] text-white/50";
  }

  const selectedCandidate =
    selectedCandidateIndex !== null
      ? filteredCandidates[
          selectedCandidateIndex
        ]
      : null;

  const allVisibleSelected =
    visibleCandidates.length > 0 &&
    visibleCandidates
      .map(getCandidateDbId)
      .filter(Boolean)
      .every((id) =>
        selectedIds.includes(id)
      );

  return (
    <main className="min-h-screen bg-[#03040a] text-white">
      <div className="mx-auto max-w-[1700px] px-5 py-8 sm:px-8 lg:py-10">

        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() =>
                router.push("/recruiter")
              }
              className="mb-5 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/50 transition hover:bg-white/[0.07] hover:text-white"
            >
              <ArrowLeft size={14} />
              Back to Recruiter Dashboard
            </button>

            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-purple-200/70">
              HireX ATS
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
              Candidate Pool
            </h1>

            <p className="mt-2 text-sm text-white/40">
              Search, filter, review and manage your candidates.
            </p>
          </div>

          <button
            type="button"
            onClick={loadCandidates}
            disabled={loading}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/70 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
            Refresh
          </button>
        </div>

        <section className="mb-5 rounded-2xl border border-purple-400/20 bg-purple-400/[0.045] p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-100">Parse resumes into the candidate pool</p>
              <p className="mt-1 text-xs text-white/40">Create unassigned candidates from extracted resume contact details.</p>
            </div>
            <button type="button" onClick={() => setUploadModalOpen(true)} className="inline-flex w-fit items-center gap-2 rounded-xl bg-purple-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-400">
              <Upload size={16} /> Upload & Parse
            </button>
          </div>
        </section>

        {error && (
          <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3">
            <p className="text-sm text-red-200">
              {error}
            </p>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-200/50 hover:text-red-200"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-green-400/20 bg-green-400/[0.06] px-4 py-3">
            <p className="text-sm text-green-200">
              {success}
            </p>

            <button
              type="button"
              onClick={() => setSuccess("")}
              className="text-green-200/50 hover:text-green-200"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="mb-5 grid gap-3 sm:grid-cols-3">
          <SummaryCard
            icon={<Users size={18} />}
            label="Total Candidates"
            value={candidates.length}
          />

          <SummaryCard
            icon={<Filter size={18} />}
            label="Showing"
            value={filteredCandidates.length}
          />

          <SummaryCard
            icon={<Check size={18} />}
            label="Selected"
            value={selectedIds.length}
          />
        </div>

        <section className="mb-5 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
          <div className="flex flex-col gap-3 xl:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search candidate ID, name, email, phone, title..."
                className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-purple-400/40"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="h-11 rounded-xl border border-white/10 bg-[#090a11] px-4 text-sm text-white outline-none focus:border-purple-400/40"
            >
              <option value="all">
                All Statuses
              </option>

              {STATUS_OPTIONS.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {formatStatus(status)}
                  </option>
                )
              )}
            </select>

            <select
              value={jobFilter}
              onChange={(event) =>
                setJobFilter(
                  event.target.value
                )
              }
              className="h-11 rounded-xl border border-white/10 bg-[#090a11] px-4 text-sm text-white outline-none focus:border-purple-400/40"
            >
              <option value="all">
                All Jobs
              </option>

              {jobs.map((job) => (
                <option
                  key={job.id}
                  value={job.id}
                >
                  {job.title}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={clearFilters}
              className="h-11 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white/50 transition hover:bg-white/[0.07] hover:text-white"
            >
              Clear
            </button>
          </div>
        </section>

        {selectedIds.length > 0 && (
          <section className="mb-5 rounded-2xl border border-purple-400/20 bg-purple-400/[0.05] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-purple-100">
                  {selectedIds.length} candidate
                  {selectedIds.length === 1
                    ? ""
                    : "s"} selected
                </p>

                <p className="mt-1 text-xs text-white/35">
                  Apply changes to the selected candidates&apos; applications.
                </p>
              </div>

              <div className="grid w-full gap-2 sm:grid-cols-2 lg:max-w-[900px] xl:grid-cols-4">
                <input
                  value={bulkRecruiterSearch}
                  onChange={(event) => setBulkRecruiterSearch(event.target.value)}
                  placeholder="Search recruiter..."
                  className="h-10 min-w-0 rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-purple-400/40"
                />
                <select
                  value={bulkRecruiterId}
                  onChange={(event) => setBulkRecruiterId(event.target.value)}
                  className="h-10 min-w-0 rounded-lg border border-white/10 bg-[#090a11] px-3 text-sm text-white outline-none focus:border-purple-400/40"
                >
                  <option value="">Assign recruiter...</option>
                  {filteredBulkRecruiters.map((recruiter) => (
                    <option key={recruiter.id} value={recruiter.id}>
                      {recruiter.full_name || recruiter.email || recruiter.id}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={assignRecruiterToCandidates}
                  disabled={bulkActionLoading || !bulkRecruiterId}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.08] px-4 text-sm font-semibold text-white transition hover:bg-white/[0.14] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Assign Recruiter
                </button>

                <select
                  value={bulkStatus}
                  onChange={(event) => setBulkStatus(event.target.value)}
                  className="h-10 min-w-0 rounded-lg border border-white/10 bg-[#090a11] px-3 text-sm text-white outline-none focus:border-purple-400/40"
                >
                  <option value="">Change status...</option>
                  {APPLICATION_STATUSES.map((status) => (
                    <option key={status} value={status}>{formatApplicationStatus(status)}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={changeSelectedApplicationStatuses}
                  disabled={bulkActionLoading || !bulkStatus}
                  className="h-10 rounded-lg border border-white/10 px-4 text-sm text-white/70 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Change Status
                </button>

                <input
                  value={assignJobSearch}
                  onChange={(event) => setAssignJobSearch(event.target.value)}
                  placeholder="Search destination job..."
                  className="h-10 min-w-0 rounded-lg border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-purple-400/40"
                />
                <select
                  value={assignJobId}
                  onChange={(event) => setAssignJobId(event.target.value)}
                  className="h-10 min-w-0 rounded-lg border border-white/10 bg-[#090a11] px-3 text-sm text-white outline-none focus:border-purple-400/40"
                >
                  <option value="">Transfer to job...</option>
                  {jobs
                    .filter((job) => !assignJobSearch.trim() || job.title.toLowerCase().includes(assignJobSearch.toLowerCase().trim()))
                    .map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
                </select>
                <button
                  type="button"
                  onClick={transferCandidatesToJob}
                  disabled={bulkActionLoading || !assignJobId}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-purple-500 px-4 text-sm font-semibold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <BriefcaseBusiness size={15} />
                  Transfer to Job
                </button>

                <button
                  type="button"
                  onClick={addNoteToSelectedCandidates}
                  disabled={bulkActionLoading}
                  className="h-10 rounded-lg border border-white/10 px-4 text-sm text-white/70 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Add Note
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
          {loading ? (
            <div className="flex min-h-[400px] items-center justify-center text-white/35">
              <Loader2
                size={20}
                className="mr-3 animate-spin"
              />
              Loading candidate pool...
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="flex min-h-[400px] flex-col items-center justify-center px-5 text-center">
              <Users
                size={40}
                className="text-white/10"
              />

              <h2 className="mt-5 text-lg font-semibold">
                No candidates found
              </h2>

              <p className="mt-2 max-w-md text-sm text-white/35">
                Try changing your search or filters.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/60 hover:bg-white/[0.08] hover:text-white"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1250px] border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.025] text-left">
                      <th className="w-[50px] px-4 py-4">
                        <input
                          type="checkbox"
                          checked={
                            allVisibleSelected
                          }
                          onChange={
                            toggleAllVisible
                          }
                          className="h-4 w-4 rounded accent-purple-500"
                        />
                      </th>

                      <SortableHeader
                        label="Candidate ID"
                        column="candidate_id"
                        sortColumn={sortColumn}
                        sortDirection={
                          sortDirection
                        }
                        onSort={handleSort}
                      />

                      <SortableHeader
                        label="Candidate"
                        column="name"
                        sortColumn={sortColumn}
                        sortDirection={
                          sortDirection
                        }
                        onSort={handleSort}
                      />

                      <SortableHeader
                        label="Current Title"
                        column="current_job_title"
                        sortColumn={sortColumn}
                        sortDirection={
                          sortDirection
                        }
                        onSort={handleSort}
                      />

                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-white/30">
                        Contact
                      </th>

                      <SortableHeader
                        label="Status"
                        column="status"
                        sortColumn={sortColumn}
                        sortDirection={
                          sortDirection
                        }
                        onSort={handleSort}
                      />

                      <SortableHeader
                        label="Added"
                        column="created_at"
                        sortColumn={sortColumn}
                        sortDirection={
                          sortDirection
                        }
                        onSort={handleSort}
                      />

                      <th className="px-4 py-4 text-xs font-semibold uppercase tracking-wider text-white/30">
                        Resume
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {visibleCandidates.map(
                      (candidate) => {
                        const databaseId =
                          getCandidateDbId(
                            candidate
                          );

                        const isSelected =
                          selectedIds.includes(
                            databaseId
                          );

                        const isNew =
                          (
                            candidate.status ||
                            "new"
                          ).toLowerCase() ===
                          "new";

                        const fullName =
                          `${candidate.first_name || ""} ${
                            candidate.last_name || ""
                          }`.trim() ||
                          "Unnamed Candidate";

                        return (
                          <tr
                            key={
                              databaseId ||
                              candidate.candidate_id ||
                              fullName
                            }
                            className={
                              "border-b border-white/[0.06] transition hover:bg-white/[0.025] " +
                              (isSelected
                                ? "bg-purple-400/[0.04]"
                                : "")
                            }
                          >
                            <td className="px-4 py-4">
                              <input
                                type="checkbox"
                                checked={
                                  isSelected
                                }
                                onChange={() =>
                                  toggleCandidate(
                                    candidate
                                  )
                                }
                                className="h-4 w-4 rounded accent-purple-500"
                              />
                            </td>

                            <td className="px-4 py-4">
                              <span className="font-mono text-xs font-medium text-purple-200">
                                {candidate.candidate_id ||
                                  "—"}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              <button
                                type="button"
                                onClick={() =>
                                  openCandidate(
                                    candidate
                                  )
                                }
                                className="text-left"
                              >
                                <div className="min-w-[170px]">
                                  <p
                                    className={
                                      "text-sm transition hover:text-purple-300 " +
                                      (isNew
                                        ? "font-semibold text-blue-300"
                                        : "font-normal text-white")
                                    }
                                  >
                                    {fullName}
                                  </p>

                                  <p className="mt-1 text-xs text-white/30">
                                    {candidate.email ||
                                      "No email"}
                                  </p>
                                </div>
                              </button>
                            </td>

                            <td className="px-4 py-4">
                              <p className="max-w-[220px] truncate text-sm text-white/60">
                                {candidate.current_job_title ||
                                  "—"}
                              </p>
                            </td>

                            <td className="px-4 py-4">
                              <div className="space-y-1">
                                <p className="text-xs text-white/55">
                                  {candidate.email ||
                                    "—"}
                                </p>

                                <p className="text-xs text-white/30">
                                  {candidate.phone ||
                                    "—"}
                                </p>
                              </div>
                            </td>

                            <td className="px-4 py-4">
                              <select
                                value={
                                  candidate.status ||
                                  "new"
                                }
                                disabled={
                                  changingStatus
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateCandidateStatus(
                                    candidate,
                                    event.target.value
                                  )
                                }
                                className={
                                  "rounded-lg border bg-[#090a11] px-3 py-2 text-xs outline-none focus:border-purple-400/50 " +
                                  statusClass(
                                    candidate.status
                                  )
                                }
                              >
                                {STATUS_OPTIONS.map(
                                  (
                                    status
                                  ) => (
                                    <option
                                      key={
                                        status
                                      }
                                      value={
                                        status
                                      }
                                      className="bg-[#090a11] text-white"
                                    >
                                      {formatStatus(
                                        status
                                      )}
                                    </option>
                                  )
                                )}
                              </select>
                            </td>

                            <td className="whitespace-nowrap px-4 py-4 text-xs text-white/30">
                              {formatDate(
                                candidate.created_at
                              )}
                            </td>

                            <td className="px-4 py-4">
                              {candidate.resume_path ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openCandidate(
                                      candidate
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/60 transition hover:bg-white/[0.08] hover:text-white"
                                >
                                  <FileText
                                    size={14}
                                  />
                                  Resume
                                </button>
                              ) : (
                                <span className="text-xs text-white/20">
                                  No resume
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-white/35">
                  Showing{" "}
                  <span className="text-white/60">
                    {filteredCandidates.length ===
                    0
                      ? 0
                      : pageStart + 1}
                  </span>{" "}
                  to{" "}
                  <span className="text-white/60">
                    {pageEnd}
                  </span>{" "}
                  of{" "}
                  <span className="text-white/60">
                    {
                      filteredCandidates.length
                    }
                  </span>{" "}
                  candidates
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() =>
                      setCurrentPage(
                        Math.max(
                          1,
                          safePage - 1
                        )
                      )
                    }
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs text-white/50 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                  >
                    <ChevronLeft size={14} />
                    Previous
                  </button>

                  <span className="px-3 text-xs text-white/40">
                    Page{" "}
                    <span className="font-medium text-white/70">
                      {safePage}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-white/70">
                      {totalPages}
                    </span>
                  </span>

                  <button
                    type="button"
                    disabled={
                      safePage >=
                      totalPages
                    }
                    onClick={() =>
                      setCurrentPage(
                        Math.min(
                          totalPages,
                          safePage + 1
                        )
                      )
                    }
                    className="inline-flex h-9 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-xs text-white/50 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
                  >
                    Next
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
          <div className="flex h-full w-full items-center justify-center p-4">
            <div className="flex h-[92vh] w-full max-w-[1500px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#080910] shadow-2xl">

              <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-purple-400/10 p-2.5 text-purple-200">
                    <User size={20} />
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold">
                      {selectedCandidate.first_name}{" "}
                      {selectedCandidate.last_name}
                    </h2>

                    <p className="text-xs text-white/35">
                      {selectedCandidate.candidate_id ||
                        "Candidate"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closeProfile}
                  className="rounded-lg border border-white/10 bg-white/[0.03] p-2 text-white/50 hover:bg-white/[0.08] hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex shrink-0 flex-col gap-4 border-b border-white/10 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={
                      selectedCandidateIndex ===
                        null ||
                      selectedCandidateIndex <=
                        0
                    }
                    onClick={
                      goToPreviousCandidate
                    }
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/60 hover:bg-white/[0.08] hover:text-white disabled:opacity-25"
                  >
                    <ChevronLeft size={14} />
                    Previous
                  </button>

                  <span className="text-xs text-white/30">
                    Candidate{" "}
                    {(selectedCandidateIndex ?? 0) +
                      1}{" "}
                    of{" "}
                    {
                      filteredCandidates.length
                    }
                  </span>

                  <button
                    type="button"
                    disabled={
                      selectedCandidateIndex ===
                        null ||
                      selectedCandidateIndex >=
                        filteredCandidates.length -
                          1
                    }
                    onClick={
                      goToNextCandidate
                    }
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/60 hover:bg-white/[0.08] hover:text-white disabled:opacity-25"
                  >
                    Next
                    <ChevronRight size={14} />
                  </button>
                </div>

                <select
                  value={
                    selectedCandidate.status ||
                    "new"
                  }
                  disabled={changingStatus}
                  onChange={(event) =>
                    updateCandidateStatus(
                      selectedCandidate,
                      event.target.value
                    )
                  }
                  className={
                    "rounded-lg border bg-[#090a11] px-4 py-2.5 text-xs font-medium outline-none focus:border-purple-400/50 " +
                    statusClass(
                      selectedCandidate.status
                    )
                  }
                >
                  {STATUS_OPTIONS.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                        className="bg-[#090a11] text-white"
                      >
                        {formatStatus(status)}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="grid min-h-0 flex-1 lg:grid-cols-[360px_1fr]">

                <aside className="overflow-y-auto border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white/30">
                    Candidate Details
                  </h3>

                  <div className="mt-5 space-y-5">
                    <div>
                      <p className="text-xs text-white/25">
                        Full Name
                      </p>

                      <p className="mt-1 text-sm text-white">
                        {selectedCandidate.first_name}{" "}
                        {selectedCandidate.last_name}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-white/25">
                        Email
                      </p>

                      <div className="mt-1 flex items-center gap-2 text-sm text-white/70">
                        <Mail size={14} />
                        {selectedCandidate.email ||
                          "—"}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-white/25">
                        Phone
                      </p>

                      <div className="mt-1 flex items-center gap-2 text-sm text-white/70">
                        <Phone size={14} />
                        {selectedCandidate.phone ||
                          "—"}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-white/25">
                        Current Title
                      </p>

                      <p className="mt-1 text-sm text-white/70">
                        {selectedCandidate.current_job_title ||
                          "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-white/25">
                        Assigned Job
                      </p>

                      <p className="mt-1 text-sm text-white/70">
                        {selectedCandidate.job_title ||
                          "Unassigned"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-white/25">
                        Candidate ID
                      </p>

                      <p className="mt-1 font-mono text-sm text-purple-200">
                        {selectedCandidate.candidate_id ||
                          "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-white/25">
                        Status
                      </p>

                      <span
                        className={
                          "mt-2 inline-flex rounded-full border px-3 py-1.5 text-xs " +
                          statusClass(
                            selectedCandidate.status
                          )
                        }
                      >
                        {formatStatus(
                          selectedCandidate.status
                        )}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setNotesPanelOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-400/20 bg-purple-400/[0.06] px-3 py-2.5 text-xs text-purple-100 hover:bg-purple-400/[0.12]"><StickyNote size={14} /> Notes</button>
                      <button type="button" onClick={() => setHistoryPanelOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs text-white/70 hover:bg-white/[0.08] hover:text-white"><History size={14} /> History</button>
                    </div>
                  </div>
                </aside>

                <div className="min-h-0 bg-[#11121a]">
                  {resumeUrl ? (
                    <div className="flex h-full flex-col">
                      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
                        <div className="flex items-center gap-2 text-xs text-white/50">
                          <FileText
                            size={15}
                          />
                          Resume
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={resumeUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/60 hover:bg-white/[0.08] hover:text-white"
                          >
                            <ExternalLink size={13} />
                            Open in New Tab
                          </a>
                        </div>
                      </div>

                      <iframe
                        src={resumeUrl}
                        title="Candidate Resume"
                        className="min-h-0 flex-1 w-full"
                      />
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center px-5 text-center">
                      <FileText
                        size={45}
                        className="text-white/10"
                      />

                      <h3 className="mt-5 text-lg font-semibold">
                        Resume unavailable
                      </h3>

                      <p className="mt-2 max-w-md text-sm text-white/35">
                        This candidate does not currently have a resume that can be displayed.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {uploadModalOpen && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-4 backdrop-blur-md" onClick={() => !processingUploads && !confirmingImports && setUploadModalOpen(false)}>
              <section className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0b0d16] shadow-2xl" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="resume-import-title">
                <div className="flex items-start justify-between border-b border-white/10 px-5 py-5 sm:px-7">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-200/70">Candidate pool</p>
                    <h2 id="resume-import-title" className="mt-2 text-2xl font-semibold">Upload &amp; Parse</h2>
                    <p className="mt-1 text-sm text-white/45">Review every extracted field before anything is added.</p>
                  </div>
                  <button type="button" onClick={() => setUploadModalOpen(false)} disabled={processingUploads || confirmingImports} className="rounded-lg border border-white/10 p-2 text-white/50 hover:bg-white/[0.08] hover:text-white disabled:opacity-40" aria-label="Close import dialog"><X size={18} /></button>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-7">
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-purple-300/30 bg-purple-300/[0.04] px-5 py-7 text-center transition hover:bg-purple-300/[0.08]">
                    <Upload size={24} className="text-purple-200" />
                    <span className="mt-3 text-sm font-semibold text-white/85">Choose resume files</span>
                    <span className="mt-1 text-xs text-white/40">Text files parse here. PDF, DOC, and DOCX are listed with an exact blocker.</span>
                    <input type="file" multiple accept="application/pdf,.pdf,application/msword,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,text/plain,.txt,.md,.rtf" onChange={handleUploadSelection} className="sr-only" />
                  </label>

                  {uploadItems.length === 0 ? (
                    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-5 py-10 text-center text-sm text-white/35">No files selected yet.</div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-white/10">
                      <table className="w-full min-w-[760px] text-left text-xs">
                        <thead className="border-b border-white/10 bg-white/[0.03] text-[10px] uppercase tracking-[0.16em] text-white/35"><tr><th className="px-4 py-3">File</th><th className="px-4 py-3">State</th><th className="px-4 py-3">Review</th><th className="px-4 py-3">Action</th></tr></thead>
                        <tbody className="divide-y divide-white/10">
                          {uploadItems.map((item) => {
                            const parsed = item.parsed;
                            const stateLabel = item.state === "ready" ? "Ready" : item.state === "parsing" ? "Parsing" : item.state === "parsed" ? "Parsed" : item.state === "unsupported" ? "Unsupported" : item.state === "failed" ? "Failed" : item.state === "duplicate" ? "Duplicate" : item.state === "updated" ? "Updated" : "Skipped";
                            const stateClass = item.state === "parsed" || item.state === "updated" ? "text-green-300" : item.state === "duplicate" ? "text-yellow-300" : item.state === "unsupported" || item.state === "failed" ? "text-red-300" : "text-white/55";
                            return <tr key={item.id} className="align-top">
                              <td className="max-w-[220px] px-4 py-4"><p className="truncate font-medium text-white/80">{item.file.name}</p><p className="mt-1 text-white/30">{Math.ceil(item.file.size / 1024)} KB</p></td>
                              <td className={`px-4 py-4 font-semibold ${stateClass}`}><span className="inline-flex items-center gap-1.5">{item.state === "parsing" && <Loader2 size={13} className="animate-spin" />}{stateLabel}</span>{item.message && <p className="mt-1 max-w-[260px] font-normal leading-5 text-white/40">{item.message}</p>}</td>
                              <td className="px-4 py-4">
                                {parsed ? <div className="grid gap-2 sm:grid-cols-2">
                                  <input aria-label={`${item.file.name} name`} value={parsed.name || ""} onChange={(event) => updateUploadField(item.id, "name", event.target.value)} placeholder="Full name" className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2 text-xs text-white outline-none focus:border-purple-400/50" />
                                  <input aria-label={`${item.file.name} email`} value={parsed.email || ""} onChange={(event) => updateUploadField(item.id, "email", event.target.value)} placeholder="Email (required)" className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2 text-xs text-white outline-none focus:border-purple-400/50" />
                                  <input aria-label={`${item.file.name} phone`} value={parsed.phone || ""} onChange={(event) => updateUploadField(item.id, "phone", event.target.value)} placeholder="Phone" className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2 text-xs text-white outline-none focus:border-purple-400/50" />
                                  <input aria-label={`${item.file.name} location`} value={parsed.location || ""} onChange={(event) => updateUploadField(item.id, "location", event.target.value)} placeholder="Location" className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2 text-xs text-white outline-none focus:border-purple-400/50" />
                                  <input aria-label={`${item.file.name} skills`} value={parsed.skills.join(", ")} onChange={(event) => updateUploadField(item.id, "skills", event.target.value)} placeholder="Skills, comma separated" className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2 text-xs text-white outline-none focus:border-purple-400/50 sm:col-span-2" />
                                </div> : <span className="text-white/25">Review available after parsing.</span>}
                              </td>
                              <td className="px-4 py-4"><div className="flex flex-wrap gap-2">{(item.state === "failed" || item.state === "unsupported") && <button type="button" onClick={() => void retryUpload(item)} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-white/70 hover:bg-white/[0.08]">Retry</button>}{item.state !== "skipped" && item.state !== "parsed" && <button type="button" onClick={() => skipUpload(item.id)} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-white/50 hover:bg-white/[0.08]">Skip</button>}{item.state === "parsed" && <button type="button" onClick={() => skipUpload(item.id)} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-white/50 hover:bg-white/[0.08]">Skip</button>}</div></td>
                            </tr>;
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4 sm:px-7">
                  <p className="text-xs text-white/40">{uploadItems.filter((item) => item.state === "parsed").length} ready to import · No candidate is created until confirmation.</p>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => void uploadAndParseResumes()} disabled={!uploadItems.some((item) => item.state === "ready" || item.state === "failed" || item.state === "unsupported") || processingUploads || confirmingImports} className="inline-flex items-center gap-2 rounded-xl border border-purple-300/25 bg-purple-300/10 px-4 py-2.5 text-sm font-semibold text-purple-100 hover:bg-purple-300/20 disabled:opacity-40">{processingUploads && <Loader2 size={15} className="animate-spin" />}Start Parsing</button>
                    <button type="button" onClick={() => void confirmImports()} disabled={!uploadItems.some((item) => item.state === "parsed") || processingUploads || confirmingImports} className="inline-flex items-center gap-2 rounded-xl bg-purple-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-400 disabled:opacity-40">{confirmingImports && <Loader2 size={15} className="animate-spin" />}Confirm Import</button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {(notesPanelOpen || historyPanelOpen) && (
            <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={() => { setNotesPanelOpen(false); setHistoryPanelOpen(false); }}>
              <aside className="absolute right-0 top-0 flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-[#0a0b12]/95 shadow-2xl" onClick={(event) => event.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-purple-200/70">{notesPanelOpen ? "Notes" : "History"}</p>
                    <p className="mt-1 text-sm text-white/45">{selectedCandidate.first_name} {selectedCandidate.last_name}</p>
                  </div>
                  <button type="button" onClick={() => { setNotesPanelOpen(false); setHistoryPanelOpen(false); }} className="rounded-lg border border-white/10 p-2 text-white/50 hover:bg-white/[0.08] hover:text-white" aria-label="Close panel"><X size={17} /></button>
                </div>

                {notesPanelOpen ? (
                  <div className="flex-1 space-y-4 overflow-y-auto p-5">
                    {parseCandidateNotes(selectedCandidate.notes).length === 0 && <p className="text-sm text-white/35">No notes saved.</p>}
                    {parseCandidateNotes(selectedCandidate.notes).map((note) => (
                      <div key={note.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                        {editingNoteId === note.id ? (
                          <textarea value={editingNoteText} onChange={(event) => setEditingNoteText(event.target.value)} rows={4} className="w-full resize-none rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-purple-400/40" />
                        ) : <p className="whitespace-pre-wrap text-sm text-white/75">{note.text}</p>}
                        <p className="mt-3 text-[11px] text-white/35">{note.author}{note.createdAt ? ` · Created ${new Date(note.createdAt).toLocaleString()}` : ""}{note.editedAt ? ` · Edited ${new Date(note.editedAt).toLocaleString()}` : ""}</p>
                        <div className="mt-3 flex gap-2">
                          {editingNoteId === note.id ? <>
                            <button type="button" disabled={savingNote || !editingNoteText.trim()} onClick={() => saveEditedNote(selectedCandidate)} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black disabled:opacity-40">Save</button>
                            <button type="button" onClick={() => { setEditingNoteId(null); setEditingNoteText(""); }} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60">Cancel</button>
                          </> : <button type="button" onClick={() => { setEditingNoteId(note.id); setEditingNoteText(note.text); }} className="text-xs text-purple-200/75 hover:text-purple-100">Edit</button>}
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-white/10 pt-4">
                      <textarea value={noteText} onChange={(event) => setNoteText(event.target.value)} placeholder="Write a note..." rows={4} className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none placeholder:text-white/25 focus:border-purple-400/40" />
                      <button type="button" disabled={savingNote || !noteText.trim()} onClick={() => addCandidateNote(selectedCandidate)} className="mt-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40">{savingNote ? "Saving..." : "Add Note"}</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto p-5">
                    <div className="space-y-3">
                      {[
                        selectedCandidate.created_at ? { label: "Candidate record created", timestamp: selectedCandidate.created_at } : null,
                        ...applications.filter((application) => application.candidate_id === getCandidateDbId(selectedCandidate)).map((application) => ({ label: `Application${application.job_id ? ` · ${jobs.find((job) => job.id === application.job_id)?.title || application.job_id}` : ""}`, timestamp: application.applied_at })),
                        selectedCandidate.viewed_at ? { label: "Profile viewed", timestamp: selectedCandidate.viewed_at } : null,
                        ...parseCandidateNotes(selectedCandidate.notes).flatMap((note) => [
                          note.createdAt ? { label: `Note added by ${note.author}`, timestamp: note.createdAt } : null,
                          note.editedAt ? { label: `Note edited by ${note.author}`, timestamp: note.editedAt } : null,
                        ]),
                      ].filter((event): event is { label: string; timestamp: string } => Boolean(event)).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((event) => (
                        <div key={`${event.label}-${event.timestamp}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                          <p className="text-sm text-white/75">{event.label}</p>
                          <p className="mt-1 text-xs text-white/35">{new Date(event.timestamp).toLocaleString()}</p>
                        </div>
                      ))}
                      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                        <p className="text-sm text-white/75">Current status: {formatStatus(selectedCandidate.status)}</p>
                        <p className="mt-1 text-xs text-white/35">No status-change timestamp is available.</p>
                      </div>
                      {applications.filter((application) => application.candidate_id === getCandidateDbId(selectedCandidate) && application.recruiter_id).map((application) => (
                        <div key={`recruiter-${application.id}`} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                          <p className="text-sm text-white/75">Recruiter assigned: {recruiters.find((recruiter) => recruiter.id === application.recruiter_id)?.full_name || application.recruiter_id}</p>
                          <p className="mt-1 text-xs text-white/35">No assignment timestamp is available.</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </aside>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-purple-400/10 p-2.5 text-purple-200">
          {icon}
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-wider text-white/30">
            {label}
          </p>

          <p className="mt-1 text-2xl font-semibold">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function SortableHeader({
  label,
  column,
  sortColumn,
  sortDirection,
  onSort,
}: {
  label: string;
  column: string;
  sortColumn: string;
  sortDirection: "asc" | "desc";
  onSort: (column: string) => void;
}) {
  const active =
    sortColumn === column;

  return (
    <th className="px-4 py-4">
      <button
        type="button"
        onClick={() => onSort(column)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-white/30 transition hover:text-white/70"
      >
        {label}

        <ChevronsUpDown
          size={13}
          className={
            active
              ? "text-purple-300"
              : "text-white/20"
          }
        />

        {active && (
          <span className="text-[9px] text-purple-300">
            {sortDirection === "asc"
              ? "↑"
              : "↓"}
          </span>
        )}
      </button>
    </th>
  );
}
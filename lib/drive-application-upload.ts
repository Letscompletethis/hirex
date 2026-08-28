import "server-only";
import { findOrCreateFolderPublic, getStoredDriveFolderIds, GoogleDriveConfigurationError, getAccessTokenPublic } from "./google-drive";

export interface DriveHierarchy {
  hirexRootFolderId: string;
  jobsFolderId: string;
  jobFolderId: string;
  applicationsFolderId: string;
  candidatesFolderId: string;
  candidateFolderId: string;
}

export interface UploadedResume {
  candidateFolderId: string;
  jobApplicationsFolderId: string;
  fileId: string;
  fileName: string;
  webViewLink?: string;
}

export async function ensureCandidateFolder(candidateName: string, refreshToken?: string): Promise<string> {
  const folders = await getStoredDriveFolderIds();
  if (!folders) throw new GoogleDriveConfigurationError("Google Drive folders are not bootstrapped. Reconnect Google Drive first.");
  return findOrCreateFolderPublic(candidateName, folders.candidatesFolderId, refreshToken);
}

/**
 * Ensure the HireX ATS folder structure exists in Google Drive.
 * Returns folder IDs for the hierarchy.
 */
export async function ensureHireXFolderStructure(
  jobId: string,
  jobTitle: string,
  candidateName: string,
  refreshToken?: string
): Promise<DriveHierarchy> {
  try {
    const folders = await getStoredDriveFolderIds();
    if (!folders) throw new GoogleDriveConfigurationError("Google Drive folders are not bootstrapped. Reconnect Google Drive first.");

    // HireX ATS/Jobs/{JOB_ID} - {JOB_TITLE}
    const jobFolderName = `${jobId} - ${jobTitle}`;
    const jobFolderId = await findOrCreateFolderPublic(jobFolderName, folders.jobsFolderId, refreshToken);

    // HireX ATS/Jobs/{JOB_ID}/Applications
    const applicationsFolderId = await findOrCreateFolderPublic("Applications", jobFolderId, refreshToken);

    // HireX ATS/Candidates/{Candidate Name}
    const candidateFolderId = await findOrCreateFolderPublic(candidateName, folders.candidatesFolderId, refreshToken);

    return {
      hirexRootFolderId: folders.rootFolderId,
      jobsFolderId: folders.jobsFolderId,
      jobFolderId,
      applicationsFolderId,
      candidatesFolderId: folders.candidatesFolderId,
      candidateFolderId,
    };
  } catch (error) {
    if (error instanceof GoogleDriveConfigurationError) {
      throw error;
    }
    throw new Error(`Failed to create HireX folder structure: ${error instanceof Error ? error.message : "unknown error"}`);
  }
}

/**
 * Upload a resume to both the job application folder and the candidate folder.
 * Returns the file ID and folder IDs for persistence.
 */
export async function uploadResumeToJobAndCandidate(
  file: File,
  jobApplicationsFolderId: string,
  candidateFolderId: string,
  candidateName: string,
  refreshToken?: string
): Promise<UploadedResume> {
  try {
    // Get the access token for this session
    const token = refreshToken || process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
    if (!token) {
      throw new GoogleDriveConfigurationError("No Google Drive refresh token available");
    }

    const accessToken = await getAccessTokenPublic(token);

    // Prepare the file with candidate name in filename
    const ext = file.name.split(".").pop() || "pdf";
    const fileName = `${candidateName} - Resume.${ext}`;

    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append("metadata", new Blob([JSON.stringify({ name: fileName, parents: [jobApplicationsFolderId] })], { type: "application/json" }));
    formData.append("file", file, fileName);

    // Upload to job applications folder
    const uploadUrl = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,parents,webViewLink";
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorBody = await uploadResponse.json() as { error?: { message?: string } };
      throw new Error(errorBody.error?.message || "Upload to job applications folder failed");
    }

    const uploadedFile = await uploadResponse.json() as { id?: string; name?: string; webViewLink?: string };
    const fileId = uploadedFile.id || "";

    if (!fileId) {
      throw new Error("Drive did not return a file ID after upload");
    }

    // Also upload to candidate folder (same file, different location)
    const candidateFormData = new FormData();
    candidateFormData.append("metadata", new Blob([JSON.stringify({ name: fileName, parents: [candidateFolderId] })], { type: "application/json" }));
    candidateFormData.append("file", file, fileName);

    const candidateUploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: candidateFormData,
    });

    if (!candidateUploadResponse.ok) {
      const errorBody = await candidateUploadResponse.json() as { error?: { message?: string } };
      console.error("[drive-candidate-upload]", errorBody.error?.message || "Upload to candidate folder failed");
      // Non-blocking: candidate folder upload failure does not prevent app submission
    }

    return {
      candidateFolderId,
      jobApplicationsFolderId,
      fileId,
      fileName,
      webViewLink: uploadedFile.webViewLink,
    };
  } catch (error) {
    if (error instanceof GoogleDriveConfigurationError) {
      throw error;
    }
    throw new Error(`Failed to upload resume to Drive: ${error instanceof Error ? error.message : "unknown error"}`);
  }
}

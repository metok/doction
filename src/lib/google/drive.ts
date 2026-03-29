import { ApiClient } from "./api-client";
import { DriveFile, DriveFileList, SharedDriveList } from "./types";

const BASE_URL = "https://www.googleapis.com/drive/v3";
const DRIVE_API = BASE_URL;

const FILE_FIELDS =
  "id,name,mimeType,parents,createdTime,modifiedTime,size,iconLink,thumbnailLink,webViewLink,starred,trashed";

export function createDriveApi(client: ApiClient) {
  async function listFiles(
    folderId: string = "root",
    pageToken?: string,
    driveId?: string,
  ): Promise<DriveFileList> {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields: `nextPageToken,files(${FILE_FIELDS})`,
      orderBy: "folder,name",
      pageSize: "200",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
    if (driveId) {
      params.set("corpora", "drive");
      params.set("driveId", driveId);
    }
    if (pageToken) params.set("pageToken", pageToken);
    return client.get<DriveFileList>(`${BASE_URL}/files?${params}`);
  }

  async function getFile(fileId: string): Promise<DriveFile> {
    const params = new URLSearchParams({
      fields: FILE_FIELDS,
      supportsAllDrives: "true",
    });
    return client.get<DriveFile>(`${BASE_URL}/files/${fileId}?${params}`);
  }

  async function searchFiles(query: string): Promise<DriveFileList> {
    const params = new URLSearchParams({
      q: `fullText contains '${query.replace(/'/g, "\\'")}' and trashed = false`,
      fields: `nextPageToken,files(${FILE_FIELDS})`,
      pageSize: "50",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
    return client.get<DriveFileList>(`${BASE_URL}/files?${params}`);
  }

  async function searchFilesAdvanced(options: {
    query: string;
    mimeType?: string;
    modifiedAfter?: string;
    driveId?: string;
  }): Promise<DriveFileList> {
    const conditions: string[] = [];
    if (options.query)
      conditions.push(
        `fullText contains '${options.query.replace(/'/g, "\\'")}'`,
      );
    conditions.push("trashed = false");
    if (options.mimeType)
      conditions.push(`mimeType = '${options.mimeType}'`);
    if (options.modifiedAfter)
      conditions.push(`modifiedTime > '${options.modifiedAfter}'`);
    const params = new URLSearchParams({
      q: conditions.join(" and "),
      fields: `nextPageToken,files(${FILE_FIELDS})`,
      pageSize: "50",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
    if (options.driveId) {
      params.set("corpora", "drive");
      params.set("driveId", options.driveId);
    }
    return client.get<DriveFileList>(`${BASE_URL}/files?${params}`);
  }

  async function listSharedDrives(): Promise<SharedDriveList> {
    return client.get<SharedDriveList>(`${BASE_URL}/drives?pageSize=100`);
  }

  async function getSharedDrive(driveId: string): Promise<{ id: string; name: string } | null> {
    try {
      return await client.get<{ id: string; name: string }>(`${BASE_URL}/drives/${driveId}`);
    } catch {
      return null;
    }
  }

  async function getStarredFiles(): Promise<DriveFileList> {
    const params = new URLSearchParams({
      q: "starred = true and trashed = false",
      fields: `nextPageToken,files(${FILE_FIELDS})`,
      orderBy: "modifiedTime desc",
      pageSize: "100",
    });
    return client.get<DriveFileList>(`${BASE_URL}/files?${params}`);
  }

  async function recentlyModified(pageSize: number = 15): Promise<DriveFileList> {
    const params = new URLSearchParams({
      orderBy: "modifiedTime desc",
      pageSize: String(pageSize),
      fields: `nextPageToken,files(${FILE_FIELDS})`,
      q: "trashed = false and mimeType != 'application/vnd.google-apps.folder'",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
    return client.get<DriveFileList>(`${BASE_URL}/files?${params}`);
  }

  async function getTrashedFiles(): Promise<DriveFileList> {
    const params = new URLSearchParams({
      q: "trashed = true",
      fields: `nextPageToken,files(${FILE_FIELDS})`,
      orderBy: "modifiedTime desc",
      pageSize: "100",
    });
    return client.get<DriveFileList>(`${BASE_URL}/files?${params}`);
  }

  async function getFilePath(
    fileId: string,
    depth: number = 0,
  ): Promise<DriveFile[]> {
    if (depth >= 20) return [];
    const file = await getFile(fileId);
    if (!file.parents || file.parents.length === 0) {
      // Root reached — check if this is a shared drive and use its real name
      const drive = await getSharedDrive(file.id);
      if (drive) {
        return [{ ...file, name: drive.name }];
      }
      return [file];
    }
    const parentPath = await getFilePath(file.parents[0], depth + 1);
    return [...parentPath, file];
  }

  async function getStartPageToken(): Promise<string> {
    const params = new URLSearchParams({
      supportsAllDrives: "true",
    });
    const result = await client.get<{ startPageToken: string }>(
      `${DRIVE_API}/changes/startPageToken?${params}`,
    );
    return result.startPageToken;
  }

  async function listChanges(pageToken: string): Promise<{
    changes: Array<{
      changeType: string;
      time: string;
      fileId?: string;
      file?: DriveFile;
      removed?: boolean;
      driveId?: string;
      drive?: { id: string; name: string };
    }>;
    newStartPageToken?: string;
    nextPageToken?: string;
  }> {
    const params = new URLSearchParams({
      pageToken,
      pageSize: "50",
      fields:
        "changes(changeType,time,fileId,file(id,name,mimeType,modifiedTime,webViewLink,parents),removed,driveId,drive(id,name)),newStartPageToken,nextPageToken",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
    return client.get(`${DRIVE_API}/changes?${params}`);
  }

  async function listRevisions(fileId: string) {
    const params = new URLSearchParams({
      fields:
        "revisions(id,modifiedTime,lastModifyingUser(displayName,photoLink),size)",
      pageSize: "50",
    });
    return client.get<{
      revisions: Array<{
        id: string;
        modifiedTime: string;
        lastModifyingUser?: { displayName: string; photoLink?: string };
        size?: string;
      }>;
    }>(`${BASE_URL}/files/${fileId}/revisions?${params}`);
  }

  async function restoreFile(fileId: string) {
    const params = new URLSearchParams({ supportsAllDrives: "true" });
    return client.patch(`${BASE_URL}/files/${fileId}?${params}`, { trashed: false });
  }

  function getDownloadUrl(fileId: string): string {
    return `${BASE_URL}/files/${fileId}?alt=media`;
  }

  async function getUserInfo(): Promise<{
    email: string;
    name: string;
    picture: string;
  }> {
    return client.get("https://www.googleapis.com/oauth2/v2/userinfo");
  }

  return {
    listFiles,
    getFile,
    searchFiles,
    searchFilesAdvanced,
    getStarredFiles,
    getTrashedFiles,
    recentlyModified,
    getFilePath,
    getDownloadUrl,
    listSharedDrives,
    getSharedDrive,
    getUserInfo,
    getStartPageToken,
    listChanges,
    listRevisions,
    restoreFile,
  };
}

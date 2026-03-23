import { ApiClient } from "./api-client";
import { DriveFile, DriveFileList, SharedDriveList } from "./types";

const BASE_URL = "https://www.googleapis.com/drive/v3";

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

  async function listSharedDrives(): Promise<SharedDriveList> {
    return client.get<SharedDriveList>(`${BASE_URL}/drives?pageSize=100`);
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
    if (!file.parents || file.parents.length === 0) return [file];
    const parentPath = await getFilePath(file.parents[0], depth + 1);
    return [...parentPath, file];
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
    getStarredFiles,
    getTrashedFiles,
    getFilePath,
    getDownloadUrl,
    listSharedDrives,
    getUserInfo,
  };
}

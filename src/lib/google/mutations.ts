import type { ApiClient } from "./api-client";
import type { DriveFile } from "./types";

export async function trashFile(
  client: ApiClient,
  fileId: string,
): Promise<DriveFile> {
  return client.patch<DriveFile>(
    `https://www.googleapis.com/drive/v3/files/${fileId}?supportsAllDrives=true`,
    { trashed: true },
  );
}

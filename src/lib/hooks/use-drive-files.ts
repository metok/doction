import { useQuery } from "@tanstack/react-query";
import { useApi } from "../api-context";

const STALE_TIME = 2 * 60 * 1000; // 2 minutes

export function useDriveFiles(folderId: string = "root", enabled = true) {
  const { drive } = useApi();

  return useQuery({
    queryKey: ["drive", "files", folderId],
    queryFn: () => drive.listFiles(folderId),
    enabled,
    staleTime: STALE_TIME,
  });
}

export function useFileMetadata(fileId: string | undefined) {
  const { drive } = useApi();

  return useQuery({
    queryKey: ["drive", "file", fileId],
    queryFn: () => drive.getFile(fileId!),
    enabled: !!fileId,
    staleTime: STALE_TIME,
  });
}

export function useFilePath(fileId: string | undefined) {
  const { drive } = useApi();

  return useQuery({
    queryKey: ["drive", "path", fileId],
    queryFn: () => drive.getFilePath(fileId!),
    enabled: !!fileId,
    staleTime: STALE_TIME,
  });
}

export function useStarredFiles() {
  const { drive } = useApi();

  return useQuery({
    queryKey: ["drive", "starred"],
    queryFn: () => drive.getStarredFiles(),
    staleTime: STALE_TIME,
  });
}

export function useTrashedFiles() {
  const { drive } = useApi();

  return useQuery({
    queryKey: ["drive", "trashed"],
    queryFn: () => drive.getTrashedFiles(),
    staleTime: STALE_TIME,
  });
}

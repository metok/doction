import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useApi } from "../api-context";

const STALE_TIME = 2 * 60 * 1000; // 2 minutes

export function useDriveFiles(folderId: string = "root", enabled = true, driveId?: string) {
  const { drive } = useApi();

  return useInfiniteQuery({
    queryKey: ["drive", "files", folderId, driveId],
    queryFn: ({ pageParam }) => drive.listFiles(folderId, pageParam, driveId),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextPageToken ?? undefined,
    enabled,
    staleTime: STALE_TIME,
  });
}

export function useSharedDrives() {
  const { drive } = useApi();

  return useQuery({
    queryKey: ["drive", "shared-drives"],
    queryFn: () => drive.listSharedDrives(),
    staleTime: 1000 * 60 * 5, // 5 minutes, shared drives rarely change
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

export function useRecentlyModified() {
  const { drive } = useApi();

  return useQuery({
    queryKey: ["drive-recently-modified"],
    queryFn: () => drive.recentlyModified(),
    staleTime: 1000 * 60 * 2,
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

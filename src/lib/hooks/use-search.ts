import { useQuery } from "@tanstack/react-query";
import { useApi } from "../api-context";

const STALE_TIME = 2 * 60 * 1000; // 2 minutes

export interface SearchFilters {
  mimeType?: string;
  modifiedAfter?: string;
}

export function useSearch(query: string, filters?: SearchFilters) {
  const { drive } = useApi();

  const hasFilters = filters?.mimeType || filters?.modifiedAfter;

  return useQuery({
    queryKey: ["drive", "search", query, filters?.mimeType ?? "", filters?.modifiedAfter ?? ""],
    queryFn: () =>
      hasFilters
        ? drive.searchFilesAdvanced({
            query,
            mimeType: filters?.mimeType,
            modifiedAfter: filters?.modifiedAfter,
          })
        : drive.searchFiles(query),
    enabled: query.length > 0,
    staleTime: STALE_TIME,
  });
}

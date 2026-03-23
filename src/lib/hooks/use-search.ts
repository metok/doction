import { useQuery } from "@tanstack/react-query";
import { useApi } from "../api-context";

const STALE_TIME = 2 * 60 * 1000; // 2 minutes

export function useSearch(query: string) {
  const { drive } = useApi();

  return useQuery({
    queryKey: ["drive", "search", query],
    queryFn: () => drive.searchFiles(query),
    enabled: query.length > 0,
    staleTime: STALE_TIME,
  });
}

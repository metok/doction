import { useQuery } from "@tanstack/react-query";
import { useApi } from "../api-context";

export function useActivity() {
  const { drive } = useApi();

  return useQuery({
    queryKey: ["activity-feed"],
    queryFn: () => drive.recentlyModified(25),
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60 * 2, // auto-refresh every 2 min
  });
}

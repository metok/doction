import { useQuery } from "@tanstack/react-query";
import { useApi } from "../api-context";

export function useRevisions(fileId: string) {
  const { drive } = useApi();

  return useQuery({
    queryKey: ["drive", "revisions", fileId],
    queryFn: () => drive.listRevisions(fileId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    enabled: !!fileId,
  });
}

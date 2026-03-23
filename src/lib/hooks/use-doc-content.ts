import { useQuery } from "@tanstack/react-query";
import { useApi } from "../api-context";

const STALE_TIME = 2 * 60 * 1000; // 2 minutes

export function useDocContent(docId: string | undefined) {
  const { docs } = useApi();

  return useQuery({
    queryKey: ["docs", "document", docId],
    queryFn: () => docs.getDocument(docId!),
    enabled: !!docId,
    staleTime: STALE_TIME,
  });
}

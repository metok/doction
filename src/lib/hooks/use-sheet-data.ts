import { useQuery } from "@tanstack/react-query";
import { useApi } from "../api-context";

const STALE_TIME = 2 * 60 * 1000; // 2 minutes

export function useSheetData(sheetId: string | undefined) {
  const { sheets } = useApi();

  return useQuery({
    queryKey: ["sheets", "spreadsheet", sheetId],
    queryFn: () => sheets.getSpreadsheet(sheetId!),
    enabled: !!sheetId,
    staleTime: STALE_TIME,
  });
}

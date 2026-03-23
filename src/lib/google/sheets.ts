import { ApiClient } from "./api-client";
import { Spreadsheet } from "./types";

const BASE_URL = "https://sheets.googleapis.com/v4";

export function createSheetsApi(client: ApiClient) {
  async function getSpreadsheet(spreadsheetId: string): Promise<Spreadsheet> {
    const params = new URLSearchParams({ includeGridData: "true" });
    return client.get<Spreadsheet>(
      `${BASE_URL}/spreadsheets/${spreadsheetId}?${params}`,
    );
  }

  return { getSpreadsheet };
}

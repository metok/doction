import { ApiClient } from "./api-client";
import { GoogleDoc } from "./types";

const BASE_URL = "https://docs.googleapis.com/v1";

export function createDocsApi(client: ApiClient) {
  async function getDocument(documentId: string): Promise<GoogleDoc> {
    return client.get<GoogleDoc>(`${BASE_URL}/documents/${documentId}`);
  }

  return { getDocument };
}

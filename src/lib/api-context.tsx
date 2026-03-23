import React, { createContext, useContext, useMemo } from "react";
import { ApiClient } from "./google/api-client";
import { getAccessToken } from "./google/auth";
import { createDriveApi } from "./google/drive";
import { createDocsApi } from "./google/docs";
import { createSheetsApi } from "./google/sheets";

type DriveApi = ReturnType<typeof createDriveApi>;
type DocsApi = ReturnType<typeof createDocsApi>;
type SheetsApi = ReturnType<typeof createSheetsApi>;

interface ApiContextValue {
  client: ApiClient;
  drive: DriveApi;
  docs: DocsApi;
  sheets: SheetsApi;
}

const ApiContext = createContext<ApiContextValue | null>(null);

interface ApiProviderProps {
  children: React.ReactNode;
}

export function ApiProvider({ children }: ApiProviderProps) {
  const value = useMemo(() => {
    const client = new ApiClient(getAccessToken);
    return {
      client,
      drive: createDriveApi(client),
      docs: createDocsApi(client),
      sheets: createSheetsApi(client),
    };
  }, []);

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
}

export function useApi(): ApiContextValue {
  const ctx = useContext(ApiContext);
  if (!ctx) {
    throw new Error("useApi must be used within an ApiProvider");
  }
  return ctx;
}

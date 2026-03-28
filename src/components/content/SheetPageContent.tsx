import { useEffect } from "react";
import { useSheetData } from "@/lib/hooks/use-sheet-data";
import { useFileMetadata, useFilePath } from "@/lib/hooks/use-drive-files";
import { SheetRenderer } from "@/components/content/SheetRenderer";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { useTabsStore } from "@/lib/stores/tabs";

export function SheetPageContent({ sheetId }: { sheetId: string }) {
  const { data, isLoading, error } = useSheetData(sheetId);
  const { data: meta } = useFileMetadata(sheetId);
  const { data: path = [], isLoading: pathLoading } = useFilePath(sheetId);
  const { updateTab, tabs } = useTabsStore();

  useEffect(() => {
    if (meta?.name) {
      const tab = tabs.find((t) => t.path === `/sheet/${sheetId}`);
      if (tab) updateTab(tab.id, { title: meta.name, mimeType: meta.mimeType });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta?.name]);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <Breadcrumbs path={path} isLoading={pathLoading} file={meta} />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col">
        <Breadcrumbs path={path} isLoading={pathLoading} file={meta} />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-red-400">Failed to load spreadsheet: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <Breadcrumbs path={path} isLoading={pathLoading} file={meta} />
      {data && <SheetRenderer spreadsheet={data} />}
    </div>
  );
}

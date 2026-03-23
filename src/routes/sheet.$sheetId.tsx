import { createFileRoute } from "@tanstack/react-router";
import { useSheetData } from "@/lib/hooks/use-sheet-data";
import { useFileMetadata, useFilePath } from "@/lib/hooks/use-drive-files";
import { SheetRenderer } from "@/components/content/SheetRenderer";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";

export const Route = createFileRoute("/sheet/$sheetId")({
  component: SheetPage,
});

function SheetPage() {
  const { sheetId } = Route.useParams();
  const { data, isLoading, error } = useSheetData(sheetId);
  const { data: meta } = useFileMetadata(sheetId);
  const { data: path = [], isLoading: pathLoading } = useFilePath(sheetId);

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

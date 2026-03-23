import { createFileRoute } from "@tanstack/react-router";
import { useSheetData } from "@/lib/hooks/use-sheet-data";
import { useFileMetadata, useFilePath } from "@/lib/hooks/use-drive-files";
import { SheetRenderer } from "@/components/content/SheetRenderer";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";

function SheetPage() {
  const { sheetId } = Route.useParams();

  const { data: spreadsheet, isLoading, error } = useSheetData(sheetId);
  const { data: pathData, isLoading: pathLoading } = useFilePath(sheetId);
  const { data: meta } = useFileMetadata(sheetId);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <Breadcrumbs isLoading={pathLoading} path={pathData} file={meta} />
        <div className="mx-auto w-full max-w-5xl px-8 py-10">
          <div className="mb-6 h-8 w-2/3 animate-pulse rounded bg-bg-tertiary" />
          <div className="mb-4 flex gap-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 w-20 animate-pulse rounded bg-bg-tertiary" />
            ))}
          </div>
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-9 animate-pulse rounded bg-bg-tertiary" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col">
        <Breadcrumbs path={pathData} file={meta} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-text-primary">Failed to load spreadsheet</p>
            <p className="mt-1 text-sm text-text-muted">{(error as Error).message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!spreadsheet) return null;

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Breadcrumbs path={pathData} isLoading={pathLoading} file={meta} />
      <SheetRenderer spreadsheet={spreadsheet} />
    </div>
  );
}

export const Route = createFileRoute("/sheet/$sheetId")({
  component: SheetPage,
});

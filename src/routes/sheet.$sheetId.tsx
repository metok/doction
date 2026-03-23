import { createFileRoute } from "@tanstack/react-router";
import { useFileMetadata, useFilePath } from "@/lib/hooks/use-drive-files";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";

function SheetPage() {
  const { sheetId } = Route.useParams();

  const { data: meta } = useFileMetadata(sheetId);
  const { data: pathData, isLoading: pathLoading } = useFilePath(sheetId);

  const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit?embedded=true`;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Breadcrumbs path={pathData} isLoading={pathLoading} file={meta} />
      <iframe
        src={sheetUrl}
        className="flex-1 border-none"
        title={meta?.name ?? "Spreadsheet"}
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}

export const Route = createFileRoute("/sheet/$sheetId")({
  component: SheetPage,
});

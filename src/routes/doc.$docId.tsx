import { createFileRoute } from "@tanstack/react-router";
import { useFileMetadata, useFilePath } from "@/lib/hooks/use-drive-files";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";

function DocPage() {
  const { docId } = Route.useParams();

  const { data: meta } = useFileMetadata(docId);
  const { data: pathData, isLoading: pathLoading } = useFilePath(docId);

  const docUrl = `https://docs.google.com/document/d/${docId}/edit?embedded=true`;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Breadcrumbs path={pathData} isLoading={pathLoading} file={meta} />
      <iframe
        src={docUrl}
        className="flex-1 border-none"
        title={meta?.name ?? "Document"}
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}

export const Route = createFileRoute("/doc/$docId")({
  component: DocPage,
});

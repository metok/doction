import { createFileRoute } from "@tanstack/react-router";
import { useDocContent } from "@/lib/hooks/use-doc-content";
import { useFileMetadata, useFilePath } from "@/lib/hooks/use-drive-files";
import { parseDocContent } from "@/lib/doc-parser";
import { DocRenderer } from "@/components/content/DocRenderer";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { useMemo } from "react";

export const Route = createFileRoute("/doc/$docId")({
  component: DocPage,
});

function DocPage() {
  const { docId } = Route.useParams();
  const { data: doc, isLoading, error } = useDocContent(docId);
  const { data: meta } = useFileMetadata(docId);
  const { data: path = [], isLoading: pathLoading } = useFilePath(docId);

  const blocks = useMemo(() => (doc ? parseDocContent(doc) : []), [doc]);

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
          <p className="text-red-400">Failed to load document: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <Breadcrumbs path={path} isLoading={pathLoading} file={meta} />
      <DocRenderer
        blocks={blocks}
        title={doc?.title ?? "Untitled"}
        lastModified={meta?.modifiedTime}
        docId={docId}
      />
    </div>
  );
}

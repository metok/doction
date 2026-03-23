import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useDocContent } from "@/lib/hooks/use-doc-content";
import { useFileMetadata, useFilePath } from "@/lib/hooks/use-drive-files";
import { parseDocContent } from "@/lib/doc-parser";
import { DocRenderer } from "@/components/content/DocRenderer";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";

function DocPage() {
  const { docId } = Route.useParams();

  const { data: doc, isLoading: docLoading, error: docError } = useDocContent(docId);
  const { data: meta } = useFileMetadata(docId);
  const { data: pathData, isLoading: pathLoading } = useFilePath(docId);

  const blocks = useMemo(() => {
    if (!doc) return [];
    return parseDocContent(doc);
  }, [doc]);

  if (docLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <Breadcrumbs isLoading={pathLoading} path={pathData} />
        <div className="mx-auto w-full max-w-3xl px-8 py-10">
          <div className="mb-4 h-8 w-2/3 animate-pulse rounded bg-bg-tertiary" />
          <div className="mb-2 h-4 w-1/4 animate-pulse rounded bg-bg-tertiary" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 animate-pulse rounded bg-bg-tertiary" style={{ width: `${70 + (i % 3) * 10}%` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (docError) {
    return (
      <div className="flex flex-1 flex-col">
        <Breadcrumbs path={pathData} />
        <div className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-lg font-semibold text-text-primary">Failed to load document</p>
            <p className="mt-1 text-sm text-text-muted">{(docError as Error).message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Breadcrumbs path={pathData} isLoading={pathLoading} />
      <DocRenderer
        title={doc?.title ?? meta?.name}
        lastModified={meta?.modifiedTime}
        blocks={blocks}
      />
    </div>
  );
}

export const Route = createFileRoute("/doc/$docId")({
  component: DocPage,
});

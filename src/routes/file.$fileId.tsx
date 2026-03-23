import { useEffect, useRef } from "react";
import { useTabsStore } from "@/lib/stores/tabs";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/api-context";
import { useFileMetadata, useFilePath } from "@/lib/hooks/use-drive-files";
import { isImage, isPdf } from "@/lib/google/types";
import { ImagePreview } from "@/components/content/ImagePreview";
import { PdfPreview } from "@/components/content/PdfPreview";
import { FileDownload } from "@/components/content/FileDownload";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";

function FilePage() {
  const { fileId } = Route.useParams();
  const { client, drive } = useApi();

  const { data: meta, isLoading: metaLoading } = useFileMetadata(fileId);
  const { data: pathData, isLoading: pathLoading } = useFilePath(fileId);
  const { updateTab, tabs } = useTabsStore();

  const prevUrlRef = useRef<string>();

  useEffect(() => {
    if (meta?.name) {
      const tab = tabs.find((t) => t.path === `/file/${fileId}`);
      if (tab) updateTab(tab.id, { title: meta.name, mimeType: meta.mimeType });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta?.name]);

  const { data: objectUrl, isLoading: blobLoading } = useQuery({
    queryKey: ["drive", "blob", fileId],
    queryFn: async () => {
      const blob = await client.getBlob(drive.getDownloadUrl(fileId));
      return URL.createObjectURL(blob);
    },
    enabled: !!fileId && !!meta && (isImage(meta.mimeType) || isPdf(meta.mimeType)),
    staleTime: 5 * 60 * 1000,
  });

  // Revoke previous blob URL to prevent memory leak
  useEffect(() => {
    if (prevUrlRef.current && prevUrlRef.current !== objectUrl) {
      URL.revokeObjectURL(prevUrlRef.current);
    }
    prevUrlRef.current = objectUrl;
    return () => {
      if (prevUrlRef.current) {
        URL.revokeObjectURL(prevUrlRef.current);
      }
    };
  }, [objectUrl]);

  const isLoading = metaLoading || blobLoading;

  if (metaLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <Breadcrumbs isLoading={pathLoading} path={pathData} file={meta} />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-pulse rounded-full bg-bg-tertiary" />
        </div>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="flex flex-1 flex-col">
        <Breadcrumbs path={pathData} />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-text-muted">File not found</p>
        </div>
      </div>
    );
  }

  const canPreview = isImage(meta.mimeType) || isPdf(meta.mimeType);

  if (!canPreview) {
    return (
      <div className="flex flex-1 flex-col">
        <Breadcrumbs path={pathData} isLoading={pathLoading} file={meta} />
        <FileDownload file={meta} downloadUrl={drive.getDownloadUrl(fileId)} />
      </div>
    );
  }

  if (isLoading || !objectUrl) {
    return (
      <div className="flex flex-1 flex-col">
        <Breadcrumbs path={pathData} isLoading={pathLoading} file={meta} />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" />
            <p className="text-sm text-text-muted">Loading file...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Breadcrumbs path={pathData} isLoading={pathLoading} file={meta} />
      {isImage(meta.mimeType) ? (
        <ImagePreview src={objectUrl} alt={meta.name} />
      ) : (
        <PdfPreview src={objectUrl} />
      )}
    </div>
  );
}

export const Route = createFileRoute("/file/$fileId")({
  component: FilePage,
});

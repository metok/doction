import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/api-context";
import { useFileMetadata, useFilePath } from "@/lib/hooks/use-drive-files";
import { isImage, isPdf } from "@/lib/google/types";
import { ImagePreview } from "@/components/content/ImagePreview";
import { PdfPreview } from "@/components/content/PdfPreview";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { ExternalLink } from "lucide-react";

function FilePage() {
  const { fileId } = Route.useParams();
  const { client, drive } = useApi();

  const { data: meta, isLoading: metaLoading } = useFileMetadata(fileId);
  const { data: pathData, isLoading: pathLoading } = useFilePath(fileId);

  const { data: objectUrl, isLoading: blobLoading } = useQuery({
    queryKey: ["drive", "blob", fileId],
    queryFn: async () => {
      const blob = await client.getBlob(drive.getDownloadUrl(fileId));
      return URL.createObjectURL(blob);
    },
    enabled: !!fileId && !!meta && (isImage(meta.mimeType) || isPdf(meta.mimeType)),
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = metaLoading || blobLoading;

  if (metaLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <Breadcrumbs isLoading={pathLoading} path={pathData} />
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
        <Breadcrumbs path={pathData} isLoading={pathLoading} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-lg font-semibold text-text-primary">Preview not available</p>
          <p className="text-sm text-text-muted">
            This file type ({meta.mimeType}) cannot be previewed here.
          </p>
          {meta.webViewLink && (
            <a
              href={meta.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
            >
              <ExternalLink className="h-4 w-4" />
              Open in Google Drive
            </a>
          )}
        </div>
      </div>
    );
  }

  if (isLoading || !objectUrl) {
    return (
      <div className="flex flex-1 flex-col">
        <Breadcrumbs path={pathData} isLoading={pathLoading} />
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
      <Breadcrumbs path={pathData} isLoading={pathLoading} />
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

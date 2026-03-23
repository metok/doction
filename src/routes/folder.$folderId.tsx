import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useDriveFiles, useFilePath } from "@/lib/hooks/use-drive-files";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { FolderView } from "@/components/content/FolderView";
import { isFolder } from "@/lib/google/types";

function FolderPage() {
  const { folderId } = Route.useParams();

  const { data: filesData, isLoading: filesLoading, isError: filesError } =
    useDriveFiles(folderId);
  const { data: pathData, isLoading: pathLoading } = useFilePath(folderId);

  const files = filesData?.files ?? [];
  const folders = files.filter((f) => isFolder(f.mimeType));
  const nonFolders = files.filter((f) => !isFolder(f.mimeType));
  const sorted = [...folders, ...nonFolders];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Breadcrumbs path={pathData} isLoading={pathLoading} />

      <div className="flex-1 overflow-y-auto p-6">
        {filesLoading && (
          <div className="flex flex-1 items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
          </div>
        )}

        {filesError && (
          <div className="rounded-lg border border-border bg-bg-secondary p-4 text-sm text-amber">
            Failed to load folder contents. Please try again.
          </div>
        )}

        {!filesLoading && !filesError && <FolderView files={sorted} />}
      </div>
    </div>
  );
}

export const Route = createFileRoute("/folder/$folderId")({
  component: FolderPage,
});

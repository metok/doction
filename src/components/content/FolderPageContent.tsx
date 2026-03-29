import { useEffect } from "react";
import { useDriveFiles, useFileMetadata, useFilePath } from "@/lib/hooks/use-drive-files";
import { FolderSkeleton } from "@/components/content/FolderSkeleton";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { FolderView } from "@/components/content/FolderView";
import { isFolder } from "@/lib/google/types";
import { useTabsStore } from "@/lib/stores/tabs";

export function FolderPageContent({ folderId }: { folderId: string }) {
  const { data: filesData, isLoading: filesLoading, isError: filesError } =
    useDriveFiles(folderId);
  const { data: pathData, isLoading: pathLoading } = useFilePath(folderId);
  const { data: folderMeta } = useFileMetadata(folderId);
  const { updateTab, tabs } = useTabsStore();

  useEffect(() => {
    // Use the resolved path name (handles shared drive names correctly)
    const resolvedName = pathData && pathData.length > 0
      ? pathData[pathData.length - 1].name
      : folderMeta?.name;
    if (resolvedName) {
      const tab = tabs.find((t) => t.path === `/folder/${folderId}`);
      if (tab) updateTab(tab.id, { title: resolvedName, mimeType: folderMeta?.mimeType ?? "application/vnd.google-apps.folder" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathData, folderMeta?.name]);

  const files = filesData?.files ?? [];
  const folders = files.filter((f) => isFolder(f.mimeType));
  const nonFolders = files.filter((f) => !isFolder(f.mimeType));
  const sorted = [...folders, ...nonFolders];

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Breadcrumbs path={pathData} isLoading={pathLoading} file={folderMeta} />

      <div className="flex-1 overflow-y-auto p-6">
        {filesLoading && <FolderSkeleton />}

        {filesError && (
          <div className="rounded-lg border border-border bg-bg-secondary p-4 text-sm text-amber">
            Failed to load folder contents. Please try again.
          </div>
        )}

        {!filesLoading && !filesError && <FolderView files={sorted} folderId={folderId} />}
      </div>
    </div>
  );
}

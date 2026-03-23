import { useDriveFiles } from "@/lib/hooks/use-drive-files";
import { isFolder } from "@/lib/google/types";
import { FolderNode } from "./FolderNode";

export function FolderTree() {
  const { data, isLoading, isError } = useDriveFiles("root");

  const files = data?.files ?? [];
  const folders = files.filter((f) => isFolder(f.mimeType));
  const nonFolders = files.filter((f) => !isFolder(f.mimeType));
  const sorted = [...folders, ...nonFolders];

  return (
    <div className="flex flex-col">
      <div className="px-2 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-text-muted">
        My Drive
      </div>

      {isLoading && (
        <div className="space-y-1 px-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-6 animate-pulse rounded bg-bg-tertiary"
              style={{ width: `${60 + i * 8}%` }}
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="px-3 py-2 text-xs text-amber">
          Failed to load Drive files
        </div>
      )}

      {!isLoading && !isError && (
        <div className="px-1">
          {sorted.map((file) => (
            <FolderNode key={file.id} file={file} depth={0} />
          ))}
          {sorted.length === 0 && (
            <div className="px-3 py-2 text-xs text-text-muted">
              No files found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useStarredFiles } from "@/lib/hooks/use-drive-files";
import { FolderView } from "@/components/content/FolderView";
import { isFolder } from "@/lib/google/types";

function FavoritesPage() {
  const { data, isLoading, isError } = useStarredFiles();

  const files = data?.files ?? [];
  const folders = files.filter((f) => isFolder(f.mimeType));
  const nonFolders = files.filter((f) => !isFolder(f.mimeType));
  const sorted = [...folders, ...nonFolders];

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">Favorites</h1>
        <p className="mt-1 text-sm text-text-secondary">Your starred files</p>
      </div>

      {isLoading && (
        <div className="flex flex-1 items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-border bg-bg-secondary p-4 text-sm text-amber">
          Failed to load starred files. Please try again.
        </div>
      )}

      {!isLoading && !isError && <FolderView files={sorted} />}
    </div>
  );
}

export const Route = createFileRoute("/favorites")({
  component: FavoritesPage,
});

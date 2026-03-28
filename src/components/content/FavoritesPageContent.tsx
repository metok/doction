import { useFavoritesStore } from "@/lib/stores/favorites";
import { FolderView } from "@/components/content/FolderView";
import { isFolder } from "@/lib/google/types";

export function FavoritesPageContent() {
  const files = useFavoritesStore((s) => s.files);

  const folders = files.filter((f) => isFolder(f.mimeType));
  const nonFolders = files.filter((f) => !isFolder(f.mimeType));
  const sorted = [...folders, ...nonFolders];

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">Favorites</h1>
        <p className="mt-1 text-sm text-text-secondary">Your starred files</p>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-text-muted">No favorites yet</p>
          <p className="mt-1 text-xs text-text-muted">
            Star files to add them here
          </p>
        </div>
      ) : (
        <FolderView files={sorted} />
      )}
    </div>
  );
}

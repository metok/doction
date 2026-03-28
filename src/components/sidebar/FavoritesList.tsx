import { isFolder, isDocument, isSpreadsheet, isImage } from "@/lib/google/types";
import { Folder, FileText, Sheet, Image, File, Star, X } from "lucide-react";
import { useFavoritesStore } from "@/lib/stores/favorites";
import { useFileNavigation } from "@/lib/hooks/use-file-navigation";

function FileIcon({ mimeType }: { mimeType: string }) {
  if (isFolder(mimeType)) return <Folder className="h-4 w-4 shrink-0 text-purple-400" />;
  if (isDocument(mimeType)) return <FileText className="h-4 w-4 shrink-0 text-blue-400" />;
  if (isSpreadsheet(mimeType)) return <Sheet className="h-4 w-4 shrink-0 text-emerald-400" />;
  if (isImage(mimeType)) return <Image className="h-4 w-4 shrink-0 text-pink-400" />;
  return <File className="h-4 w-4 shrink-0 text-text-muted" />;
}

export function FavoritesList() {
  const files = useFavoritesStore((s) => s.files);
  const remove = useFavoritesStore((s) => s.remove);
  const navigateTo = useFileNavigation();

  if (files.length === 0) return null;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        <Star className="h-3 w-3" />
        Favorites
      </div>
      {files.map((file) => (
        <div key={file.id} className="group flex cursor-pointer items-center gap-2 rounded-md px-3 py-[6px] text-[13px] text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary">
          <button
            onClick={(e) => navigateTo(file, e)}
            className="flex flex-1 items-center gap-2 text-left"
          >
            <FileIcon mimeType={file.mimeType} />
            <span className="truncate">{file.name}</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); remove(file.id); }}
            className="hidden shrink-0 cursor-pointer rounded p-0.5 text-text-muted opacity-0 transition-opacity group-hover:block group-hover:opacity-100 hover:text-text-primary"
            title="Remove from favorites"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

import { Link } from "@tanstack/react-router";
import { isFolder, isDocument, isSpreadsheet, isImage } from "@/lib/google/types";
import type { DriveFile } from "@/lib/google/types";
import { Folder, FileText, Sheet, Image, File, Star, X } from "lucide-react";
import { useFavoritesStore } from "@/lib/stores/favorites";

function FileIcon({ mimeType }: { mimeType: string }) {
  if (isFolder(mimeType)) return <Folder className="h-4 w-4 shrink-0 text-purple-400" />;
  if (isDocument(mimeType)) return <FileText className="h-4 w-4 shrink-0 text-blue-400" />;
  if (isSpreadsheet(mimeType)) return <Sheet className="h-4 w-4 shrink-0 text-emerald-400" />;
  if (isImage(mimeType)) return <Image className="h-4 w-4 shrink-0 text-pink-400" />;
  return <File className="h-4 w-4 shrink-0 text-text-muted" />;
}

function getRoute(file: DriveFile) {
  if (isFolder(file.mimeType)) return { to: "/folder/$folderId" as const, params: { folderId: file.id } };
  if (isDocument(file.mimeType)) return { to: "/doc/$docId" as const, params: { docId: file.id } };
  if (isSpreadsheet(file.mimeType)) return { to: "/sheet/$sheetId" as const, params: { sheetId: file.id } };
  return { to: "/file/$fileId" as const, params: { fileId: file.id } };
}

export function FavoritesList() {
  const files = useFavoritesStore((s) => s.files);
  const remove = useFavoritesStore((s) => s.remove);

  if (files.length === 0) return null;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        <Star className="h-3 w-3" />
        Favorites
      </div>
      {files.map((file) => {
        const route = getRoute(file);
        return (
          <div key={file.id} className="group flex cursor-pointer items-center gap-2 rounded-md px-3 py-[6px] text-[13px] text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary">
            <Link
              to={route.to}
              params={route.params as any}
              className="flex flex-1 items-center gap-2"
            >
              <FileIcon mimeType={file.mimeType} />
              <span className="truncate">{file.name}</span>
            </Link>
            <button
              onClick={(e) => { e.stopPropagation(); remove(file.id); }}
              className="hidden shrink-0 cursor-pointer rounded p-0.5 text-text-muted opacity-0 transition-opacity group-hover:block group-hover:opacity-100 hover:text-text-primary"
              title="Remove from favorites"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

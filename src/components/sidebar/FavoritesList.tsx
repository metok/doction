import { useStarredFiles } from "@/lib/hooks/use-drive-files";
import { Link } from "@tanstack/react-router";
import { isFolder, isDocument, isSpreadsheet, isImage, isPdf } from "@/lib/google/types";
import type { DriveFile } from "@/lib/google/types";
import { Folder, FileText, Sheet, Image, File, Star } from "lucide-react";

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
  if (isImage(file.mimeType) || isPdf(file.mimeType)) return { to: "/file/$fileId" as const, params: { fileId: file.id } };
  return { to: "/file/$fileId" as const, params: { fileId: file.id } };
}

export function FavoritesList() {
  const { data, isLoading } = useStarredFiles();
  const files = data?.files?.slice(0, 10) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-1 px-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-5 animate-pulse rounded bg-bg-tertiary" style={{ width: `${50 + i * 15}%` }} />
        ))}
      </div>
    );
  }

  if (files.length === 0) return null;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 px-2 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        <Star className="h-3 w-3" />
        Favorites
      </div>
      {files.map((file) => {
        const route = getRoute(file);
        return (
          <Link
            key={file.id}
            to={route.to}
            params={route.params as Record<string, string>}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-[7px] text-[13px] text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          >
            <FileIcon mimeType={file.mimeType} />
            <span className="truncate">{file.name}</span>
          </Link>
        );
      })}
    </div>
  );
}

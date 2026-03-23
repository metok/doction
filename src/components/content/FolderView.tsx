import { useRouter } from "@tanstack/react-router";
import { LayoutGrid, List, Folder, FileText, Sheet, Image, File } from "lucide-react";
import { usePreferencesStore } from "@/lib/stores/preferences";
import { useRecentStore } from "@/lib/stores/recent";
import {
  isFolder,
  isDocument,
  isSpreadsheet,
  isImage,
  isPdf,
} from "@/lib/google/types";
import type { DriveFile } from "@/lib/google/types";

interface FolderViewProps {
  files: DriveFile[];
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

function FileIcon({
  mimeType,
  size = "sm",
}: {
  mimeType: string;
  size?: "sm" | "lg";
}) {
  const cls = size === "lg" ? "h-10 w-10" : "h-4 w-4";
  if (isFolder(mimeType))
    return <Folder className={`${cls} shrink-0 text-purple-400`} />;
  if (isDocument(mimeType))
    return <FileText className={`${cls} shrink-0 text-accent`} />;
  if (isSpreadsheet(mimeType))
    return <Sheet className={`${cls} shrink-0 text-green`} />;
  if (isImage(mimeType))
    return <Image className={`${cls} shrink-0 text-text-muted`} />;
  return <File className={`${cls} shrink-0 text-text-muted`} />;
}

export function FolderView({ files }: FolderViewProps) {
  const { viewMode, setViewMode } = usePreferencesStore();
  const { addFile } = useRecentStore();
  const router = useRouter();

  function navigateTo(file: DriveFile) {
    addFile(file);
    if (isFolder(file.mimeType)) {
      router.navigate({
        to: "/folder/$folderId",
        params: { folderId: file.id },
      });
    } else if (isDocument(file.mimeType)) {
      router.navigate({ to: "/doc/$docId", params: { docId: file.id } });
    } else if (isSpreadsheet(file.mimeType)) {
      router.navigate({
        to: "/sheet/$sheetId",
        params: { sheetId: file.id },
      });
    } else if (isImage(file.mimeType) || isPdf(file.mimeType)) {
      router.navigate({ to: "/file/$fileId", params: { fileId: file.id } });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* View toggle */}
      <div className="flex justify-end gap-1">
        <button
          onClick={() => setViewMode("grid")}
          className={`rounded p-1.5 transition-colors ${
            viewMode === "grid"
              ? "bg-bg-tertiary text-text-primary"
              : "text-text-muted hover:text-text-secondary"
          }`}
          aria-label="Grid view"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={`rounded p-1.5 transition-colors ${
            viewMode === "list"
              ? "bg-bg-tertiary text-text-primary"
              : "text-text-muted hover:text-text-secondary"
          }`}
          aria-label="List view"
        >
          <List className="h-4 w-4" />
        </button>
      </div>

      {/* Grid view */}
      {viewMode === "grid" && (
        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}
        >
          {files.map((file) => (
            <button
              key={file.id}
              onClick={() => navigateTo(file)}
              className="flex flex-col items-start gap-2 rounded-lg border border-border bg-bg-secondary p-3 text-left transition-colors hover:bg-bg-tertiary"
            >
              <FileIcon mimeType={file.mimeType} size="lg" />
              <div className="w-full">
                <p className="truncate text-sm font-medium text-text-primary">
                  {file.name}
                </p>
                {file.modifiedTime && (
                  <p className="mt-0.5 text-xs text-text-muted">
                    {formatDate(file.modifiedTime)}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* List view */}
      {viewMode === "list" && (
        <div className="flex flex-col gap-0.5">
          {files.map((file) => (
            <button
              key={file.id}
              onClick={() => navigateTo(file)}
              className="flex items-center gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-bg-tertiary"
            >
              <FileIcon mimeType={file.mimeType} size="sm" />
              <span className="flex-1 truncate text-sm text-text-primary">
                {file.name}
              </span>
              {file.modifiedTime && (
                <span className="shrink-0 text-xs text-text-muted">
                  {formatDate(file.modifiedTime)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

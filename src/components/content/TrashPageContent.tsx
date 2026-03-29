import { useState } from "react";
import {
  Loader2,
  RotateCcw,
  Folder,
  FileText,
  Sheet,
  Image,
  File,
  Presentation,
  FileArchive,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTrashedFiles } from "@/lib/hooks/use-drive-files";
import { useApi } from "@/lib/api-context";
import {
  isFolder,
  isDocument,
  isSpreadsheet,
  isImage,
  isPdf,
} from "@/lib/google/types";
import type { DriveFile } from "@/lib/google/types";

function getFileIcon(mimeType: string) {
  if (isFolder(mimeType))
    return { icon: <Folder className="h-4 w-4" />, color: "text-purple-400" };
  if (isDocument(mimeType))
    return { icon: <FileText className="h-4 w-4" />, color: "text-blue-400" };
  if (isSpreadsheet(mimeType))
    return { icon: <Sheet className="h-4 w-4" />, color: "text-emerald-400" };
  if (mimeType.includes("presentation"))
    return {
      icon: <Presentation className="h-4 w-4" />,
      color: "text-amber-400",
    };
  if (isImage(mimeType))
    return { icon: <Image className="h-4 w-4" />, color: "text-pink-400" };
  if (isPdf(mimeType))
    return { icon: <File className="h-4 w-4" />, color: "text-red-400" };
  if (
    mimeType.includes("zip") ||
    mimeType.includes("archive") ||
    mimeType.includes("compressed")
  )
    return {
      icon: <FileArchive className="h-4 w-4" />,
      color: "text-orange-400",
    };
  return { icon: <File className="h-4 w-4" />, color: "text-gray-400" };
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
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? "month" : "months"} ago`;
  }
  const years = Math.floor(diffDays / 365);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}

function TrashFileRow({ file }: { file: DriveFile }) {
  const { drive } = useApi();
  const queryClient = useQueryClient();
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const restoreMutation = useMutation({
    mutationFn: (fileId: string) => drive.restoreFile(fileId),
    onMutate: (fileId) => setRestoringId(fileId),
    onSettled: () => {
      setRestoringId(null);
      queryClient.invalidateQueries({ queryKey: ["drive", "trashed"] });
    },
  });

  const { icon, color } = getFileIcon(file.mimeType);
  const isRestoring = restoringId === file.id;

  return (
    <div className="flex w-full items-center gap-3 border-b border-border/30 px-4 py-3 last:border-b-0">
      <span className={color}>{icon}</span>
      <span className="flex-1 truncate text-sm text-text-primary">
        {file.name}
      </span>
      {file.modifiedTime && (
        <span className="w-24 shrink-0 text-right text-xs text-text-muted">
          {formatDate(file.modifiedTime)}
        </span>
      )}
      <button
        onClick={() => restoreMutation.mutate(file.id)}
        disabled={isRestoring}
        className="ml-2 flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary disabled:pointer-events-none disabled:opacity-50"
        title="Restore from trash"
      >
        {isRestoring ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RotateCcw className="h-3.5 w-3.5" />
        )}
        Restore
      </button>
    </div>
  );
}

export function TrashPageContent() {
  const { data, isLoading, isError } = useTrashedFiles();

  const files = data?.files ?? [];
  const folders = files.filter((f) => isFolder(f.mimeType));
  const nonFolders = files.filter((f) => !isFolder(f.mimeType));
  const sorted = [...folders, ...nonFolders];

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">Trash</h1>
        <p className="mt-1 text-sm text-text-secondary">Deleted files</p>
      </div>

      {isLoading && (
        <div className="flex flex-1 items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
        </div>
      )}

      {isError && (
        <div className="rounded-lg border border-border bg-bg-secondary p-4 text-sm text-amber">
          Failed to load trashed files. Please try again.
        </div>
      )}

      {!isLoading && !isError && sorted.length === 0 && (
        <div className="flex flex-1 items-center justify-center py-16 text-sm text-text-muted">
          Trash is empty
        </div>
      )}

      {!isLoading && !isError && sorted.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border/60">
          <div className="flex items-center gap-4 border-b border-border/60 bg-bg-secondary/50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            <span className="flex-1">Name</span>
            <span className="w-24 text-right">Deleted</span>
            <span className="ml-2 w-[88px]" />
          </div>
          {sorted.map((file) => (
            <TrashFileRow key={file.id} file={file} />
          ))}
        </div>
      )}
    </div>
  );
}

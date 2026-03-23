import { useRouter } from "@tanstack/react-router";
import { LayoutGrid, List, Folder, FileText, Sheet, Image, File, FileArchive, Presentation } from "lucide-react";
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
import { SortableFileList } from "@/components/dnd/SortableFileList";

interface FolderViewProps {
  files: DriveFile[];
  folderId?: string;
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

// File type config for colors and icons
function getFileTypeConfig(mimeType: string): {
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
  label: string;
} {
  if (isFolder(mimeType))
    return {
      icon: <Folder className="h-6 w-6" />,
      bgColor: "bg-purple-500/10",
      iconColor: "text-purple-400",
      label: "Folder",
    };
  if (isDocument(mimeType))
    return {
      icon: <FileText className="h-6 w-6" />,
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-400",
      label: "Document",
    };
  if (isSpreadsheet(mimeType))
    return {
      icon: <Sheet className="h-6 w-6" />,
      bgColor: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      label: "Spreadsheet",
    };
  if (mimeType.includes("presentation"))
    return {
      icon: <Presentation className="h-6 w-6" />,
      bgColor: "bg-amber-500/10",
      iconColor: "text-amber-400",
      label: "Slides",
    };
  if (isImage(mimeType))
    return {
      icon: <Image className="h-6 w-6" />,
      bgColor: "bg-pink-500/10",
      iconColor: "text-pink-400",
      label: "Image",
    };
  if (isPdf(mimeType))
    return {
      icon: <File className="h-6 w-6" />,
      bgColor: "bg-red-500/10",
      iconColor: "text-red-400",
      label: "PDF",
    };
  if (mimeType.includes("zip") || mimeType.includes("archive") || mimeType.includes("compressed"))
    return {
      icon: <FileArchive className="h-6 w-6" />,
      bgColor: "bg-orange-500/10",
      iconColor: "text-orange-400",
      label: "Archive",
    };
  return {
    icon: <File className="h-6 w-6" />,
    bgColor: "bg-gray-500/10",
    iconColor: "text-gray-400",
    label: "File",
  };
}

function SmallFileIcon({ mimeType }: { mimeType: string }) {
  const config = getFileTypeConfig(mimeType);
  return <span className={`${config.iconColor} [&>svg]:h-4 [&>svg]:w-4`}>{config.icon}</span>;
}

export function FolderView({ files, folderId = "root" }: FolderViewProps) {
  const { viewMode, setViewMode } = usePreferencesStore();
  const { addFile } = useRecentStore();
  const router = useRouter();

  function navigateTo(file: DriveFile) {
    addFile(file);
    if (isFolder(file.mimeType)) {
      router.navigate({ to: "/folder/$folderId", params: { folderId: file.id } });
    } else if (isDocument(file.mimeType)) {
      router.navigate({ to: "/doc/$docId", params: { docId: file.id } });
    } else if (isSpreadsheet(file.mimeType)) {
      router.navigate({ to: "/sheet/$sheetId", params: { sheetId: file.id } });
    } else if (isImage(file.mimeType) || isPdf(file.mimeType)) {
      router.navigate({ to: "/file/$fileId", params: { fileId: file.id } });
    }
  }

  return (
    <div className="flex flex-col gap-6 px-8 pb-10">
      {/* View toggle */}
      <div className="flex justify-end gap-1">
        <button
          onClick={() => setViewMode("grid")}
          className={`rounded-lg p-2 transition-colors ${
            viewMode === "grid"
              ? "bg-bg-tertiary text-text-primary"
              : "text-text-muted hover:bg-bg-tertiary/50 hover:text-text-secondary"
          }`}
          aria-label="Grid view"
        >
          <LayoutGrid className="h-4 w-4" />
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={`rounded-lg p-2 transition-colors ${
            viewMode === "list"
              ? "bg-bg-tertiary text-text-primary"
              : "text-text-muted hover:bg-bg-tertiary/50 hover:text-text-secondary"
          }`}
          aria-label="List view"
        >
          <List className="h-4 w-4" />
        </button>
      </div>

      {/* Grid view */}
      {viewMode === "grid" && (
        <div
          className="grid gap-5"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}
        >
          <SortableFileList
            folderId={folderId}
            files={files}
            viewMode="grid"
            renderItem={(file, { setNodeRef, style, attributes, listeners }) => {
              const config = getFileTypeConfig(file.mimeType);
              return (
                <button
                  ref={setNodeRef}
                  style={style}
                  {...attributes}
                  {...listeners}
                  onClick={() => navigateTo(file)}
                  className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-bg-secondary text-left transition-all duration-200 hover:border-border hover:bg-bg-tertiary/50 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5"
                >
                  {/* Icon preview area */}
                  <div className={`flex h-28 items-center justify-center ${config.bgColor}`}>
                    <div className={`${config.iconColor} transition-transform duration-200 group-hover:scale-110`}>
                      {config.icon}
                    </div>
                  </div>
                  {/* Info */}
                  <div className="flex flex-col gap-1.5 p-4">
                    <p className="truncate text-sm font-medium text-text-primary">
                      {file.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-text-muted">{config.label}</span>
                      {file.modifiedTime && (
                        <>
                          <span className="text-[11px] text-text-muted/40">·</span>
                          <span className="text-[11px] text-text-muted">
                            {formatDate(file.modifiedTime)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </button>
              );
            }}
            renderOverlay={(file) => {
              const config = getFileTypeConfig(file.mimeType);
              return (
                <div className="flex flex-col overflow-hidden rounded-xl border border-accent/30 bg-bg-secondary shadow-2xl shadow-accent/10">
                  <div className={`flex h-28 items-center justify-center ${config.bgColor}`}>
                    <div className={config.iconColor}>{config.icon}</div>
                  </div>
                  <div className="p-3.5">
                    <p className="truncate text-sm font-medium text-text-primary">{file.name}</p>
                  </div>
                </div>
              );
            }}
          />
        </div>
      )}

      {/* List view */}
      {viewMode === "list" && (
        <div className="overflow-hidden rounded-xl border border-border/60">
          {/* List header */}
          <div className="flex items-center gap-4 border-b border-border/60 bg-bg-secondary/50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            <span className="flex-1">Name</span>
            <span className="w-24 text-right">Modified</span>
          </div>
          <SortableFileList
            folderId={folderId}
            files={files}
            viewMode="list"
            renderItem={(file, { setNodeRef, style, attributes, listeners }) => (
              <button
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                onClick={() => navigateTo(file)}
                className="flex w-full items-center gap-3 border-b border-border/30 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-bg-tertiary/40"
              >
                <SmallFileIcon mimeType={file.mimeType} />
                <span className="flex-1 truncate text-sm text-text-primary">
                  {file.name}
                </span>
                {file.modifiedTime && (
                  <span className="w-24 shrink-0 text-right text-xs text-text-muted">
                    {formatDate(file.modifiedTime)}
                  </span>
                )}
              </button>
            )}
            renderOverlay={(file) => (
              <div className="flex items-center gap-3 rounded-lg border border-accent/30 bg-bg-secondary px-4 py-3 shadow-2xl shadow-accent/10">
                <SmallFileIcon mimeType={file.mimeType} />
                <span className="flex-1 truncate text-sm text-text-primary">{file.name}</span>
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
}

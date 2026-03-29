import { useState, useCallback, useEffect, useRef } from "react";
import { LayoutGrid, List, Loader2, Folder, FileText, Sheet, Image, File, FileArchive, Presentation, ExternalLink, Star, EyeOff, Link, Trash2, FolderOpen } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { usePreferencesStore } from "@/lib/stores/preferences";
import { useDriveFiles } from "@/lib/hooks/use-drive-files";
import {
  isFolder,
  isDocument,
  isSpreadsheet,
  isImage,
  isPdf,
} from "@/lib/google/types";
import type { DriveFile } from "@/lib/google/types";
import { SortableFileList } from "@/components/dnd/SortableFileList";
import { useFileNavigation } from "@/lib/hooks/use-file-navigation";
import { useFavoritesStore } from "@/lib/stores/favorites";
import { useHiddenItemsStore } from "@/lib/stores/hidden-items";
import { useApi } from "@/lib/api-context";
import { trashFile } from "@/lib/google/mutations";
import { ContextMenu } from "@/components/ui/ContextMenu";
import type { ContextMenuItem } from "@/components/ui/ContextMenu";

interface FolderViewProps {
  files: DriveFile[];
  folderId?: string;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  isFetchingNextPage?: boolean;
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

/** Mini preview grid showing first few items inside a folder */
function FolderPreview({ folderId }: { folderId: string }) {
  const { data, isLoading } = useDriveFiles(folderId, true);
  const children = (data?.pages.flatMap((p) => p.files ?? []) ?? []).slice(0, 4);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="grid grid-cols-2 gap-1.5 opacity-30">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-6 w-8 animate-pulse rounded bg-white/10" />
          ))}
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1">
        <Folder className="h-7 w-7 text-purple-400/60" />
        <span className="text-[10px] text-text-muted/60">Empty</span>
      </div>
    );
  }

  return (
    <div className="flex h-full items-center justify-center p-3">
      <div className="grid grid-cols-2 gap-1.5">
        {children.map((child) => {
          const cfg = getFileTypeConfig(child.mimeType);
          return (
            <div
              key={child.id}
              className={`flex h-7 w-10 items-center justify-center rounded ${cfg.bgColor}`}
            >
              <span className={`${cfg.iconColor} [&>svg]:h-3 [&>svg]:w-3`}>
                {cfg.icon}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function FolderView({ files, folderId = "root", hasNextPage, fetchNextPage, isFetchingNextPage }: FolderViewProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || !fetchNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, fetchNextPage]);

  const { viewMode, setViewMode } = usePreferencesStore();
  const navigateTo = useFileNavigation();
  const { client } = useApi();
  const queryClient = useQueryClient();
  const favoritesStore = useFavoritesStore();
  const hiddenItemsStore = useHiddenItemsStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: DriveFile } | null>(null);

  const handleContextMenu = useCallback((e: React.MouseEvent, file: DriveFile) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  }, []);

  const getContextMenuItems = useCallback(
    (file: DriveFile): ContextMenuItem[] => {
      const isFav = favoritesStore.isFavorite(file.id);
      return [
        {
          label: "Open",
          icon: FolderOpen,
          onClick: () => navigateTo(file),
        },
        {
          label: isFav ? "Unfavorite" : "Favorite",
          icon: Star,
          onClick: () => favoritesStore.toggle(file),
        },
        {
          label: "Hide",
          icon: EyeOff,
          onClick: () => hiddenItemsStore.toggle(file.id),
        },
        {
          label: "Open in Drive",
          icon: ExternalLink,
          onClick: () => {
            if (file.webViewLink) window.open(file.webViewLink, "_blank");
          },
        },
        {
          label: "Copy link",
          icon: Link,
          onClick: () => {
            if (file.webViewLink) navigator.clipboard.writeText(file.webViewLink);
          },
        },
        {
          label: "Delete",
          icon: Trash2,
          danger: true,
          onClick: async () => {
            await trashFile(client, file.id);
            queryClient.invalidateQueries({ queryKey: ["drive"] });
          },
        },
      ];
    },
    [favoritesStore, hiddenItemsStore, navigateTo, client, queryClient],
  );

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
                  onClick={(e) => navigateTo(file, e)}
                  onContextMenu={(e) => handleContextMenu(e, file)}
                  className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border/60 bg-bg-secondary text-left transition-all duration-200 hover:border-border hover:bg-bg-tertiary/50 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5"
                >
                  {/* Preview area */}
                  <div className={`h-28 ${config.bgColor}`}>
                    {isFolder(file.mimeType) ? (
                      <FolderPreview folderId={file.id} />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <div className={`${config.iconColor} transition-transform duration-200 group-hover:scale-110`}>
                          {config.icon}
                        </div>
                      </div>
                    )}
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
                onClick={(e) => navigateTo(file, e)}
                onContextMenu={(e) => handleContextMenu(e, file)}
                className="flex w-full cursor-pointer items-center gap-3 border-b border-border/30 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-bg-tertiary/40"
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

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-1" />
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
        </div>
      )}

      {contextMenu && (
        <ContextMenu
          items={getContextMenuItems(contextMenu.file)}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}

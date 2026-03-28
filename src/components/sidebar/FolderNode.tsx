import { useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  Folder,
  FileText,
  Sheet,
  Image,
  File,
  Plus,
  Star,
  EyeOff,
} from "lucide-react";
import { useDriveFiles } from "@/lib/hooks/use-drive-files";
import {
  isFolder as isFolderType,
  isDocument,
  isSpreadsheet,
  isImage,
} from "@/lib/google/types";
import type { DriveFile } from "@/lib/google/types";
import { useTreeStateStore } from "@/lib/stores/tree-state";
import { useFavoritesStore } from "@/lib/stores/favorites";
import { useHiddenItemsStore } from "@/lib/stores/hidden-items";
import { useFileNavigation } from "@/lib/hooks/use-file-navigation";

interface FolderNodeProps {
  file: DriveFile;
  depth?: number;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (isFolderType(mimeType)) {
    return <Folder className="h-4 w-4 shrink-0 text-purple-400" />;
  }
  if (isDocument(mimeType)) {
    return <FileText className="h-4 w-4 shrink-0 text-accent" />;
  }
  if (isSpreadsheet(mimeType)) {
    return <Sheet className="h-4 w-4 shrink-0 text-green" />;
  }
  if (isImage(mimeType)) {
    return <Image className="h-4 w-4 shrink-0 text-text-muted" />;
  }
  return <File className="h-4 w-4 shrink-0 text-text-muted" />;
}

function FavoriteButton({ file }: { file: DriveFile }) {
  const isFav = useFavoritesStore((s) => s.isFavorite(file.id));
  const toggle = useFavoritesStore((s) => s.toggle);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggle(file);
      }}
      className={`cursor-pointer rounded p-0.5 transition-colors ${
        isFav
          ? "text-amber-400 hover:text-amber-300"
          : "text-text-muted hover:bg-bg-tertiary hover:text-amber-400"
      }`}
      title={isFav ? "Remove from favorites" : "Add to favorites"}
    >
      <Star className={`h-3.5 w-3.5 ${isFav ? "fill-amber-400" : ""}`} />
    </button>
  );
}

export function FolderNode({ file, depth = 0 }: FolderNodeProps) {
  const isFav = useFavoritesStore((s) => s.isFavorite(file.id));
  const isHidden = useHiddenItemsStore((s) => s.isHidden(file.id));
  const showHidden = useHiddenItemsStore((s) => s.showHidden);
  const toggleHidden = useHiddenItemsStore((s) => s.toggle);
  const expanded = useTreeStateStore((s) => s.isExpanded(file.id));
  const highlightId = useTreeStateStore((s) => s.highlightId);
  const setHighlight = useTreeStateStore((s) => s.setHighlight);
  const toggle = useTreeStateStore((s) => s.toggle);
  const navigateTo = useFileNavigation();
  const rowRef = useRef<HTMLDivElement>(null);
  const isHighlighted = highlightId === file.id;

  // Scroll into view and flash when highlighted
  useEffect(() => {
    if (isHighlighted && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      const timer = setTimeout(() => setHighlight(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [isHighlighted, setHighlight]);
  const isFolder = isFolderType(file.mimeType);
  const shouldFetch = isFolder && expanded && !(isHidden && !showHidden);

  const { data, isLoading } = useDriveFiles(
    shouldFetch ? file.id : "",
    shouldFetch,
  );

  // Don't render if hidden (unless showHidden is on) — AFTER all hooks
  if (isHidden && !showHidden) return null;

  const children = data?.files ?? [];
  const folders = children.filter((f) => isFolderType(f.mimeType));
  const files = children.filter((f) => !isFolderType(f.mimeType));
  const sorted = [...folders, ...files];

  function handleChevronClick(e: React.MouseEvent) {
    e.stopPropagation();
    toggle(file.id);
  }

  function handleNameClick(e: React.MouseEvent) {
    navigateTo(file, e);
  }

  return (
    <div>
      <div
        ref={rowRef}
        className={`group flex cursor-pointer items-center gap-2 rounded-md py-[7px] pr-2 text-[13px] transition-all hover:bg-bg-tertiary hover:text-text-primary ${isHidden ? "text-text-muted/50 italic" : "text-text-secondary"} ${isHighlighted ? "bg-accent/15 text-text-primary ring-1 ring-accent/30" : ""}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleNameClick}
      >
        {/* Chevron or spacer */}
        <span
          className="flex h-4 w-4 shrink-0 items-center justify-center"
          onClick={isFolder ? handleChevronClick : undefined}
        >
          {isFolder && (
            <motion.span
              animate={{ rotate: expanded ? 90 : 0 }}
              transition={{ duration: 0.15 }}
              className="flex"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </motion.span>
          )}
        </span>

        <FileIcon mimeType={file.mimeType} />

        <span className="flex-1 truncate">{file.name}</span>

        {/* Favorite indicator — always visible */}
        {isFav && (
          <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400 group-hover:hidden" />
        )}

        {isLoading && (
          <span className="h-2 w-2 animate-pulse rounded-full bg-text-muted" />
        )}

        {/* Hover actions */}
        <div className="hidden shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:flex group-hover:opacity-100">
          <FavoriteButton file={file} />
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleHidden(file.id);
            }}
            className={`cursor-pointer rounded p-0.5 transition-colors ${isHidden ? "text-text-muted hover:text-text-primary" : "text-text-muted hover:bg-bg-tertiary hover:text-text-primary"}`}
            title={isHidden ? "Show item" : "Hide item"}
          >
            <EyeOff className="h-3.5 w-3.5" />
          </button>
          {isFolder && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(`https://docs.google.com/document/create?folder=${file.id}`, "_blank");
              }}
              className="cursor-pointer rounded p-0.5 text-text-muted hover:bg-bg-tertiary hover:text-text-primary"
              title="New doc in this folder"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="children"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ overflow: "hidden" }}
          >
            {sorted.map((child) => (
              <FolderNode key={child.id} file={child} depth={depth + 1} />
            ))}
            {shouldFetch && !isLoading && sorted.length === 0 && (
              <div
                className="py-1 text-xs text-text-muted"
                style={{ paddingLeft: `${(depth + 1) * 16 + 4}px` }}
              >
                Empty folder
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useRouter } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  Folder,
  FileText,
  Sheet,
  Image,
  File,
  Plus,
} from "lucide-react";
import { useDriveFiles } from "@/lib/hooks/use-drive-files";
import {
  isFolder as isFolderType,
  isDocument,
  isSpreadsheet,
  isImage,
  isPdf,
} from "@/lib/google/types";
import type { DriveFile } from "@/lib/google/types";
import { useTreeStateStore } from "@/lib/stores/tree-state";

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

export function FolderNode({ file, depth = 0 }: FolderNodeProps) {
  const expanded = useTreeStateStore((s) => s.isExpanded(file.id));
  const toggle = useTreeStateStore((s) => s.toggle);
  const router = useRouter();
  const isFolder = isFolderType(file.mimeType);
  const shouldFetch = isFolder && expanded;

  const { data, isLoading } = useDriveFiles(
    shouldFetch ? file.id : "",
    shouldFetch,
  );

  const children = data?.files ?? [];
  const folders = children.filter((f) => isFolderType(f.mimeType));
  const files = children.filter((f) => !isFolderType(f.mimeType));
  const sorted = [...folders, ...files];

  function handleChevronClick(e: React.MouseEvent) {
    e.stopPropagation();
    toggle(file.id);
  }

  function handleNameClick() {
    if (isFolder) {
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
    <div>
      <div
        className="group flex cursor-pointer items-center gap-2 rounded-md py-[7px] pr-2 text-[13px] text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
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

        {isLoading && (
          <span className="h-2 w-2 animate-pulse rounded-full bg-text-muted" />
        )}

        {isFolder && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(`https://docs.google.com/document/create?folder=${file.id}`, "_blank");
            }}
            className="hidden shrink-0 rounded p-0.5 text-text-muted opacity-0 transition-opacity group-hover:block group-hover:opacity-100 hover:bg-bg-tertiary hover:text-text-primary"
            title="New doc in this folder"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
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

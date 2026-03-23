import { AnimatePresence, motion } from "framer-motion";
import { X, Folder, FileText, Sheet, Image, File } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { useActivity } from "@/lib/hooks/use-activity";
import { usePanelsStore } from "@/lib/stores/panels";
import {
  isFolder,
  isDocument,
  isSpreadsheet,
  isImage,
  isPdf,
} from "@/lib/google/types";
import type { DriveFile } from "@/lib/google/types";

function FileIcon({ mimeType }: { mimeType: string }) {
  if (isFolder(mimeType))      return <Folder   className="h-4 w-4 shrink-0 text-purple-400" />;
  if (isDocument(mimeType))    return <FileText  className="h-4 w-4 shrink-0 text-accent" />;
  if (isSpreadsheet(mimeType)) return <Sheet     className="h-4 w-4 shrink-0 text-green" />;
  if (isImage(mimeType))       return <Image     className="h-4 w-4 shrink-0 text-text-muted" />;
  return <File className="h-4 w-4 shrink-0 text-text-muted" />;
}

function getFilePath(file: DriveFile): string {
  if (isFolder(file.mimeType))      return `/folder/${file.id}`;
  if (isDocument(file.mimeType))    return `/doc/${file.id}`;
  if (isSpreadsheet(file.mimeType)) return `/sheet/${file.id}`;
  if (isImage(file.mimeType) || isPdf(file.mimeType)) return `/file/${file.id}`;
  return `/file/${file.id}`;
}

function timeAgo(isoTime: string): string {
  const diff = Date.now() - new Date(isoTime).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1)  return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)   return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ActivityPanel() {
  const { activityOpen, closeActivity } = usePanelsStore();
  const { data, isLoading } = useActivity();
  const router = useRouter();

  function handleFileClick(file: DriveFile) {
    router.navigate({ to: getFilePath(file) });
    closeActivity();
  }

  const files = data?.files ?? [];

  return (
    <AnimatePresence>
      {activityOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="activity-backdrop"
            className="fixed inset-0 z-30 bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeActivity}
          />

          {/* Panel */}
          <motion.div
            key="activity-panel"
            className="fixed right-0 top-0 bottom-0 z-40 w-[360px] border-l border-border bg-bg-secondary shadow-2xl flex flex-col"
            initial={{ x: 360 }}
            animate={{ x: 0 }}
            exit={{ x: 360 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-text-primary">Activity</span>
                {/* Pulsing dot — auto-refresh indicator */}
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-50" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
                </span>
              </div>
              <button
                onClick={closeActivity}
                className="rounded p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                aria-label="Close activity panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Subtitle */}
            <div className="shrink-0 border-b border-border px-4 py-2">
              <p className="text-xs text-text-muted">Recent changes across your drives</p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
                </div>
              )}

              {!isLoading && files.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-text-muted">
                  No recent activity found.
                </p>
              )}

              {!isLoading && files.length > 0 && (
                <ul>
                  {files.map((file) => (
                    <li key={file.id}>
                      <button
                        onClick={() => handleFileClick(file)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-tertiary border-b border-border/50 last:border-b-0"
                      >
                        <FileIcon mimeType={file.mimeType} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-text-primary">
                            {file.name}
                          </p>
                          <p className="text-xs text-text-muted">
                            Modified &middot;{" "}
                            {file.modifiedTime ? timeAgo(file.modifiedTime) : "—"}
                          </p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

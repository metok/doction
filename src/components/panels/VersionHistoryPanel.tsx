import { AnimatePresence, motion } from "framer-motion";
import { X, History } from "lucide-react";
import { useRevisions } from "@/lib/hooks/use-revisions";
import { usePanelsStore } from "@/lib/stores/panels";

function timeAgo(isoTime: string): string {
  const diff = Date.now() - new Date(isoTime).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function formatSize(bytes: string | undefined): string {
  if (!bytes) return "";
  const n = parseInt(bytes, 10);
  if (isNaN(n)) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function VersionHistoryPanel() {
  const { versionHistoryOpen, versionHistoryFileId, closeVersionHistory } =
    usePanelsStore();

  const { data, isLoading } = useRevisions(versionHistoryFileId ?? "");

  const revisions = data?.revisions ?? [];

  return (
    <AnimatePresence>
      {versionHistoryOpen && versionHistoryFileId && (
        <>
          {/* Backdrop */}
          <motion.div
            key="version-history-backdrop"
            className="fixed inset-0 z-30 bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeVersionHistory}
          />

          {/* Panel */}
          <motion.div
            key="version-history-panel"
            className="fixed right-0 top-0 bottom-0 z-40 w-[360px] border-l border-border bg-bg-secondary shadow-2xl flex flex-col"
            initial={{ x: 360 }}
            animate={{ x: 0 }}
            exit={{ x: 360 }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-text-muted" />
                <span className="text-sm font-semibold text-text-primary">
                  Version history
                </span>
              </div>
              <button
                onClick={closeVersionHistory}
                className="rounded p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                aria-label="Close version history panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Subtitle */}
            <div className="shrink-0 border-b border-border px-4 py-2">
              <p className="text-xs text-text-muted">
                {revisions.length > 0
                  ? `${revisions.length} revision${revisions.length === 1 ? "" : "s"}`
                  : "File revisions"}
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
                </div>
              )}

              {!isLoading && revisions.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-text-muted">
                  No revisions found for this file.
                </p>
              )}

              {!isLoading && revisions.length > 0 && (
                <ul>
                  {[...revisions].reverse().map((rev, index) => (
                    <li
                      key={rev.id}
                      className="flex items-start gap-3 border-b border-border/50 px-4 py-3 last:border-b-0"
                    >
                      {/* Avatar */}
                      {rev.lastModifyingUser?.photoLink ? (
                        <img
                          src={rev.lastModifyingUser.photoLink}
                          alt={rev.lastModifyingUser.displayName ?? "User"}
                          className="h-7 w-7 shrink-0 rounded-full"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bg-tertiary text-xs font-medium text-text-muted">
                          {rev.lastModifyingUser?.displayName?.[0]?.toUpperCase() ??
                            "?"}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text-primary">
                          {rev.lastModifyingUser?.displayName ?? "Unknown user"}
                        </p>
                        <p className="text-xs text-text-muted">
                          {timeAgo(rev.modifiedTime)}
                          {rev.size && (
                            <span className="ml-2 text-text-muted">
                              {formatSize(rev.size)}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Version badge */}
                      <span className="shrink-0 rounded bg-bg-tertiary px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
                        v{revisions.length - index}
                      </span>
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

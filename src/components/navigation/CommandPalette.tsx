import { useState, useCallback, useEffect, useRef } from "react";
import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Folder, FileText, Sheet, Image, File, Users } from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { useSearch } from "@/lib/hooks/use-search";
import { useSharedDrives } from "@/lib/hooks/use-drive-files";
import { useRecentStore } from "@/lib/stores/recent";
import {
  isFolder,
  isDocument,
  isSpreadsheet,
  isImage,
  isPdf,
} from "@/lib/google/types";
import type { DriveFile } from "@/lib/google/types";

const groupHeadingClass = "[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-text-muted";
const itemClass = "flex cursor-pointer items-center gap-3 px-4 py-2 text-sm text-text-secondary transition-colors aria-selected:bg-bg-tertiary aria-selected:text-text-primary";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (isFolder(mimeType)) return <Folder className="h-4 w-4 shrink-0 text-purple-400" />;
  if (isDocument(mimeType)) return <FileText className="h-4 w-4 shrink-0 text-accent" />;
  if (isSpreadsheet(mimeType)) return <Sheet className="h-4 w-4 shrink-0 text-green" />;
  if (isImage(mimeType)) return <Image className="h-4 w-4 shrink-0 text-text-muted" />;
  return <File className="h-4 w-4 shrink-0 text-text-muted" />;
}

function getFilePath(file: DriveFile): string {
  if (isFolder(file.mimeType)) return `/folder/${file.id}`;
  if (isDocument(file.mimeType)) return `/doc/${file.id}`;
  if (isSpreadsheet(file.mimeType)) return `/sheet/${file.id}`;
  if (isImage(file.mimeType) || isPdf(file.mimeType)) return `/file/${file.id}`;
  return `/file/${file.id}`;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();
  const router = useRouter();
  const { addFile } = useRecentStore();
  const recentFiles = useRecentStore((s) => s.files).slice(0, 5);
  const { data: searchData, isFetching: isSearching } = useSearch(debouncedQuery);
  const { data: sharedDrivesData } = useSharedDrives();
  const searchResults = searchData?.files ?? [];
  const isTyping = query !== debouncedQuery;

  // Filter shared drives by query
  const matchingDrives = query.length > 0
    ? (sharedDrivesData?.drives ?? []).filter((d) =>
        d.name.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  // Debounce search query by 300ms
  useEffect(() => {
    debounceTimer.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(debounceTimer.current);
  }, [query]);

  const handleSelect = useCallback(
    (file: DriveFile) => {
      addFile(file);
      const path = getFilePath(file);
      if (isFolder(file.mimeType)) {
        router.navigate({ to: "/folder/$folderId", params: { folderId: file.id } });
      } else if (isDocument(file.mimeType)) {
        router.navigate({ to: "/doc/$docId", params: { docId: file.id } });
      } else if (isSpreadsheet(file.mimeType)) {
        router.navigate({ to: "/sheet/$sheetId", params: { sheetId: file.id } });
      } else if (isImage(file.mimeType) || isPdf(file.mimeType)) {
        router.navigate({ to: "/file/$fileId", params: { fileId: file.id } });
      } else {
        void path; // suppress unused
        router.navigate({ to: "/file/$fileId", params: { fileId: file.id } });
      }
      onOpenChange(false);
      setQuery("");
    },
    [addFile, router, onOpenChange],
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => {
              onOpenChange(false);
              setQuery("");
            }}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-[15%] z-50 w-[560px] max-w-[calc(100vw-2rem)] -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-bg-secondary shadow-2xl"
          >
            <Command
              shouldFilter={false}
              className="flex flex-col"
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  onOpenChange(false);
                  setQuery("");
                }
              }}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 border-b border-border px-4 py-3">
                {(isTyping || isSearching) && query.length > 0 ? (
                  <div className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-border border-t-accent" />
                ) : (
                  <Search className="h-4 w-4 shrink-0 text-text-muted" />
                )}
                <Command.Input
                  autoFocus
                  value={query}
                  onValueChange={setQuery}
                  placeholder="Search files and folders..."
                  className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
                />
              </div>

              {/* Results */}
              <Command.List className="max-h-[360px] overflow-y-auto py-2">
                {query.length === 0 ? (
                  recentFiles.length > 0 ? (
                    <Command.Group
                      heading="Recent"
                      className={groupHeadingClass}
                    >
                      {recentFiles.map((file) => (
                        <Command.Item
                          key={file.id}
                          value={file.id}
                          onSelect={() => handleSelect(file)}
                          className={itemClass}
                        >
                          <FileIcon mimeType={file.mimeType} />
                          <span className="flex-1 truncate">{file.name}</span>
                        </Command.Item>
                      ))}
                    </Command.Group>
                  ) : (
                    <Command.Empty className="px-4 py-8 text-center text-sm text-text-muted">
                      No recent files. Start typing to search.
                    </Command.Empty>
                  )
                ) : (isTyping || isSearching) && matchingDrives.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 px-4 py-8">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
                    <span className="text-sm text-text-muted">
                      Searching for &ldquo;{query}&rdquo;&hellip;
                    </span>
                  </div>
                ) : (searchResults.length > 0 || matchingDrives.length > 0) ? (
                  <>
                    {/* Matching drives */}
                    {matchingDrives.length > 0 && (
                      <Command.Group
                        heading="Drives"
                        className={groupHeadingClass}
                      >
                        {matchingDrives.map((drive) => (
                          <Command.Item
                            key={`drive-${drive.id}`}
                            value={`drive-${drive.id}`}
                            onSelect={() => {
                              router.navigate({ to: "/folder/$folderId", params: { folderId: drive.id } });
                              onOpenChange(false);
                              setQuery("");
                            }}
                            className={itemClass}
                          >
                            <Users className="h-4 w-4 shrink-0 text-blue-400" />
                            <span className="flex-1 truncate">{drive.name}</span>
                            <span className="text-xs text-text-muted">Shared Drive</span>
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}
                    {/* File results */}
                    {searchResults.length > 0 && (
                      <Command.Group
                        heading="Files"
                        className={groupHeadingClass}
                      >
                        {searchResults.map((file) => (
                          <Command.Item
                            key={file.id}
                            value={file.id}
                            onSelect={() => handleSelect(file)}
                            className={itemClass}
                          >
                            <FileIcon mimeType={file.mimeType} />
                            <span className="flex-1 truncate">{file.name}</span>
                          </Command.Item>
                        ))}
                      </Command.Group>
                    )}
                    {/* Still searching for files */}
                    {(isTyping || isSearching) && searchResults.length === 0 && (
                      <div className="flex items-center gap-2 px-4 py-3 text-xs text-text-muted">
                        <div className="h-3 w-3 animate-spin rounded-full border border-border border-t-accent" />
                        Searching files&hellip;
                      </div>
                    )}
                  </>
                ) : (
                  <Command.Empty className="px-4 py-8 text-center text-sm text-text-muted">
                    No results for &ldquo;{query}&rdquo;
                  </Command.Empty>
                )}
              </Command.List>

              {/* Footer */}
              <div className="flex items-center gap-4 border-t border-border px-4 py-2">
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <kbd className="rounded bg-bg-tertiary px-1 py-0.5 font-mono">↑↓</kbd>
                  <span>Navigate</span>
                </span>
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <kbd className="rounded bg-bg-tertiary px-1 py-0.5 font-mono">↵</kbd>
                  <span>Open</span>
                </span>
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <kbd className="rounded bg-bg-tertiary px-1 py-0.5 font-mono">Esc</kbd>
                  <span>Close</span>
                </span>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

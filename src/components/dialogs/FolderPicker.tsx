import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Folder, Users, ChevronRight, HardDrive, Clock, Star, X } from "lucide-react";
import { useDriveFiles, useSharedDrives } from "@/lib/hooks/use-drive-files";
import { useRecentStore } from "@/lib/stores/recent";
import { useFavoritesStore } from "@/lib/stores/favorites";
import { isFolder, MIME_TYPES } from "@/lib/google/types";
import type { DriveFile, SharedDrive } from "@/lib/google/types";
import { useSearch } from "@/lib/hooks/use-search";

interface FolderPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (folderId: string, folderName: string) => void;
  title?: string;
  currentFolderId?: string;
}

export function FolderPicker({
  open,
  onClose,
  onSelect,
  title = "Choose a folder",
  currentFolderId,
}: FolderPickerProps) {
  const [query, setQuery] = useState("");
  const [browsePath, setBrowsePath] = useState<{ id: string; name: string }[]>([]);

  // Data sources
  const browseFolderId = browsePath.length > 0 ? browsePath[browsePath.length - 1].id : "root";
  const { data: browseData, isLoading: browseLoading } = useDriveFiles(browseFolderId, open);
  const { data: sharedDrivesData } = useSharedDrives();
  const { data: searchData, isFetching: searching } = useSearch(query);
  const recentFiles = useRecentStore((s) => s.files);
  const favoriteFiles = useFavoritesStore((s) => s.files);

  const sharedDrives = sharedDrivesData?.drives ?? [];
  const browseFiles = browseData?.files?.filter((f) => isFolder(f.mimeType)) ?? [];

  // Recent folders (deduplicated)
  const recentFolders = useMemo(() => {
    const seen = new Set<string>();
    return recentFiles
      .filter((f) => isFolder(f.mimeType) && !seen.has(f.id) && (seen.add(f.id), true))
      .slice(0, 5);
  }, [recentFiles]);

  // Favorite folders
  const favoriteFolders = useMemo(
    () => favoriteFiles.filter((f) => isFolder(f.mimeType)).slice(0, 5),
    [favoriteFiles],
  );

  // Search results (folders only)
  const searchFolders = useMemo(
    () => (searchData?.files ?? []).filter((f) => isFolder(f.mimeType)),
    [searchData],
  );

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setQuery("");
      setBrowsePath([]);
    }
  }, [open]);

  // Navigate into a folder
  function enterFolder(folder: { id: string; name: string }) {
    setBrowsePath((p) => [...p, folder]);
  }

  function goToPathIndex(index: number) {
    setBrowsePath((p) => p.slice(0, index + 1));
  }

  function goToRoot() {
    setBrowsePath([]);
  }

  const isSearching = query.length > 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-[15%] z-50 flex w-[480px] max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-col overflow-hidden rounded-xl border border-border bg-bg-secondary shadow-2xl"
            style={{ maxHeight: "60vh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
              <button
                onClick={onClose}
                className="cursor-pointer rounded-md p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search */}
            <div className="border-b border-border/60 px-4 py-2.5">
              <div className="flex items-center gap-2 rounded-lg bg-bg-tertiary/60 px-3 py-2">
                <Search className="h-4 w-4 shrink-0 text-text-muted" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search folders..."
                  className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
                />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {isSearching ? (
                /* Search results */
                <div className="p-2">
                  {searching ? (
                    <div className="flex items-center gap-2 px-3 py-4 text-sm text-text-muted">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent" />
                      Searching...
                    </div>
                  ) : searchFolders.length > 0 ? (
                    searchFolders.map((folder) => (
                      <FolderRow
                        key={folder.id}
                        name={folder.name}
                        onSelect={() => onSelect(folder.id, folder.name)}
                        onEnter={() => { setQuery(""); enterFolder({ id: folder.id, name: folder.name }); }}
                      />
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center text-sm text-text-muted">
                      No folders found
                    </div>
                  )}
                </div>
              ) : browsePath.length === 0 ? (
                /* Root view: suggestions + drives */
                <div className="p-2">
                  {/* Current folder */}
                  {currentFolderId && (
                    <Section label="Current">
                      <FolderRow
                        name="Current folder"
                        highlight
                        onSelect={() => onSelect(currentFolderId, "Current folder")}
                        onEnter={() => enterFolder({ id: currentFolderId, name: "Current folder" })}
                      />
                    </Section>
                  )}

                  {/* Favorite folders */}
                  {favoriteFolders.length > 0 && (
                    <Section label="Favorites">
                      {favoriteFolders.map((f) => (
                        <FolderRow
                          key={f.id}
                          name={f.name}
                          icon={<Star className="h-4 w-4 text-amber-400" />}
                          onSelect={() => onSelect(f.id, f.name)}
                          onEnter={() => enterFolder({ id: f.id, name: f.name })}
                        />
                      ))}
                    </Section>
                  )}

                  {/* Recent folders */}
                  {recentFolders.length > 0 && (
                    <Section label="Recent">
                      {recentFolders.map((f) => (
                        <FolderRow
                          key={f.id}
                          name={f.name}
                          icon={<Clock className="h-4 w-4 text-text-muted" />}
                          onSelect={() => onSelect(f.id, f.name)}
                          onEnter={() => enterFolder({ id: f.id, name: f.name })}
                        />
                      ))}
                    </Section>
                  )}

                  {/* Shared Drives */}
                  {sharedDrives.length > 0 && (
                    <Section label="Shared Drives">
                      {sharedDrives.map((d) => (
                        <FolderRow
                          key={d.id}
                          name={d.name}
                          icon={<Users className="h-4 w-4 text-blue-400" />}
                          onSelect={() => onSelect(d.id, d.name)}
                          onEnter={() => enterFolder({ id: d.id, name: d.name })}
                        />
                      ))}
                    </Section>
                  )}

                  {/* My Drive */}
                  <Section label="My Drive">
                    <FolderRow
                      name="My Drive (root)"
                      icon={<HardDrive className="h-4 w-4 text-text-muted" />}
                      onSelect={() => onSelect("root", "My Drive")}
                      onEnter={() => enterFolder({ id: "root", name: "My Drive" })}
                    />
                  </Section>
                </div>
              ) : (
                /* Browsing inside a folder */
                <div className="p-2">
                  {/* Breadcrumb */}
                  <div className="mb-2 flex items-center gap-1 px-2 text-xs text-text-muted">
                    <button onClick={goToRoot} className="cursor-pointer hover:text-text-primary">Root</button>
                    {browsePath.map((seg, i) => (
                      <span key={seg.id} className="flex items-center gap-1">
                        <ChevronRight className="h-3 w-3" />
                        <button
                          onClick={() => goToPathIndex(i)}
                          className={`cursor-pointer truncate ${i === browsePath.length - 1 ? "text-text-primary" : "hover:text-text-primary"}`}
                        >
                          {seg.name}
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Select current browsed folder */}
                  <button
                    onClick={() => {
                      const current = browsePath[browsePath.length - 1];
                      onSelect(current.id, current.name);
                    }}
                    className="mb-2 flex w-full cursor-pointer items-center gap-2 rounded-lg bg-accent/10 px-3 py-2.5 text-[13px] font-medium text-accent transition-colors hover:bg-accent/20"
                  >
                    Select "{browsePath[browsePath.length - 1].name}"
                  </button>

                  {/* Subfolders */}
                  {browseLoading ? (
                    <div className="flex items-center gap-2 px-3 py-3 text-sm text-text-muted">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent" />
                      Loading...
                    </div>
                  ) : browseFiles.length > 0 ? (
                    browseFiles.map((folder) => (
                      <FolderRow
                        key={folder.id}
                        name={folder.name}
                        onSelect={() => onSelect(folder.id, folder.name)}
                        onEnter={() => enterFolder({ id: folder.id, name: folder.name })}
                      />
                    ))
                  ) : (
                    <div className="px-3 py-3 text-sm text-text-muted">No subfolders</div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </div>
      {children}
    </div>
  );
}

function FolderRow({
  name,
  icon,
  highlight,
  onSelect,
  onEnter,
}: {
  name: string;
  icon?: React.ReactNode;
  highlight?: boolean;
  onSelect: () => void;
  onEnter: () => void;
}) {
  return (
    <div className={`group flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition-colors ${highlight ? "bg-accent/5 text-accent" : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"}`}>
      <button onClick={onSelect} className="flex flex-1 cursor-pointer items-center gap-2 text-left">
        {icon ?? <Folder className="h-4 w-4 shrink-0 text-purple-400" />}
        <span className="truncate">{name}</span>
      </button>
      <button
        onClick={onEnter}
        className="hidden shrink-0 cursor-pointer rounded p-0.5 text-text-muted opacity-0 transition-opacity group-hover:block group-hover:opacity-100 hover:text-text-primary"
        title="Browse into"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

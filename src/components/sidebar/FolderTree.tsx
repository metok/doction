import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Users, HardDrive, Plus, Star } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useSharedDrives, useDriveFiles } from "@/lib/hooks/use-drive-files";
import { FolderNode } from "./FolderNode";
import { isFolder, MIME_TYPES } from "@/lib/google/types";
import type { SharedDrive } from "@/lib/google/types";
import { useTreeStateStore } from "@/lib/stores/tree-state";
import { useFavoritesStore } from "@/lib/stores/favorites";

/** Convert SharedDrive to a DriveFile-like object for favorites store */
function sharedDriveAsFile(drive: SharedDrive) {
  return {
    id: drive.id,
    name: drive.name,
    mimeType: MIME_TYPES.FOLDER,
  };
}

function SharedDriveFavButton({ drive }: { drive: SharedDrive }) {
  const isFav = useFavoritesStore((s) => s.isFavorite(drive.id));
  const toggle = useFavoritesStore((s) => s.toggle);

  return (
    <div className="hidden shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:flex group-hover:opacity-100">
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          toggle(sharedDriveAsFile(drive));
        }}
        className={`cursor-pointer rounded p-0.5 transition-colors ${
          isFav ? "text-amber-400 hover:text-amber-300" : "text-text-muted hover:bg-bg-tertiary hover:text-amber-400"
        }`}
        title={isFav ? "Remove from favorites" : "Add to favorites"}
      >
        <Star className={`h-3.5 w-3.5 ${isFav ? "fill-amber-400" : ""}`} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          window.open(`https://docs.google.com/document/create?folder=${drive.id}`, "_blank");
        }}
        className="cursor-pointer rounded p-0.5 text-text-muted hover:bg-bg-tertiary hover:text-text-primary"
        title="New doc in this drive"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function SharedDriveNode({ drive }: { drive: SharedDrive }) {
  const expanded = useTreeStateStore((s) => s.isExpanded(drive.id));
  const toggle = useTreeStateStore((s) => s.toggle);
  const { data, isLoading } = useDriveFiles(drive.id, expanded, drive.id);
  const children = expanded ? (data?.files ?? []) : [];

  return (
    <div>
      <div
        className="group flex cursor-pointer items-center gap-2 rounded-md py-[7px] pr-2 text-[13px] text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
        style={{ paddingLeft: "8px" }}
      >
        <span
          className="flex h-4 w-4 shrink-0 items-center justify-center"
          onClick={() => toggle(drive.id)}
        >
          <motion.span
            animate={{ rotate: expanded ? 90 : 0 }}
            transition={{ duration: 0.15 }}
            className="flex"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </motion.span>
        </span>
        <Link
          to="/folder/$folderId"
          params={{ folderId: drive.id }}
          className="flex flex-1 items-center gap-2 truncate"
        >
          <Users className="h-4 w-4 shrink-0 text-blue-400" />
          <span className="truncate">{drive.name}</span>
        </Link>
        {isLoading && (
          <span className="h-2 w-2 animate-pulse rounded-full bg-text-muted" />
        )}
        <SharedDriveFavButton drive={drive} />
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
            {!isLoading && children.length === 0 && (
              <div className="py-1 text-xs text-text-muted" style={{ paddingLeft: "36px" }}>
                Empty drive
              </div>
            )}
            {children.map((child) => (
              <FolderNode key={child.id} file={child} depth={1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CollapsibleSection({
  id,
  icon: Icon,
  label,
  children,
}: {
  id: string;
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  const expanded = useTreeStateStore((s) => s.isExpanded(id));
  const toggle = useTreeStateStore((s) => s.toggle);

  return (
    <div>
      <button
        className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-[13px] font-medium text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
        onClick={() => toggle(id)}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">{label}</span>
        <motion.span
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          className="flex text-text-muted"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ overflow: "hidden" }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Shared Drives — self-contained collapsible section */
export function SharedDrivesTree() {
  const { data: sharedDrivesData, isLoading: sharedDrivesLoading } = useSharedDrives();
  const sharedDrives = sharedDrivesData?.drives ?? [];
  const expanded = useTreeStateStore((s) => s.isExpanded("__shared_drives__"));
  const toggle = useTreeStateStore((s) => s.toggle);

  if (sharedDrivesLoading || sharedDrives.length === 0) return null;

  return (
    <div>
      <button
        className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-[13px] font-medium text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
        onClick={() => toggle("__shared_drives__")}
      >
        <Users className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">Shared Drives</span>
        <motion.span
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          className="flex text-text-muted"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-2">
              {sharedDrives.map((drive) => (
                <SharedDriveNode key={drive.id} drive={drive} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** My Drive section — rendered in Sidebar fixed area */
export function MyDriveTree() {
  const { data, isLoading } = useDriveFiles("root");
  const files = data?.files ?? [];
  const folders = files.filter((f) => isFolder(f.mimeType));
  const nonFolders = files.filter((f) => !isFolder(f.mimeType));
  const sorted = [...folders, ...nonFolders];

  const expanded = useTreeStateStore((s) => s.isExpanded("__my_drive__"));
  const toggle = useTreeStateStore((s) => s.toggle);

  return (
    <div>
      <button
        className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-4 py-2.5 text-[13px] font-medium text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
        onClick={() => toggle("__my_drive__")}
      >
        <HardDrive className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">My Drive</span>
        <motion.span
          animate={{ rotate: expanded ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          className="flex text-text-muted"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {isLoading ? (
              <div className="space-y-1 px-4 py-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-5 animate-pulse rounded bg-bg-tertiary" style={{ width: `${50 + i * 12}%` }} />
                ))}
              </div>
            ) : (
              <div className="px-2">
                {sorted.map((file) => (
                  <FolderNode key={file.id} file={file} depth={0} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

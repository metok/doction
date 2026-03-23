import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Users, HardDrive, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useSharedDrives, useDriveFiles } from "@/lib/hooks/use-drive-files";
import { FolderNode } from "./FolderNode";
import { isFolder } from "@/lib/google/types";
import type { SharedDrive } from "@/lib/google/types";
import { useTreeStateStore } from "@/lib/stores/tree-state";

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
        <button
          onClick={(e) => {
            e.stopPropagation();
            window.open(`https://docs.google.com/document/create?folder=${drive.id}`, "_blank");
          }}
          className="hidden shrink-0 cursor-pointer rounded p-0.5 text-text-muted opacity-0 transition-opacity group-hover:block group-hover:opacity-100 hover:bg-bg-tertiary hover:text-text-primary"
          title="New doc in this drive"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
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

export function FolderTree() {
  const { data: myDriveData, isLoading: myDriveLoading } = useDriveFiles("root");
  const { data: sharedDrivesData, isLoading: sharedDrivesLoading } = useSharedDrives();

  const myDriveFiles = myDriveData?.files ?? [];
  const folders = myDriveFiles.filter((f) => isFolder(f.mimeType));
  const nonFolders = myDriveFiles.filter((f) => !isFolder(f.mimeType));
  const sortedMyDrive = [...folders, ...nonFolders];

  const sharedDrives = sharedDrivesData?.drives ?? [];

  return (
    <div className="flex flex-col gap-1">
      {/* Shared Drives */}
      {!sharedDrivesLoading && sharedDrives.length > 0 && (
        <CollapsibleSection id="__shared_drives__" icon={Users} label="Shared Drives">
          {sharedDrives.map((drive) => (
            <SharedDriveNode key={drive.id} drive={drive} />
          ))}
        </CollapsibleSection>
      )}

      {/* My Drive */}
      <CollapsibleSection id="__my_drive__" icon={HardDrive} label="My Drive">
        {myDriveLoading ? (
          <div className="space-y-1 px-2 py-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-5 animate-pulse rounded bg-bg-tertiary"
                style={{ width: `${50 + i * 12}%` }}
              />
            ))}
          </div>
        ) : (
          sortedMyDrive.map((file) => (
            <FolderNode key={file.id} file={file} depth={0} />
          ))
        )}
      </CollapsibleSection>
    </div>
  );
}

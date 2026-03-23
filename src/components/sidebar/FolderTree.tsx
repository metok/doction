import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Users } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useSharedDrives } from "@/lib/hooks/use-drive-files";
import { useDriveFiles } from "@/lib/hooks/use-drive-files";
import { FolderNode } from "./FolderNode";
import type { SharedDrive } from "@/lib/google/types";

function SharedDriveNode({ drive }: { drive: SharedDrive }) {
  const [expanded, setExpanded] = useState(false);
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
          onClick={() => setExpanded((prev) => !prev)}
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

export function FolderTree() {
  const { data: sharedDrivesData, isLoading: sharedDrivesLoading } = useSharedDrives();
  const sharedDrives = sharedDrivesData?.drives ?? [];

  if (sharedDrivesLoading) {
    return (
      <div className="space-y-2 px-2 py-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-5 animate-pulse rounded bg-bg-tertiary"
            style={{ width: `${50 + i * 12}%` }}
          />
        ))}
      </div>
    );
  }

  if (sharedDrives.length === 0) {
    return (
      <div className="px-3 py-4 text-xs text-text-muted">
        No shared drives
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 px-2 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
        Shared Drives
      </div>
      {sharedDrives.map((drive) => (
        <SharedDriveNode key={drive.id} drive={drive} />
      ))}
    </div>
  );
}

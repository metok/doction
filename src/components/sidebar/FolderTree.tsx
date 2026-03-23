import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, HardDrive, Users } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useDriveFiles, useSharedDrives } from "@/lib/hooks/use-drive-files";
import { FolderNode } from "./FolderNode";
import { isFolder } from "@/lib/google/types";
import type { SharedDrive } from "@/lib/google/types";

function SharedDriveNode({ drive }: { drive: SharedDrive }) {
  const [expanded, setExpanded] = useState(false);
  const { data, isLoading } = useDriveFiles(drive.id, expanded, drive.id);
  const children = expanded ? (data?.files ?? []) : [];

  return (
    <div>
      <div className="group flex cursor-pointer items-center gap-2 rounded-md py-[7px] pr-2 text-[13px] text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary" style={{ paddingLeft: "8px" }}>
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
          className="flex flex-1 items-center gap-1 truncate"
        >
          <Users className="h-4 w-4 shrink-0 text-blue-400" />
          <span className="truncate font-medium">{drive.name}</span>
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
  const [myDriveExpanded, setMyDriveExpanded] = useState(false);
  const { data: myDriveData, isLoading: myDriveLoading, isError: myDriveError } = useDriveFiles("root");
  const { data: sharedDrivesData, isLoading: sharedDrivesLoading } = useSharedDrives();

  const myDriveFiles = myDriveData?.files ?? [];
  const folders = myDriveFiles.filter((f) => isFolder(f.mimeType));
  const nonFolders = myDriveFiles.filter((f) => !isFolder(f.mimeType));
  const sortedMyDrive = [...folders, ...nonFolders];

  const sharedDrives = sharedDrivesData?.drives ?? [];

  return (
    <div className="flex flex-col gap-2">
      {/* My Drive */}
      <div>
        <div
          className="group flex cursor-pointer items-center gap-1 px-2 py-3 mb-1 text-xs font-medium uppercase tracking-wide text-text-muted transition-colors hover:text-text-primary"
          onClick={() => setMyDriveExpanded((prev) => !prev)}
        >
          <motion.span
            animate={{ rotate: myDriveExpanded ? 90 : 0 }}
            transition={{ duration: 0.15 }}
            className="flex h-3.5 w-3.5 shrink-0 items-center justify-center"
          >
            <ChevronRight className="h-3 w-3" />
          </motion.span>
          <HardDrive className="h-3 w-3" />
          My Drive
        </div>

        <AnimatePresence initial={false}>
          {myDriveExpanded && (
            <motion.div
              key="my-drive-children"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ overflow: "hidden" }}
            >
              {myDriveLoading && (
                <div className="space-y-1 px-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-6 animate-pulse rounded bg-bg-tertiary"
                      style={{ width: `${60 + i * 8}%` }}
                    />
                  ))}
                </div>
              )}

              {myDriveError && (
                <div className="px-3 py-2 text-xs text-amber">
                  Failed to load Drive files
                </div>
              )}

              {!myDriveLoading && !myDriveError && (
                <div className="flex flex-col gap-1 px-1">
                  {sortedMyDrive.map((file) => (
                    <FolderNode key={file.id} file={file} depth={0} />
                  ))}
                  {sortedMyDrive.length === 0 && (
                    <div className="px-3 py-2 text-xs text-text-muted">
                      No files found
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Shared Drives */}
      {!sharedDrivesLoading && sharedDrives.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 px-2 py-3 mb-1 text-xs font-medium uppercase tracking-wide text-text-muted">
            <Users className="h-3 w-3" />
            Shared Drives
          </div>
          <div className="flex flex-col gap-1 px-1">
            {sharedDrives.map((drive) => (
              <SharedDriveNode key={drive.id} drive={drive} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

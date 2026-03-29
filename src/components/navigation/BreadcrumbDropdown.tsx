import { useRef, useEffect } from "react";
import { Loader2, FolderIcon } from "lucide-react";
import { useDriveFiles } from "@/lib/hooks/use-drive-files";
import { isFolder } from "@/lib/google/types";
import { usePanesStore } from "@/lib/stores/panes";

interface BreadcrumbDropdownProps {
  parentId: string;
  segmentId: string;
  onClose: () => void;
}

export function BreadcrumbDropdown({ parentId, segmentId, onClose }: BreadcrumbDropdownProps) {
  const { data, isLoading } = useDriveFiles(parentId);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const folders = (data?.files ?? []).filter((f) => isFolder(f.mimeType));

  return (
    <div
      ref={dropdownRef}
      className="absolute left-0 top-full z-50 mt-1 max-h-64 min-w-[180px] overflow-y-auto rounded-md border border-border bg-bg-secondary shadow-lg"
    >
      {isLoading ? (
        <div className="flex items-center justify-center px-3 py-4">
          <Loader2 className="h-4 w-4 animate-spin text-text-muted" />
        </div>
      ) : folders.length === 0 ? (
        <div className="px-3 py-2 text-sm text-text-muted">No folders</div>
      ) : (
        folders.map((folder) => (
          <button
            key={folder.id}
            onClick={() => {
              const { activePaneId, setPaneContent } = usePanesStore.getState();
              setPaneContent(activePaneId, "folder", folder.id);
              onClose();
            }}
            className={`flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors hover:bg-bg-tertiary ${
              folder.id === segmentId
                ? "bg-bg-tertiary font-medium text-text-primary"
                : "text-text-secondary"
            }`}
          >
            <FolderIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{folder.name}</span>
          </button>
        ))
      )}
    </div>
  );
}

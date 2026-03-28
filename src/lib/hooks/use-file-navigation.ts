import { useCallback } from "react";
import { useRecentStore } from "@/lib/stores/recent";
import { useTabsStore } from "@/lib/stores/tabs";
import { usePanesStore, type PaneContentType } from "@/lib/stores/panes";
import { isFolder, isDocument, isSpreadsheet, isImage, isPdf } from "@/lib/google/types";
import type { DriveFile } from "@/lib/google/types";

/** Returns the internal route path for a Drive file */
export function getFileRoute(file: DriveFile): string {
  if (isFolder(file.mimeType)) return `/folder/${file.id}`;
  if (isDocument(file.mimeType)) return `/doc/${file.id}`;
  if (isSpreadsheet(file.mimeType)) return `/sheet/${file.id}`;
  if (isImage(file.mimeType) || isPdf(file.mimeType)) return `/file/${file.id}`;
  return `/file/${file.id}`;
}

/** Derive pane content type from a DriveFile */
export function getContentType(file: DriveFile): PaneContentType {
  if (isFolder(file.mimeType)) return "folder";
  if (isDocument(file.mimeType)) return "doc";
  if (isSpreadsheet(file.mimeType)) return "sheet";
  return "file";
}

/**
 * Central file navigation hook.
 *
 * Normal click → update active pane content + create/activate tab.
 * Ctrl/Cmd+Click → add background tab without navigating.
 */
export function useFileNavigation() {
  const addRecent = useRecentStore((s) => s.addFile);

  return useCallback(
    (file: DriveFile, event?: React.MouseEvent | { metaKey?: boolean; ctrlKey?: boolean }) => {
      addRecent(file);
      const background = event && (event.metaKey || event.ctrlKey);

      const path = getFileRoute(file);
      const { tabs, addTab, setActive } = useTabsStore.getState();
      const existing = tabs.find((t) => t.path === path);

      if (background) {
        // Ensure tab exists, don't navigate
        if (!existing) {
          addTab({ path, title: file.name, mimeType: file.mimeType });
        }
      } else {
        // Navigate in active pane
        const { activePaneId, setPaneContent } = usePanesStore.getState();
        setPaneContent(activePaneId, getContentType(file), file.id);

        // Reuse existing tab or create one
        if (existing) {
          setActive(existing.id);
        } else {
          const id = addTab({ path, title: file.name, mimeType: file.mimeType });
          setActive(id);
        }
      }
    },
    [addRecent],
  );
}

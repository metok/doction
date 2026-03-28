import { useCallback } from "react";
import { useRouter } from "@tanstack/react-router";
import { useRecentStore } from "@/lib/stores/recent";
import { useTabsStore } from "@/lib/stores/tabs";
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

function navigateToRoute(router: ReturnType<typeof useRouter>, file: DriveFile) {
  if (isFolder(file.mimeType)) {
    router.navigate({ to: "/folder/$folderId", params: { folderId: file.id } });
  } else if (isDocument(file.mimeType)) {
    router.navigate({ to: "/doc/$docId", params: { docId: file.id } });
  } else if (isSpreadsheet(file.mimeType)) {
    router.navigate({ to: "/sheet/$sheetId", params: { sheetId: file.id } });
  } else {
    router.navigate({ to: "/file/$fileId", params: { fileId: file.id } });
  }
}

/**
 * Central file navigation hook.
 *
 * Normal click → navigate to file (tab created automatically by __root effect).
 * Ctrl/Cmd+Click → open in background tab without navigating.
 */
export function useFileNavigation() {
  const router = useRouter();
  const addRecent = useRecentStore((s) => s.addFile);

  return useCallback(
    (file: DriveFile, event?: React.MouseEvent | { metaKey?: boolean; ctrlKey?: boolean }) => {
      addRecent(file);
      const background = event && (event.metaKey || event.ctrlKey);

      if (background) {
        // Add tab in background without navigating
        const path = getFileRoute(file);
        useTabsStore.getState().addTab({ path, title: file.name, mimeType: file.mimeType });
      } else {
        navigateToRoute(router, file);
      }
    },
    [router, addRecent],
  );
}

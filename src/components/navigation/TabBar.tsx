import { useRef, useCallback } from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Folder,
  FileText,
  Sheet,
  Image,
  File,
  Bell,
  Crosshair,
  Home,
  Clock,
  Columns2,
  Rows2,
} from "lucide-react";
import { useTabsStore } from "@/lib/stores/tabs";
import type { Tab } from "@/lib/stores/tabs";
import { useTreeStateStore } from "@/lib/stores/tree-state";
import { useApi } from "@/lib/api-context";
import {
  isFolder,
  isDocument,
  isSpreadsheet,
  isImage,
} from "@/lib/google/types";
import { usePanelsStore } from "@/lib/stores/panels";
import { usePanesStore } from "@/lib/stores/panes";
import { Tooltip } from "@/components/Tooltip";

function TabIcon({ mimeType }: { mimeType?: string }) {
  if (!mimeType) return <File className="h-3.5 w-3.5 shrink-0 text-text-muted" />;
  if (isFolder(mimeType))      return <Folder   className="h-3.5 w-3.5 shrink-0 text-purple-400" />;
  if (isDocument(mimeType))    return <FileText  className="h-3.5 w-3.5 shrink-0 text-accent" />;
  if (isSpreadsheet(mimeType)) return <Sheet     className="h-3.5 w-3.5 shrink-0 text-green" />;
  if (isImage(mimeType))       return <Image     className="h-3.5 w-3.5 shrink-0 text-text-muted" />;
  return <File className="h-3.5 w-3.5 shrink-0 text-text-muted" />;
}

/** Map a tab path to pane content type + id. */
function pathToPane(path: string): { contentType: "home" | "recent" | "favorites" | "trash" | "doc" | "sheet" | "folder" | "file"; contentId?: string } {
  if (path === "/") return { contentType: "home" };
  if (path === "/recent") return { contentType: "recent" };
  if (path === "/favorites") return { contentType: "favorites" };
  if (path === "/trash") return { contentType: "trash" };
  const match = path.match(/^\/(doc|sheet|folder|file)\/(.+)$/);
  if (match) return { contentType: match[1] as "doc" | "sheet" | "folder" | "file", contentId: match[2] };
  return { contentType: "home" };
}

export function TabBar() {
  const { tabs, activeTabId, closeTab, setActive } = useTabsStore();
  const { activityOpen, toggleActivity } = usePanelsStore();
  const setPaneContent = usePanesStore((s) => s.setPaneContent);
  const activePaneId = usePanesStore((s) => s.activePaneId);
  const activeLeaf = usePanesStore((s) => s.getActiveLeaf());
  const splitPane = usePanesStore((s) => s.splitPane);
  const closePane = usePanesStore((s) => s.closePane);
  const paneCount = usePanesStore((s) => s.getPaneCount());
  const scrollRef = useRef<HTMLDivElement>(null);

  function handleTabClick(tab: Tab) {
    setActive(tab.id);
    // Navigate active pane to this tab's content
    const { contentType, contentId } = pathToPane(tab.path);
    setPaneContent(activePaneId, contentType, contentId);
  }

  const navigateAway = usePanesStore((s) => s.navigatePanesAwayFrom);

  function handleClose(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    const tab = useTabsStore.getState().tabs.find((t) => t.id === id);
    closeTab(id);

    // Navigate any panes showing this tab's content away
    if (tab) {
      const { contentType, contentId } = pathToPane(tab.path);
      navigateAway(contentType, contentId);
    }
  }

  const goBack = usePanesStore((s) => s.goBack);
  const goForward = usePanesStore((s) => s.goForward);
  const canGoBack = usePanesStore((s) => s.canGoBack());
  const canGoForward = usePanesStore((s) => s.canGoForward());

  const { drive } = useApi();
  const { revealPath, setHighlight, expand } = useTreeStateStore();
  const routerState = useRouterState();

  const currentPath = routerState.location.pathname;
  const isOnFilePage = activeLeaf ? ["doc", "sheet", "folder", "file"].includes(activeLeaf.contentType) : /^\/(folder|doc|sheet|file)\//.test(currentPath);

  const handleRevealInSidebar = useCallback(async () => {
    const path = routerState.location.pathname;
    // Extract file/folder ID from current route
    const match = path.match(/\/(folder|doc|sheet|file)\/(.+)/);
    if (!match) return;
    const fileId = match[2];

    try {
      // Get the full path from Drive API
      const filePath = await drive.getFilePath(fileId);
      // Expand all parent folders
      const parentIds = filePath.map((f) => f.id);
      // Also expand My Drive and Shared Drives sections
      expand("__my_drive__");
      expand("__shared_drives__");
      revealPath(parentIds);
      // Highlight the target file
      setHighlight(fileId);
    } catch (e) {
      console.error("Failed to reveal in sidebar:", e);
    }
  }, [routerState.location.pathname, drive, revealPath, setHighlight, expand]);

  return (
    <div className="flex h-9 shrink-0 items-stretch border-b border-border bg-bg-secondary" data-tauri-drag-region>
      {/* Back / Forward */}
      <div className="flex shrink-0 items-center gap-0.5 border-r border-border px-1.5">
        <Tooltip label="Back">
          <button
            onClick={goBack}
            disabled={!canGoBack}
            className={[
              "rounded p-1 transition-colors",
              canGoBack
                ? "text-text-muted hover:bg-bg-tertiary hover:text-text-primary"
                : "cursor-default text-text-muted/30",
            ].join(" ")}
            aria-label="Go back"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </Tooltip>
        <Tooltip label="Forward">
          <button
            onClick={goForward}
            disabled={!canGoForward}
            className={[
              "rounded p-1 transition-colors",
              canGoForward
                ? "text-text-muted hover:bg-bg-tertiary hover:text-text-primary"
                : "cursor-default text-text-muted/30",
            ].join(" ")}
            aria-label="Go forward"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </Tooltip>
      </div>

      {/* Tab list — drag-region so empty space between tabs is draggable */}
      <div
        ref={scrollRef}
        data-tauri-drag-region
        className="flex min-w-0 flex-1 items-stretch overflow-x-auto scrollbar-none"
        style={{ scrollbarWidth: "none" }}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab)}
              title={tab.title}
              className={[
                "group relative flex h-full max-w-[180px] min-w-0 shrink-0 cursor-pointer items-center gap-1.5 border-r border-border px-3 text-sm transition-colors",
                isActive
                  ? "bg-bg-primary text-text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-bg-primary"
                  : "bg-bg-secondary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary",
              ].join(" ")}
            >
              <TabIcon mimeType={tab.mimeType} />
              <span className="min-w-0 flex-1 truncate text-left" style={{ maxWidth: "120px" }}>
                {tab.title}
              </span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => handleClose(e, tab.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleClose(e as unknown as React.MouseEvent, tab.id);
                }}
                title="Close tab"
                aria-label={`Close ${tab.title}`}
                className={[
                  "ml-0.5 shrink-0 rounded p-0.5 transition-colors",
                  isActive
                    ? "text-text-muted hover:bg-bg-tertiary hover:text-text-primary"
                    : "text-transparent group-hover:text-text-muted group-hover:hover:bg-bg-tertiary group-hover:hover:text-text-primary",
                ].join(" ")}
              >
                <X className="h-3 w-3" />
              </span>
            </button>
          );
        })}
      </div>

      {/* Reveal in sidebar */}
      <div className="flex shrink-0 items-center px-0.5">
        <Tooltip label="Reveal in sidebar">
          <button
            onClick={isOnFilePage ? handleRevealInSidebar : undefined}
            disabled={!isOnFilePage}
            className={[
              "rounded p-1 transition-colors",
              isOnFilePage
                ? "text-text-muted hover:bg-bg-tertiary hover:text-text-primary"
                : "cursor-default text-text-muted/30",
            ].join(" ")}
            aria-label="Reveal current file in sidebar"
          >
            <Crosshair className="h-4 w-4" />
          </button>
        </Tooltip>
      </div>

      {/* Home */}
      <div className="flex shrink-0 items-center px-0.5">
        <Tooltip label="Home" shortcut="⌘⇧H">
          <button
            onClick={() => setPaneContent(activePaneId, "home")}
            className={[
              "rounded p-1 transition-colors",
              activeLeaf?.contentType === "home"
                ? "bg-bg-tertiary text-text-primary"
                : "text-text-muted hover:bg-bg-tertiary hover:text-text-primary",
            ].join(" ")}
            aria-label="Home"
          >
            <Home className="h-4 w-4" />
          </button>
        </Tooltip>
      </div>

      {/* Recent */}
      <div className="flex shrink-0 items-center px-0.5">
        <Tooltip label="Recent" shortcut="⌘⇧R">
          <button
            onClick={() => setPaneContent(activePaneId, "recent")}
            className={[
              "rounded p-1 transition-colors",
              activeLeaf?.contentType === "recent"
                ? "bg-bg-tertiary text-text-primary"
                : "text-text-muted hover:bg-bg-tertiary hover:text-text-primary",
            ].join(" ")}
            aria-label="Recent"
          >
            <Clock className="h-4 w-4" />
          </button>
        </Tooltip>
      </div>

      {/* Split buttons */}
      <div className="flex shrink-0 items-center gap-0 border-l border-border px-1">
        <Tooltip label="Split Right" shortcut="⌘\">
          <button
            onClick={() => splitPane(activePaneId, "horizontal")}
            className="rounded p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            aria-label="Split right"
          >
            <Columns2 className="h-4 w-4" />
          </button>
        </Tooltip>
        <Tooltip label="Split Down" shortcut="⌘⇧\">
          <button
            onClick={() => splitPane(activePaneId, "vertical")}
            className="rounded p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            aria-label="Split down"
          >
            <Rows2 className="h-4 w-4" />
          </button>
        </Tooltip>
        {paneCount > 1 && (
          <Tooltip label="Close Pane" shortcut="⌘⇧W">
            <button
              onClick={() => closePane(activePaneId)}
              className="rounded p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-red-400"
              aria-label="Close pane"
            >
              <X className="h-4 w-4" />
            </button>
          </Tooltip>
        )}
      </div>

      {/* Activity button */}
      <div className="flex shrink-0 items-center border-l border-border px-1.5">
        <Tooltip label="Activity">
          <button
            onClick={toggleActivity}
            aria-label="Toggle activity panel"
            className={[
              "rounded p-1 transition-colors",
              activityOpen
                ? "bg-bg-tertiary text-text-primary"
                : "text-text-muted hover:bg-bg-tertiary hover:text-text-primary",
            ].join(" ")}
          >
            <Bell className="h-4 w-4" />
          </button>
        </Tooltip>
      </div>

      {/* Logo */}
      <div className="flex shrink-0 items-center px-2">
        <img src="/icons/icon.png" alt="Doction" className="h-5 w-5 rounded" />
      </div>
    </div>
  );
}

import { useRef, useCallback } from "react";
import { useRouter, useRouterState } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Folder,
  FileText,
  Sheet,
  Image,
  File,
  Bell,
  Crosshair,
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

function TabIcon({ mimeType }: { mimeType?: string }) {
  if (!mimeType) return <File className="h-3.5 w-3.5 shrink-0 text-text-muted" />;
  if (isFolder(mimeType))      return <Folder   className="h-3.5 w-3.5 shrink-0 text-purple-400" />;
  if (isDocument(mimeType))    return <FileText  className="h-3.5 w-3.5 shrink-0 text-accent" />;
  if (isSpreadsheet(mimeType)) return <Sheet     className="h-3.5 w-3.5 shrink-0 text-green" />;
  if (isImage(mimeType))       return <Image     className="h-3.5 w-3.5 shrink-0 text-text-muted" />;
  return <File className="h-3.5 w-3.5 shrink-0 text-text-muted" />;
}

export function TabBar() {
  const router = useRouter();
  const { tabs, activeTabId, closeTab, setActive, addTab } = useTabsStore();
  const { activityOpen, toggleActivity } = usePanelsStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  function handleTabClick(tab: Tab) {
    setActive(tab.id);
    router.navigate({ to: tab.path });
  }

  function handleClose(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    const { tabs: currentTabs, activeTabId: currentActive } = useTabsStore.getState();

    closeTab(id);

    // If we just closed the active tab, navigate to the new active one
    if (currentActive === id) {
      const idx = currentTabs.findIndex((t) => t.id === id);
      const remaining = currentTabs.filter((t) => t.id !== id);
      if (remaining.length > 0) {
        const newIdx = Math.max(0, idx - 1);
        const target = remaining[newIdx];
        if (target) {
          router.navigate({ to: target.path });
        }
      } else {
        router.navigate({ to: "/" });
      }
    }
  }

  function handleNewTab() {
    const id = addTab({ path: "/", title: "Home" });
    setActive(id);
    router.navigate({ to: "/" });
  }

  function handleBack() {
    router.history.back();
  }

  function handleForward() {
    router.history.forward();
  }

  const { drive } = useApi();
  const { revealPath, setHighlight, expand } = useTreeStateStore();
  const routerState = useRouterState();

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
    <div className="flex h-9 shrink-0 items-stretch border-b border-border bg-bg-secondary">
      {/* Back / Forward */}
      <div className="flex shrink-0 items-center gap-0.5 border-r border-border px-1.5">
        <button
          onClick={handleBack}
          title="Go back"
          className="rounded p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          aria-label="Go back"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={handleForward}
          title="Go forward"
          className="rounded p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          aria-label="Go forward"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Tab list */}
      <div
        ref={scrollRef}
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

      {/* New tab button */}
      <div className="flex shrink-0 items-center border-l border-border px-1.5">
        <button
          onClick={handleNewTab}
          title="New tab"
          className="rounded p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          aria-label="Open new tab"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Reveal in sidebar */}
      <div className="flex shrink-0 items-center px-0.5">
        <button
          onClick={handleRevealInSidebar}
          title="Reveal in sidebar"
          className="rounded p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          aria-label="Reveal current file in sidebar"
        >
          <Crosshair className="h-4 w-4" />
        </button>
      </div>

      {/* Activity button */}
      <div className="flex shrink-0 items-center border-l border-border px-1.5">
        <button
          onClick={toggleActivity}
          title="Activity"
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
      </div>
    </div>
  );
}

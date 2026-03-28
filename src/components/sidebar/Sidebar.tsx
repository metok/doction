import { useState, useCallback, useRef } from "react";
import { PanelLeftClose, PanelLeftOpen, Home, FileText, Sheet, Trash2, Search, Star, Eye, EyeOff } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";
import { open } from "@tauri-apps/plugin-shell";
import { useSidebarStore, MIN_WIDTH } from "@/lib/stores/sidebar";
import { usePanesStore, type PaneContentType } from "@/lib/stores/panes";
import { SearchTrigger } from "./SearchTrigger";
import { QuickNav } from "./QuickNav";
import { SharedDrivesTree, MyDriveTree } from "./FolderTree";
import { FavoritesList } from "./FavoritesList";
import { AccountMenu } from "./AccountMenu";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { FolderPicker } from "@/components/dialogs/FolderPicker";
import { useHiddenItemsStore } from "@/lib/stores/hidden-items";

function ResizeHandle() {
  const { setSidebarWidth, setCollapsed } = useSidebarStore();
  const dragging = useRef(false);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onMouseMove = (e: MouseEvent) => {
        if (!dragging.current) return;
        if (e.clientX < MIN_WIDTH) {
          setCollapsed(true);
          dragging.current = false;
          document.body.style.cursor = "";
          document.body.style.userSelect = "";
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
          return;
        }
        setSidebarWidth(e.clientX);
      };

      const onMouseUp = () => {
        dragging.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [setSidebarWidth, setCollapsed],
  );

  return (
    <div
      onMouseDown={onMouseDown}
      className="absolute top-0 right-0 z-10 h-full w-1 translate-x-1/2 cursor-col-resize hover:bg-accent/50 active:bg-accent/50"
    />
  );
}

function HiddenToggle() {
  const showHidden = useHiddenItemsStore((s) => s.showHidden);
  const toggleShowHidden = useHiddenItemsStore((s) => s.toggleShowHidden);
  const count = useHiddenItemsStore((s) => Object.keys(s.hiddenIds).length);

  if (count === 0) return null;

  return (
    <button
      onClick={toggleShowHidden}
      className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors ${
        showHidden
          ? "bg-bg-tertiary text-text-primary"
          : "text-text-muted hover:bg-bg-tertiary hover:text-text-primary"
      }`}
      title={showHidden ? `Hide ${count} hidden items` : `Show ${count} hidden items`}
    >
      {showHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
    </button>
  );
}

function PaneNavButton({ contentType, icon: Icon, title }: { contentType: PaneContentType; icon: React.ComponentType<{ className?: string }>; title: string }) {
  const activeLeaf = usePanesStore((s) => s.getActiveLeaf());
  const isActive = activeLeaf?.contentType === contentType;

  return (
    <button
      onClick={() => {
        const { activePaneId, setPaneContent } = usePanesStore.getState();
        setPaneContent(activePaneId, contentType);
      }}
      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${isActive ? "bg-bg-tertiary text-text-primary" : "text-text-muted hover:bg-bg-tertiary hover:text-text-primary"}`}
      title={title}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

interface SidebarProps {
  onOpenCommandPalette?: () => void;
}

export function Sidebar({ onOpenCommandPalette }: SidebarProps) {
  const { collapsed, toggle, sidebarWidth } = useSidebarStore();
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const currentFolderId = pathname.startsWith("/folder/")
    ? pathname.split("/folder/")[1]
    : undefined;
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState<"doc" | "sheet">("doc");

  function openNewPicker(type: "doc" | "sheet") {
    setPickerType(type);
    setPickerOpen(true);
  }

  function handleFolderSelected(folderId: string) {
    setPickerOpen(false);
    const url = pickerType === "doc"
      ? `https://docs.google.com/document/create?folder=${folderId}`
      : `https://docs.google.com/spreadsheets/create?folder=${folderId}`;
    open(url);
  }

  if (collapsed) {
    return (
      <aside className="flex h-full w-12 min-w-12 flex-col items-center border-r border-border bg-bg-secondary pt-8 pb-2">
        {/* Expand */}
        <button
          onClick={toggle}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          title="Expand sidebar"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>

        {/* Search */}
        <button
          onClick={() => onOpenCommandPalette?.()}
          className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          title="Search (⌘K)"
        >
          <Search className="h-4 w-4" />
        </button>

        <div className="mx-2 my-2 w-5 border-b border-border/40" />

        {/* Favorites */}
        <PaneNavButton contentType="favorites" icon={Star} title="Favorites" />

        {/* Spacer */}
        <div className="flex-1" />

        {/* Home */}
        <PaneNavButton contentType="home" icon={Home} title="Home" />

        {/* New Doc */}
        <button
          onClick={() => openNewPicker("doc")}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-tertiary hover:text-blue-400"
          title="New Document"
        >
          <FileText className="h-4 w-4" />
        </button>

        {/* Trash */}
        <PaneNavButton contentType="trash" icon={Trash2} title="Trash" />

        <FolderPicker
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          onSelect={handleFolderSelected}
          title={pickerType === "doc" ? "Create Document in..." : "Create Spreadsheet in..."}
          currentFolderId={currentFolderId}
        />
      </aside>
    );
  }

  return (
    <aside
      className="relative flex h-full flex-col border-r border-border bg-bg-secondary"
      style={{ width: sidebarWidth, minWidth: sidebarWidth }}
    >
      {/* ── Top: Account header (with traffic light padding on macOS) ── */}
      <div className="flex h-12 items-center justify-between px-3 pl-[76px]" data-tauri-drag-region>
        <AccountMenu />
        <div className="flex items-center gap-0.5">
          <button
            onClick={toggle}
            className="rounded-md p-1.5 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="px-3 pb-2">
        <SearchTrigger onOpen={() => onOpenCommandPalette?.()} />
      </div>

      {/* ── Quick Nav (Recent, Favorites) ── */}
      <div className="px-2">
        <QuickNav />
      </div>

      {/* ── Favorites ── */}
      <div className="px-2">
        <FavoritesList />
      </div>

      {/* ── Separator ── */}
      <div className="mx-3 my-2 border-b border-border/40" />

      {/* ── Drives area: takes remaining space, scrollable ── */}
      <div className="flex min-h-0 flex-1 flex-col border-t border-border/40">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2">
          <SharedDrivesTree />
          <MyDriveTree />
        </div>
      </div>

      {/* ── Quick action toolbar ── */}
      <div className="flex items-center justify-center gap-1 border-t border-border/40 px-3 py-2.5">
        <PaneNavButton contentType="home" icon={Home} title="Home" />

        <button
          onClick={() => openNewPicker("doc")}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-tertiary hover:text-blue-400"
          title="New Document"
        >
          <FileText className="h-4 w-4" />
        </button>

        <button
          onClick={() => openNewPicker("sheet")}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-tertiary hover:text-emerald-400"
          title="New Spreadsheet"
        >
          <Sheet className="h-4 w-4" />
        </button>

        <PaneNavButton contentType="trash" icon={Trash2} title="Trash" />

        <HiddenToggle />

        <ThemeToggle />
      </div>

      {/* Folder picker dialog */}
      <FolderPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleFolderSelected}
        title={pickerType === "doc" ? "Create Document in..." : "Create Spreadsheet in..."}
        currentFolderId={currentFolderId}
      />
      <ResizeHandle />
    </aside>
  );
}

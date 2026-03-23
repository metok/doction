import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen, Home, FileText, Sheet, Trash2, Search, Clock, Star, Eye, EyeOff } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { open } from "@tauri-apps/plugin-shell";
import { useSidebarStore } from "@/lib/stores/sidebar";
import { SearchTrigger } from "./SearchTrigger";
import { QuickNav } from "./QuickNav";
import { SharedDrivesTree, MyDriveTree } from "./FolderTree";
import { FavoritesList } from "./FavoritesList";
import { AccountMenu } from "./AccountMenu";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { FolderPicker } from "@/components/dialogs/FolderPicker";
import { useHiddenItemsStore } from "@/lib/stores/hidden-items";

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

interface SidebarProps {
  onOpenCommandPalette?: () => void;
}

export function Sidebar({ onOpenCommandPalette }: SidebarProps) {
  const { collapsed, toggle } = useSidebarStore();
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
      <aside className="flex h-full w-12 min-w-12 flex-col items-center border-r border-border bg-bg-secondary py-2">
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

        {/* Recent */}
        <Link
          to="/recent"
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${pathname === "/recent" ? "bg-bg-tertiary text-text-primary" : "text-text-muted hover:bg-bg-tertiary hover:text-text-primary"}`}
          title="Recent"
        >
          <Clock className="h-4 w-4" />
        </Link>

        {/* Favorites */}
        <Link
          to="/favorites"
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${pathname === "/favorites" ? "bg-bg-tertiary text-text-primary" : "text-text-muted hover:bg-bg-tertiary hover:text-text-primary"}`}
          title="Favorites"
        >
          <Star className="h-4 w-4" />
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Home */}
        <Link
          to="/"
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${pathname === "/" ? "bg-bg-tertiary text-text-primary" : "text-text-muted hover:bg-bg-tertiary hover:text-text-primary"}`}
          title="Home"
        >
          <Home className="h-4 w-4" />
        </Link>

        {/* New Doc */}
        <button
          onClick={() => openNewPicker("doc")}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-tertiary hover:text-blue-400"
          title="New Document"
        >
          <FileText className="h-4 w-4" />
        </button>

        {/* Trash */}
        <Link
          to="/trash"
          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${pathname === "/trash" ? "bg-bg-tertiary text-text-primary" : "text-text-muted hover:bg-bg-tertiary hover:text-text-primary"}`}
          title="Trash"
        >
          <Trash2 className="h-4 w-4" />
        </Link>

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
    <aside className="flex h-full w-[260px] min-w-[260px] flex-col border-r border-border bg-bg-secondary">
      {/* ── Top: Account header ── */}
      <div className="flex h-12 items-center justify-between px-3">
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
        <Link
          to="/"
          className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors ${
            pathname === "/"
              ? "bg-bg-tertiary text-text-primary"
              : "text-text-muted hover:bg-bg-tertiary hover:text-text-primary"
          }`}
          title="Home"
        >
          <Home className="h-4 w-4" />
        </Link>

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

        <Link
          to="/trash"
          className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors ${
            pathname === "/trash"
              ? "bg-bg-tertiary text-text-primary"
              : "text-text-muted hover:bg-bg-tertiary hover:text-text-primary"
          }`}
          title="Trash"
        >
          <Trash2 className="h-4 w-4" />
        </Link>

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
    </aside>
  );
}

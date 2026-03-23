import { PanelLeftClose, PanelLeftOpen, Home, FileText, Sheet, Trash2 } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { open } from "@tauri-apps/plugin-shell";
import { useSidebarStore } from "@/lib/stores/sidebar";
import { SearchTrigger } from "./SearchTrigger";
import { QuickNav } from "./QuickNav";
import { SharedDrivesTree, MyDriveTree } from "./FolderTree";
import { FavoritesList } from "./FavoritesList";
import { AccountMenu } from "./AccountMenu";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

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

  if (collapsed) {
    return (
      <aside className="flex h-full w-12 min-w-12 flex-col items-center border-r border-border bg-bg-secondary py-3">
        <button
          onClick={toggle}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          aria-label="Expand sidebar"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
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
          onClick={() => {
            const url = currentFolderId
              ? `https://docs.google.com/document/create?folder=${currentFolderId}`
              : "https://docs.google.com/document/create";
            open(url);
          }}
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-bg-tertiary hover:text-blue-400"
          title="New Document"
        >
          <FileText className="h-4 w-4" />
        </button>

        <button
          onClick={() => {
            const url = currentFolderId
              ? `https://docs.google.com/spreadsheets/create?folder=${currentFolderId}`
              : "https://docs.google.com/spreadsheets/create";
            open(url);
          }}
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

        <ThemeToggle />
      </div>
    </aside>
  );
}

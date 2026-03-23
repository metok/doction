import { PanelLeftClose, PanelLeftOpen, FilePlus, Trash2, HardDrive } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { open } from "@tauri-apps/plugin-shell";
import { useSidebarStore } from "@/lib/stores/sidebar";
import { SearchTrigger } from "./SearchTrigger";
import { QuickNav } from "./QuickNav";
import { FolderTree } from "./FolderTree";
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
          <ThemeToggle />
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

      {/* ── Main scrollable area: Shared Drives + Favorites content ── */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        <FolderTree />
      </div>

      {/* ── Bottom fixed section ── */}
      <div className="flex flex-col border-t border-border/40">
        {/* My Drive */}
        <Link
          to="/"
          className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors ${
            pathname === "/"
              ? "bg-bg-tertiary text-text-primary"
              : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
          }`}
        >
          <HardDrive className="h-4 w-4 shrink-0" />
          <span>My Drive</span>
        </Link>

        {/* Trash */}
        <Link
          to="/trash"
          className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 text-[13px] font-medium transition-colors ${
            pathname === "/trash"
              ? "bg-bg-tertiary text-text-primary"
              : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
          }`}
        >
          <Trash2 className="h-4 w-4 shrink-0" />
          <span>Trash</span>
        </Link>

        {/* New Page */}
        <div className="p-3 pt-1">
          <button
            onClick={() => {
              const url = currentFolderId
                ? `https://docs.google.com/document/create?folder=${currentFolderId}`
                : "https://docs.google.com/document/create";
              open(url);
            }}
            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          >
            <FilePlus className="h-4 w-4 shrink-0" />
            <span>New Page</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

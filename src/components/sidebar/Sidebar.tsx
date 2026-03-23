import { PanelLeftClose, PanelLeftOpen, FilePlus } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";
import { useSidebarStore } from "@/lib/stores/sidebar";
import { SearchTrigger } from "./SearchTrigger";
import { QuickNav } from "./QuickNav";
import { FolderTree } from "./FolderTree";
import { AccountMenu } from "./AccountMenu";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface SidebarProps {
  onOpenCommandPalette?: () => void;
}

export function Sidebar({ onOpenCommandPalette }: SidebarProps) {
  const { collapsed, toggle } = useSidebarStore();
  const routerState = useRouterState();
  const currentFolderId = routerState.location.pathname.startsWith("/folder/")
    ? routerState.location.pathname.split("/folder/")[1]
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
      {/* Header */}
      <div className="flex h-12 items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold text-white"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
          >
            D
          </div>
          <span className="text-sm font-medium text-text-primary">My Workspace</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            onClick={toggle}
            className="rounded p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <SearchTrigger onOpen={() => onOpenCommandPalette?.()} />
      </div>

      {/* Quick Nav */}
      <div className="px-2 py-1">
        <QuickNav />
      </div>

      {/* Separator */}
      <div className="mx-3 my-2 border-b border-border" />

      {/* Folder Tree */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        <FolderTree />
      </div>

      {/* Account menu */}
      <AccountMenu />

      {/* New Page button */}
      <div className="border-t border-border p-3">
        <button
          onClick={() => {
            const url = currentFolderId
              ? `https://docs.google.com/document/create?folder=${currentFolderId}`
              : "https://docs.google.com/document/create";
            window.open(url, "_blank");
          }}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent/10 px-3 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/20"
        >
          <FilePlus className="h-4 w-4 shrink-0" />
          <span>New Page</span>
        </button>
      </div>
    </aside>
  );
}

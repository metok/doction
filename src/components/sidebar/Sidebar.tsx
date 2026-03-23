import { PanelLeftClose, PanelLeftOpen, FilePlus } from "lucide-react";
import { useSidebarStore } from "@/lib/stores/sidebar";
import { SearchTrigger } from "./SearchTrigger";
import { QuickNav } from "./QuickNav";
import { FolderTree } from "./FolderTree";

export function Sidebar() {
  const { collapsed, toggle } = useSidebarStore();

  return (
    <aside
      className="flex h-full flex-col border-r border-border bg-bg-secondary transition-all duration-200"
      style={{ width: collapsed ? 0 : 260, minWidth: collapsed ? 0 : 260, overflow: "hidden" }}
    >
      {/* Header */}
      <div className="flex h-12 items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold text-white"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
          >
            D
          </div>
          {!collapsed && (
            <span className="text-sm font-medium text-text-primary">My Workspace</span>
          )}
        </div>
        <button
          onClick={toggle}
          className="rounded p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Search */}
          <div className="px-2 pb-1">
            <SearchTrigger onOpen={() => {}} />
          </div>

          {/* Quick Nav */}
          <div className="px-2 py-1">
            <QuickNav />
          </div>

          {/* Separator */}
          <div className="border-b border-border mx-2 my-1" />

          {/* Folder Tree */}
          <div className="flex-1 overflow-y-auto px-1 py-1">
            <FolderTree />
          </div>

          {/* New Page button */}
          <div className="border-t border-border p-2">
            <button
              onClick={() =>
                window.open("https://docs.google.com/document/create", "_blank")
              }
              className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            >
              <FilePlus className="h-4 w-4 shrink-0" />
              <span>New Page</span>
            </button>
          </div>
        </>
      )}
    </aside>
  );
}

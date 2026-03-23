import { useSidebarStore } from "@/lib/stores/sidebar";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

export function Sidebar() {
  const { collapsed, toggle } = useSidebarStore();

  return (
    <aside
      className="flex h-full flex-col border-r border-gray-800 bg-gray-900 transition-all duration-200"
      style={{ width: collapsed ? 0 : 260, minWidth: collapsed ? 0 : 260, overflow: "hidden" }}
    >
      {/* Header */}
      <div className="flex h-12 items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 items-center justify-center rounded text-xs font-bold text-white"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            }}
          >
            D
          </div>
          {!collapsed && (
            <span className="text-sm font-medium text-gray-200">
              My Workspace
            </span>
          )}
        </div>
        <button
          onClick={toggle}
          className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Placeholder content */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-2 py-2">
          <div className="space-y-1">
            <div className="rounded px-2 py-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
              Navigation
            </div>
            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-800" />
            <div className="h-4 w-2/3 animate-pulse rounded bg-gray-800" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-gray-800" />
          </div>
        </div>
      )}
    </aside>
  );
}

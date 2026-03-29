import { useState, useEffect, useCallback } from "react";
import { createRootRoute, useRouter } from "@tanstack/react-router";
import { Home, Clock, Search, Trash2, Star, Columns2, Rows2, X, Keyboard } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ApiProvider } from "@/lib/api-context";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { CommandPalette } from "@/components/navigation/CommandPalette";
import { ShortcutsModal } from "@/components/dialogs/ShortcutsModal";
import { TabBar } from "@/components/navigation/TabBar";
import { ActivityPanel } from "@/components/panels/ActivityPanel";
import { PaneRenderer } from "@/components/panes/PaneRenderer";
import { usePreferencesStore } from "@/lib/stores/preferences";

import { useTabsStore } from "@/lib/stores/tabs";
import { usePanesStore } from "@/lib/stores/panes";
import { registerActions, unregisterActions, getActions, type AppAction } from "@/lib/actions";

/** Map a URL pathname to pane content. */
function pathToPane(path: string): { contentType: "home" | "recent" | "favorites" | "trash" | "doc" | "sheet" | "folder" | "file"; contentId?: string } {
  if (path === "/") return { contentType: "home" };
  if (path === "/recent") return { contentType: "recent" };
  if (path === "/favorites") return { contentType: "favorites" };
  if (path === "/trash") return { contentType: "trash" };
  const match = path.match(/^\/(doc|sheet|folder|file)\/(.+)$/);
  if (match) return { contentType: match[1] as "doc" | "sheet" | "folder" | "file", contentId: match[2] };
  return { contentType: "home" };
}

/** Map pane content back to a tab path. Returns null for page-types that don't have tabs. */
function paneToPath(contentType: string, contentId?: string): string | null {
  if (contentId) return `/${contentType}/${contentId}`;
  return null; // home, recent, favorites, trash don't have tabs
}

function RootLayout() {
  const { theme } = usePreferencesStore();

  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const router = useRouter();
  const root = usePanesStore((s) => s.root);

  // Close active tab — navigate any panes showing that content away
  const closeActiveTab = useCallback(() => {
    const activeTab = useTabsStore.getState().tabs.find((t) => t.id === useTabsStore.getState().activeTabId);
    if (!activeTab) return;

    // Figure out what the tab was showing
    const { contentType, contentId } = pathToPane(activeTab.path);

    // Close the tab
    useTabsStore.getState().closeTab(activeTab.id);

    // Navigate all panes showing this content away (back or home)
    usePanesStore.getState().navigatePanesAwayFrom(contentType, contentId);
  }, []);

  // Navigate active pane to a page-type content
  const navigatePane = useCallback((contentType: "home" | "recent" | "favorites" | "trash") => {
    usePanesStore.getState().setPaneContent(usePanesStore.getState().activePaneId, contentType);
  }, []);

  // Register global actions
  useEffect(() => {
    const actions: AppAction[] = [
      { id: "nav:home", label: "Go to Home", icon: Home, shortcut: "⌘⇧H", keys: { mod: true, shift: true, key: "h" }, group: "navigation", run: () => navigatePane("home") },
      { id: "nav:recent", label: "Go to Recent", icon: Clock, shortcut: "⌘⇧R", keys: { mod: true, shift: true, key: "r" }, group: "navigation", run: () => navigatePane("recent") },
      { id: "nav:favorites", label: "Go to Favorites", icon: Star, shortcut: "⌘⇧F", keys: { mod: true, shift: true, key: "f" }, group: "navigation", run: () => navigatePane("favorites") },
      { id: "nav:trash", label: "Go to Trash", icon: Trash2, group: "navigation", run: () => navigatePane("trash") },
      { id: "nav:search", label: "Search", icon: Search, shortcut: "⌘K", keys: { mod: true, key: "k" }, group: "navigation", run: () => setCmdkOpen(true) },
      { id: "tab:close", label: "Close Tab", icon: X, shortcut: "⌘W", keys: { mod: true, key: "w" }, group: "view", run: closeActiveTab },
      { id: "pane:split-right", label: "Split Right", icon: Columns2, shortcut: "⌘\\", keys: { mod: true, key: "\\" }, group: "view", run: () => usePanesStore.getState().splitPane(usePanesStore.getState().activePaneId, "horizontal") },
      { id: "pane:split-down", label: "Split Down", icon: Rows2, shortcut: "⌘⇧\\", keys: { mod: true, shift: true, key: "\\" }, group: "view", run: () => usePanesStore.getState().splitPane(usePanesStore.getState().activePaneId, "vertical") },
      { id: "pane:close", label: "Close Pane", icon: X, shortcut: "⌘⇧W", keys: { mod: true, shift: true, key: "w" }, group: "view", run: () => usePanesStore.getState().closePane(usePanesStore.getState().activePaneId) },
      { id: "help:shortcuts", label: "Keyboard Shortcuts", icon: Keyboard, shortcut: "⌘/", keys: { mod: true, key: "/" }, group: "navigation", run: () => setShortcutsOpen(true) },
    ];
    registerActions(actions);
    return () => unregisterActions(actions.map((a) => a.id));
  }, [router, closeActiveTab, navigatePane]);

  // Sync active tab to match active pane's content
  useEffect(() => {
    return usePanesStore.subscribe((state) => {
      const leaf = state.getActiveLeaf();
      if (!leaf) return;

      const path = paneToPath(leaf.contentType, leaf.contentId);
      if (!path) {
        // Page-type content (home, recent, etc.) — deselect all tabs
        useTabsStore.setState({ activeTabId: null });
        return;
      }

      // Find matching tab and activate it
      const { tabs } = useTabsStore.getState();
      const matching = tabs.find((t) => t.path === path);
      if (matching) {
        useTabsStore.getState().setActive(matching.id);
      } else {
        // No matching tab — deselect
        useTabsStore.setState({ activeTabId: null });
      }
    });
  }, []);

  // Global keyboard handler — matches registered action shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      for (const action of getActions()) {
        if (!action.keys) continue;
        if (!!action.keys.mod !== mod) continue;
        if (!!action.keys.shift !== e.shiftKey) continue;
        if (e.key.toLowerCase() === action.keys.key) {
          e.preventDefault();
          action.run();
          return;
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const themeClass = theme === "light" ? "light" :
    theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "";

  return (
    <AuthGuard fallbackClass={themeClass}>
      <div className={`flex h-screen overflow-hidden rounded-lg bg-bg-primary ${themeClass}`}>
        <ApiProvider>
          <Sidebar onOpenCommandPalette={() => setCmdkOpen(true)} />
          <CommandPalette open={cmdkOpen} onOpenChange={setCmdkOpen} />
          <ShortcutsModal open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
          <div className="flex flex-1 flex-col overflow-hidden">
            <TabBar />
            <main className="flex flex-1 overflow-hidden bg-bg-primary">
              <PaneRenderer node={root} />
            </main>
          </div>
          <ActivityPanel />
        </ApiProvider>
      </div>
    </AuthGuard>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});

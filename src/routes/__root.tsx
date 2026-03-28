import { useState, useEffect, useCallback } from "react";
import { createRootRoute, Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import { Home, Clock, Search, Trash2, Star } from "lucide-react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ApiProvider } from "@/lib/api-context";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { CommandPalette } from "@/components/navigation/CommandPalette";
import { TabBar } from "@/components/navigation/TabBar";
import { ActivityPanel } from "@/components/panels/ActivityPanel";
import { usePreferencesStore } from "@/lib/stores/preferences";
import { useTabsStore } from "@/lib/stores/tabs";
import { registerActions, unregisterActions, getActions, type AppAction } from "@/lib/actions";

function RootLayout() {
  const { theme } = usePreferencesStore();
  const [cmdkOpen, setCmdkOpen] = useState(false);

  const router = useRouter();
  const routerState = useRouterState();
  const { addTab, setActive, tabs } = useTabsStore();

  useEffect(() => {
    const path = routerState.location.pathname;
    // Home and Recent are pinned nav buttons in the tab bar — no tab needed
    if (path === "/" || path === "/recent") return;
    const existing = tabs.find((t) => t.path === path);
    if (existing) {
      setActive(existing.id);
    } else {
      const title = path.split("/").pop() ?? "Page";
      const id = addTab({ path, title });
      setActive(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routerState.location.pathname]);

  // Register global actions
  const closeActiveTab = useCallback(() => {
    const active = tabs.find((t) => t.id === useTabsStore.getState().activeTabId);
    if (active) {
      useTabsStore.getState().closeTab(active.id);
      const remaining = useTabsStore.getState().tabs;
      const newActive = useTabsStore.getState().getActive();
      if (newActive) {
        router.navigate({ to: newActive.path });
      } else if (remaining.length === 0) {
        router.navigate({ to: "/" });
      }
    }
  }, [router, tabs]);

  useEffect(() => {
    const actions: AppAction[] = [
      { id: "nav:home", label: "Go to Home", icon: Home, shortcut: "⌘⇧H", keys: { mod: true, shift: true, key: "h" }, group: "navigation", run: () => router.navigate({ to: "/" }) },
      { id: "nav:recent", label: "Go to Recent", icon: Clock, shortcut: "⌘⇧R", keys: { mod: true, shift: true, key: "r" }, group: "navigation", run: () => router.navigate({ to: "/recent" }) },
      { id: "nav:favorites", label: "Go to Favorites", icon: Star, shortcut: "⌘⇧F", keys: { mod: true, shift: true, key: "f" }, group: "navigation", run: () => router.navigate({ to: "/favorites" }) },
      { id: "nav:trash", label: "Go to Trash", icon: Trash2, group: "navigation", run: () => router.navigate({ to: "/trash" }) },
      { id: "nav:search", label: "Search", icon: Search, shortcut: "⌘K", keys: { mod: true, key: "k" }, group: "navigation", run: () => setCmdkOpen(true) },
      { id: "tab:close", label: "Close Tab", icon: Home, shortcut: "⌘W", keys: { mod: true, key: "w" }, group: "view", run: closeActiveTab },
    ];
    registerActions(actions);
    return () => unregisterActions(actions.map((a) => a.id));
  }, [router, closeActiveTab]);

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

  return (
    <div
      className={`flex h-screen overflow-hidden rounded-lg bg-bg-primary ${
        theme === "light" ? "light" :
        theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : ""
      }`}
    >
      <AuthGuard>
        <ApiProvider>
          <Sidebar onOpenCommandPalette={() => setCmdkOpen(true)} />
          <CommandPalette open={cmdkOpen} onOpenChange={setCmdkOpen} />
          <div className="flex flex-1 flex-col overflow-hidden">
            <TabBar />
            <main className="flex flex-1 flex-col overflow-y-auto bg-bg-primary">
              <Outlet />
            </main>
          </div>
          <ActivityPanel />
        </ApiProvider>
      </AuthGuard>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});

import { useState, useEffect } from "react";
import { createRootRoute, Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ApiProvider } from "@/lib/api-context";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { CommandPalette } from "@/components/navigation/CommandPalette";
import { TabBar } from "@/components/navigation/TabBar";
import { ActivityPanel } from "@/components/panels/ActivityPanel";
import { usePreferencesStore } from "@/lib/stores/preferences";
import { useTabsStore } from "@/lib/stores/tabs";

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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === "k") {
          e.preventDefault();
          setCmdkOpen((prev) => !prev);
        }
        if (e.key === "w") {
          e.preventDefault();
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

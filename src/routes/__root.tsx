import { useState, useEffect } from "react";
import { createRootRoute, Outlet, useRouterState } from "@tanstack/react-router";
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

  const routerState = useRouterState();
  const { addTab, setActive, tabs } = useTabsStore();

  useEffect(() => {
    const path = routerState.location.pathname;
    const existing = tabs.find((t) => t.path === path);
    if (existing) {
      setActive(existing.id);
    } else {
      const title = path === "/" ? "Home" : (path.split("/").pop() ?? "Page");
      const id = addTab({ path, title });
      setActive(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routerState.location.pathname]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCmdkOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div
      className={`flex h-screen overflow-hidden ${
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

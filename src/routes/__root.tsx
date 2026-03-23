import { useState, useEffect } from "react";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ApiProvider } from "@/lib/api-context";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { CommandPalette } from "@/components/navigation/CommandPalette";
import { usePreferencesStore } from "@/lib/stores/preferences";

function RootLayout() {
  const { theme } = usePreferencesStore();
  const [cmdkOpen, setCmdkOpen] = useState(false);

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
          <main className="flex flex-1 flex-col overflow-hidden">
            <Outlet />
          </main>
        </ApiProvider>
      </AuthGuard>
    </div>
  );
}

export const Route = createRootRoute({
  component: RootLayout,
});

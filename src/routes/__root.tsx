import { createRootRoute, Outlet } from "@tanstack/react-router";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ApiProvider } from "@/lib/api-context";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { usePreferencesStore } from "@/lib/stores/preferences";

function RootLayout() {
  const { theme } = usePreferencesStore();

  return (
    <div
      className={`flex h-screen overflow-hidden bg-gray-950 text-gray-100 ${
        theme === "dark" ? "dark" : theme === "light" ? "light" : ""
      }`}
    >
      <AuthGuard>
        <ApiProvider>
          <Sidebar />
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

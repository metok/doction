import React, { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useAuth } from "@/lib/hooks/use-auth";
import { handleAuthCallback } from "@/lib/google/auth";
import { LoginScreen } from "./LoginScreen";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { authenticated, isLoading, refreshAuth } = useAuth();

  useEffect(() => {
    const unlisten = listen<string[]>("deep-link://new-url", async (event) => {
      const url = event.payload[0];
      if (!url) return;
      try {
        const parsed = new URL(url);
        const code = parsed.searchParams.get("code");
        if (code) {
          await handleAuthCallback(code);
          refreshAuth();
        }
      } catch (e) {
        console.error("Failed to handle auth callback:", e);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [refreshAuth]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-indigo-500" />
      </div>
    );
  }

  if (!authenticated) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}

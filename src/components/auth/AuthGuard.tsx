import React, { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useAuth } from "@/lib/hooks/use-auth";
import { LoginScreen } from "./LoginScreen";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { authenticated, isLoading, refreshAuth } = useAuth();

  // Listen for auth-success event from Rust backend (localhost OAuth callback)
  useEffect(() => {
    const unlistenSuccess = listen("auth-success", () => {
      refreshAuth();
    });
    const unlistenError = listen<string>("auth-error", (event) => {
      console.error("Auth error:", event.payload);
    });

    return () => {
      unlistenSuccess.then((fn) => fn());
      unlistenError.then((fn) => fn());
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

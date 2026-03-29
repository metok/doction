import React, { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { useAuth } from "@/lib/hooks/use-auth";
import { LoginScreen } from "./LoginScreen";

interface AuthGuardProps {
  children: React.ReactNode;
  fallbackClass?: string;
}

export function AuthGuard({ children, fallbackClass = "" }: AuthGuardProps) {
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
      <div className={`flex h-screen items-center justify-center bg-[#09090f] ${fallbackClass}`}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-indigo-500" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className={fallbackClass}>
        <LoginScreen />
      </div>
    );
  }

  return <>{children}</>;
}

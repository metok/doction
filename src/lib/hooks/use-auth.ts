import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  isAuthenticated,
  startLogin,
  logout as logoutFn,
} from "../google/auth";
import { useApi } from "../api-context";

const STALE_TIME = 2 * 60 * 1000; // 2 minutes

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: authenticated = false, isLoading } = useQuery({
    queryKey: ["auth", "status"],
    queryFn: isAuthenticated,
    staleTime: STALE_TIME,
  });

  const login = useCallback(async () => {
    await startLogin();
    await queryClient.invalidateQueries({ queryKey: ["auth"] });
  }, [queryClient]);

  const logout = useCallback(async () => {
    await logoutFn();
    await queryClient.invalidateQueries({ queryKey: ["auth"] });
    queryClient.clear();
  }, [queryClient]);

  const refreshAuth = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["auth"] });
  }, [queryClient]);

  return { authenticated, isLoading, login, logout, refreshAuth };
}

export function useUserInfo() {
  const { drive } = useApi();
  return useQuery({
    queryKey: ["user-info"],
    queryFn: () => drive.getUserInfo(),
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

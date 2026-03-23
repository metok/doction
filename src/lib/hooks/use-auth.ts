import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  isAuthenticated,
  startLogin,
  logout as logoutFn,
} from "../google/auth";

const STALE_TIME = 2 * 60 * 1000; // 2 minutes

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: authenticated = false, isLoading } = useQuery({
    queryKey: ["auth", "status"],
    queryFn: isAuthenticated,
    staleTime: STALE_TIME,
  });

  async function login() {
    await startLogin();
    await queryClient.invalidateQueries({ queryKey: ["auth"] });
  }

  async function logout() {
    await logoutFn();
    await queryClient.invalidateQueries({ queryKey: ["auth"] });
    queryClient.clear();
  }

  async function refreshAuth() {
    await queryClient.invalidateQueries({ queryKey: ["auth"] });
  }

  return { authenticated, isLoading, login, logout, refreshAuth };
}

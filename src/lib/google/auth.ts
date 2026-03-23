import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-shell";

export async function startLogin(): Promise<void> {
  const authUrl = await invoke<string>("start_auth");
  await open(authUrl);
}

export async function handleAuthCallback(code: string): Promise<void> {
  await invoke("exchange_code", { code });
}

export async function getAccessToken(): Promise<string> {
  return invoke<string>("get_access_token");
}

export async function logout(): Promise<void> {
  await invoke("logout");
}

export async function isAuthenticated(): Promise<boolean> {
  return invoke<boolean>("is_authenticated");
}

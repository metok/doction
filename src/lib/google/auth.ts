import { invoke } from "@tauri-apps/api/core";

export async function startLogin(): Promise<void> {
  // start_auth opens browser and starts localhost callback server internally
  await invoke("start_auth");
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

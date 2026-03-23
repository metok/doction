import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Tauri convention: use port 1420
  server: {
    port: 1420,
    strictPort: true,
  },
  // Tauri expects a fixed port, fail if it's not available
  clearScreen: false,
});

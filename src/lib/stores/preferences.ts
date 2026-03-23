import { create } from "zustand";
import { persist } from "zustand/middleware";

type Theme = "dark" | "light" | "system";
type ViewMode = "grid" | "list";

interface PreferencesState {
  theme: Theme;
  viewMode: ViewMode;
  setTheme: (theme: Theme) => void;
  setViewMode: (viewMode: ViewMode) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      theme: "system",
      viewMode: "grid",
      setTheme: (theme) => set({ theme }),
      setViewMode: (viewMode) => set({ viewMode }),
    }),
    {
      name: "doction-preferences",
    },
  ),
);

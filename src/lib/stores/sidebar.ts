import { create } from "zustand";
import { persist } from "zustand/middleware";

const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 160;
const MAX_WIDTH = 480;

interface SidebarState {
  collapsed: boolean;
  sidebarWidth: number;
  toggle: () => void;
  setCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
}

export { DEFAULT_WIDTH, MIN_WIDTH, MAX_WIDTH };

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      sidebarWidth: DEFAULT_WIDTH,
      toggle: () => set((state) => ({ collapsed: !state.collapsed })),
      setCollapsed: (collapsed) => set({ collapsed }),
      setSidebarWidth: (width) =>
        set({ sidebarWidth: Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width)) }),
    }),
    {
      name: "doction-sidebar",
      partialize: (state) => ({
        collapsed: state.collapsed,
        sidebarWidth: state.sidebarWidth,
      }),
    },
  ),
);

import { create } from "zustand";

interface SidebarState {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (collapsed: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  collapsed: false,
  toggle: () => set((state) => ({ collapsed: !state.collapsed })),
  setCollapsed: (collapsed) => set({ collapsed }),
}));

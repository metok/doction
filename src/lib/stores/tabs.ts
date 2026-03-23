import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Tab {
  id: string;       // unique tab id
  path: string;     // route path like /folder/abc or /doc/xyz
  title: string;
  mimeType?: string; // for icon
}

interface TabsState {
  tabs: Tab[];
  activeTabId: string | null;
  addTab: (tab: Omit<Tab, "id">) => string;
  closeTab: (id: string) => void;
  setActive: (id: string) => void;
  updateTab: (id: string, updates: Partial<Tab>) => void;
  getActive: () => Tab | undefined;
}

const MAX_TABS = 20;

export const useTabsStore = create<TabsState>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,

      addTab: (tab) => {
        const id = crypto.randomUUID();
        set((s) => {
          const tabs = [...s.tabs, { ...tab, id }];
          // Cap at MAX_TABS by dropping oldest from the left
          return { tabs: tabs.slice(-MAX_TABS) };
        });
        return id;
      },

      closeTab: (id) => {
        set((s) => {
          const idx = s.tabs.findIndex((t) => t.id === id);
          const newTabs = s.tabs.filter((t) => t.id !== id);

          let newActiveId = s.activeTabId;
          if (s.activeTabId === id) {
            if (newTabs.length === 0) {
              newActiveId = null;
            } else {
              // Activate left neighbour, or right if leftmost
              const newIdx = Math.max(0, idx - 1);
              newActiveId = newTabs[newIdx]?.id ?? null;
            }
          }

          return { tabs: newTabs, activeTabId: newActiveId };
        });
      },

      setActive: (id) => {
        set({ activeTabId: id });
      },

      updateTab: (id, updates) => {
        set((s) => ({
          tabs: s.tabs.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));
      },

      getActive: () => {
        const s = get();
        return s.tabs.find((t) => t.id === s.activeTabId);
      },
    }),
    { name: "doction-tabs" },
  ),
);

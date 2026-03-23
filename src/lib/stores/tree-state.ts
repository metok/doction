import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TreeState {
  expandedIds: Record<string, boolean>;
  highlightId: string | null;
  toggle: (id: string) => void;
  expand: (id: string) => void;
  isExpanded: (id: string) => boolean;
  revealPath: (ids: string[]) => void;
  setHighlight: (id: string | null) => void;
}

export const useTreeStateStore = create<TreeState>()(
  persist(
    (set, get) => ({
      expandedIds: {},
      highlightId: null,
      toggle: (id) =>
        set((state) => ({
          expandedIds: {
            ...state.expandedIds,
            [id]: !state.expandedIds[id],
          },
        })),
      expand: (id) =>
        set((state) => ({
          expandedIds: { ...state.expandedIds, [id]: true },
        })),
      isExpanded: (id) => !!get().expandedIds[id],
      revealPath: (ids) =>
        set((state) => {
          const next = { ...state.expandedIds };
          for (const id of ids) next[id] = true;
          return { expandedIds: next };
        }),
      setHighlight: (id) => set({ highlightId: id }),
    }),
    {
      name: "doction-tree-state",
      partialize: (state) => ({ expandedIds: state.expandedIds }),
    },
  ),
);

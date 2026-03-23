import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TreeState {
  expandedIds: Record<string, boolean>;
  toggle: (id: string) => void;
  isExpanded: (id: string) => boolean;
}

export const useTreeStateStore = create<TreeState>()(
  persist(
    (set, get) => ({
      expandedIds: {},
      toggle: (id) =>
        set((state) => ({
          expandedIds: {
            ...state.expandedIds,
            [id]: !state.expandedIds[id],
          },
        })),
      isExpanded: (id) => !!get().expandedIds[id],
    }),
    { name: "doction-tree-state" },
  ),
);

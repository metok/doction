import { create } from "zustand";
import { persist } from "zustand/middleware";

interface HiddenItemsState {
  hiddenIds: Record<string, boolean>;
  toggle: (id: string) => void;
  isHidden: (id: string) => boolean;
  showHidden: boolean;
  toggleShowHidden: () => void;
  hiddenCount: () => number;
}

export const useHiddenItemsStore = create<HiddenItemsState>()(
  persist(
    (set, get) => ({
      hiddenIds: {},
      showHidden: false,
      toggle: (id) =>
        set((s) => {
          const next = { ...s.hiddenIds };
          if (next[id]) {
            delete next[id];
          } else {
            next[id] = true;
          }
          return { hiddenIds: next };
        }),
      isHidden: (id) => !!get().hiddenIds[id],
      toggleShowHidden: () => set((s) => ({ showHidden: !s.showHidden })),
      hiddenCount: () => Object.keys(get().hiddenIds).length,
    }),
    { name: "doction-hidden-items" },
  ),
);

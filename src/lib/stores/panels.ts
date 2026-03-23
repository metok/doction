import { create } from "zustand";

interface PanelsState {
  activityOpen: boolean;
  toggleActivity: () => void;
  closeActivity: () => void;
}

export const usePanelsStore = create<PanelsState>((set) => ({
  activityOpen: false,
  toggleActivity: () => set((s) => ({ activityOpen: !s.activityOpen })),
  closeActivity: () => set({ activityOpen: false }),
}));

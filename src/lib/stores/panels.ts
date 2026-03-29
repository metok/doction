import { create } from "zustand";

interface PanelsState {
  activityOpen: boolean;
  toggleActivity: () => void;
  closeActivity: () => void;
  versionHistoryOpen: boolean;
  versionHistoryFileId: string | null;
  openVersionHistory: (fileId: string) => void;
  closeVersionHistory: () => void;
}

export const usePanelsStore = create<PanelsState>((set) => ({
  activityOpen: false,
  toggleActivity: () => set((s) => ({ activityOpen: !s.activityOpen })),
  closeActivity: () => set({ activityOpen: false }),
  versionHistoryOpen: false,
  versionHistoryFileId: null,
  openVersionHistory: (fileId: string) =>
    set({ versionHistoryOpen: true, versionHistoryFileId: fileId }),
  closeVersionHistory: () =>
    set({ versionHistoryOpen: false, versionHistoryFileId: null }),
}));

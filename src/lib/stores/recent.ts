import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DriveFile } from "../google/types";

interface RecentState {
  files: DriveFile[];
  addFile: (file: DriveFile) => void;
  clear: () => void;
}

export const useRecentStore = create<RecentState>()(
  persist(
    (set) => ({
      files: [],
      addFile: (file) =>
        set((state) => {
          const deduped = state.files.filter((f) => f.id !== file.id);
          return { files: [file, ...deduped].slice(0, 50) };
        }),
      clear: () => set({ files: [] }),
    }),
    {
      name: "doction-recent",
    },
  ),
);

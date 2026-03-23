import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DriveFile } from "../google/types";

interface FavoritesState {
  files: DriveFile[];
  add: (file: DriveFile) => void;
  remove: (fileId: string) => void;
  isFavorite: (fileId: string) => boolean;
  toggle: (file: DriveFile) => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      files: [],
      add: (file) =>
        set((s) => ({
          files: s.files.some((f) => f.id === file.id) ? s.files : [file, ...s.files],
        })),
      remove: (fileId) =>
        set((s) => ({ files: s.files.filter((f) => f.id !== fileId) })),
      isFavorite: (fileId) => get().files.some((f) => f.id === fileId),
      toggle: (file) => {
        if (get().isFavorite(file.id)) {
          get().remove(file.id);
        } else {
          get().add(file);
        }
      },
    }),
    { name: "doction-favorites" },
  ),
);

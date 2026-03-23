import { create } from "zustand";
import { persist } from "zustand/middleware";

interface FileOrderState {
  orders: Record<string, string[]>;
  setOrder: (folderId: string, fileIds: string[]) => void;
  getOrder: (folderId: string) => string[] | undefined;
}

export const useFileOrderStore = create<FileOrderState>()(
  persist(
    (set, get) => ({
      orders: {},
      setOrder: (folderId, fileIds) =>
        set((state) => ({
          orders: { ...state.orders, [folderId]: fileIds },
        })),
      getOrder: (folderId) => get().orders[folderId],
    }),
    {
      name: "doction-file-order",
    },
  ),
);

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Account {
  email: string;
  name: string;
  picture?: string;
}

interface AccountsState {
  accounts: Account[];
  activeEmail: string | null;
  addAccount: (account: Account) => void;
  removeAccount: (email: string) => void;
  setActive: (email: string) => void;
  getActive: () => Account | undefined;
}

export const useAccountsStore = create<AccountsState>()(
  persist(
    (set, get) => ({
      accounts: [],
      activeEmail: null,
      addAccount: (account) =>
        set((s) => ({
          accounts: s.accounts.some((a) => a.email === account.email)
            ? s.accounts.map((a) => (a.email === account.email ? account : a))
            : [...s.accounts, account],
          activeEmail: account.email,
        })),
      removeAccount: (email) =>
        set((s) => ({
          accounts: s.accounts.filter((a) => a.email !== email),
          activeEmail: s.activeEmail === email ? null : s.activeEmail,
        })),
      setActive: (email) => set({ activeEmail: email }),
      getActive: () => {
        const s = get();
        return s.accounts.find((a) => a.email === s.activeEmail);
      },
    }),
    { name: "doction-accounts" },
  ),
);

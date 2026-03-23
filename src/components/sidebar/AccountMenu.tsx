import { useState, useRef, useEffect } from "react";
import { ChevronDown, LogOut, Plus, Check } from "lucide-react";
import { useAuth, useUserInfo } from "@/lib/hooks/use-auth";
import { useAccountsStore } from "@/lib/stores/accounts";
import type { Account } from "@/lib/stores/accounts";

export function AccountMenu() {
  const { logout, login } = useAuth();
  const { data: userInfo } = useUserInfo();
  const { accounts, activeEmail, addAccount, removeAccount, setActive } = useAccountsStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Sync current user info into accounts store
  useEffect(() => {
    if (userInfo?.email) {
      addAccount({
        email: userInfo.email,
        name: userInfo.name ?? userInfo.email.split("@")[0],
        picture: userInfo.picture,
      });
    }
  }, [userInfo, addAccount]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const displayName = userInfo?.name ?? userInfo?.email?.split("@")[0] ?? "Workspace";

  function handleSwitchTo(account: Account) {
    setActive(account.email);
    setOpen(false);
    // In the future, this would switch tokens. For now, it shows which account is active.
  }

  function handleAddAccount() {
    setOpen(false);
    login();
  }

  function handleRemoveAccount(email: string) {
    removeAccount(email);
    if (email === activeEmail) {
      logout();
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors hover:bg-bg-tertiary"
      >
        {userInfo?.picture ? (
          <img src={userInfo.picture} alt={displayName} className="h-5 w-5 shrink-0 rounded object-cover" />
        ) : (
          <div
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}
          >
            {displayName[0]?.toUpperCase()}
          </div>
        )}
        <span className="text-[13px] font-semibold text-text-primary">{displayName}</span>
        <ChevronDown className="h-3 w-3 text-text-muted" />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-xl border border-border bg-bg-secondary shadow-2xl">
          {/* Account list */}
          <div className="border-b border-border/40 p-2">
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Accounts
            </p>
            {accounts.map((account) => (
              <div
                key={account.email}
                className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-bg-tertiary"
              >
                {account.picture ? (
                  <img src={account.picture} alt={account.name} className="h-8 w-8 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-sm font-bold text-accent">
                    {account.name[0]?.toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => handleSwitchTo(account)}
                  className="flex min-w-0 flex-1 cursor-pointer flex-col text-left"
                >
                  <span className="truncate text-[13px] font-medium text-text-primary">{account.name}</span>
                  <span className="truncate text-[11px] text-text-muted">{account.email}</span>
                </button>
                {account.email === activeEmail && (
                  <Check className="h-4 w-4 shrink-0 text-accent" />
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveAccount(account.email); }}
                  className="hidden shrink-0 cursor-pointer rounded p-1 text-text-muted opacity-0 transition-opacity group-hover:block group-hover:opacity-100 hover:text-red-400"
                  title="Remove account"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="p-1">
            <button
              onClick={handleAddAccount}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            >
              <Plus className="h-4 w-4 shrink-0" />
              Add another account
            </button>
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-red-400"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

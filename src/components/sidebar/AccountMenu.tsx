import { useState, useRef, useEffect } from "react";
import { RefreshCw, LogOut } from "lucide-react";
import { useAuth, useUserInfo } from "@/lib/hooks/use-auth";

export function AccountMenu() {
  const { logout } = useAuth();
  const { data: userInfo } = useUserInfo();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handler);
    }
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const initials = userInfo?.email
    ? userInfo.email[0].toUpperCase()
    : userInfo?.name
      ? userInfo.name[0].toUpperCase()
      : "?";

  return (
    <div ref={ref} className="relative border-t border-border p-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-bg-tertiary"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {/* Avatar: photo if available, otherwise initials */}
        {userInfo?.picture ? (
          <img
            src={userInfo.picture}
            alt={userInfo.name ?? userInfo.email}
            className="h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-border"
          />
        ) : (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bg-tertiary text-xs font-medium text-text-secondary ring-1 ring-border">
            {initials}
          </span>
        )}

        {/* Email / name */}
        {userInfo?.email ? (
          <span className="min-w-0 flex-1 truncate text-left text-text-secondary">
            {userInfo.email}
          </span>
        ) : (
          <span className="text-text-secondary">Account</span>
        )}
      </button>

      {open && (
        <div className="absolute bottom-full left-2 right-2 z-50 mb-1 rounded-md border border-border bg-bg-secondary shadow-lg">
          {userInfo && (
            <div className="border-b border-border px-3 py-2.5">
              <p className="truncate text-xs font-medium text-text-primary">
                {userInfo.name}
              </p>
              <p className="truncate text-xs text-text-muted">{userInfo.email}</p>
            </div>
          )}
          <button
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          >
            <RefreshCw className="h-3.5 w-3.5 shrink-0" />
            Switch account
          </button>
          <button
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

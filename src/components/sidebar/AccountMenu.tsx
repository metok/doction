import { useState, useRef, useEffect } from "react";
import { ChevronDown, RefreshCw, LogOut } from "lucide-react";
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
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const displayName = userInfo?.name ?? userInfo?.email?.split("@")[0] ?? "Workspace";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors hover:bg-bg-tertiary"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {userInfo?.picture ? (
          <img
            src={userInfo.picture}
            alt={displayName}
            className="h-5 w-5 shrink-0 rounded object-cover"
          />
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
        <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-border bg-bg-secondary shadow-xl">
          {userInfo && (
            <div className="border-b border-border/60 px-3 py-2.5">
              <p className="truncate text-[13px] font-medium text-text-primary">
                {userInfo.name}
              </p>
              <p className="truncate text-[11px] text-text-muted">{userInfo.email}</p>
            </div>
          )}
          <div className="py-1">
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-[13px] text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            >
              <RefreshCw className="h-3.5 w-3.5 shrink-0" />
              Switch account
            </button>
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-[13px] text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

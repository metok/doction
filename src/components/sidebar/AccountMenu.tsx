import { useState, useRef, useEffect } from "react";
import { User, RefreshCw, LogOut } from "lucide-react";
import { useAuth } from "@/lib/hooks/use-auth";

export function AccountMenu() {
  const { logout } = useAuth();
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

  return (
    <div ref={ref} className="relative border-t border-border p-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-bg-tertiary"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bg-tertiary text-text-secondary ring-1 ring-border">
          <User className="h-3.5 w-3.5" />
        </span>
        <span className="text-text-secondary">Account</span>
      </button>

      {open && (
        <div className="absolute bottom-full left-2 right-2 z-50 mb-1 rounded-md border border-border bg-bg-secondary shadow-lg">
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

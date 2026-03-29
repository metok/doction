import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getActions } from "@/lib/actions";

interface ShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const kbdClass =
  "rounded bg-bg-tertiary px-1.5 py-0.5 font-mono text-[11px] text-text-muted";

const groupLabels: Record<string, string> = {
  navigation: "Navigation",
  view: "View",
  edit: "Edit",
};

export function ShortcutsModal({ open, onOpenChange }: ShortcutsModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  const actions = getActions().filter((a) => a.shortcut);

  // Group actions by group
  const grouped = actions.reduce<Record<string, typeof actions>>(
    (acc, action) => {
      const group = action.group;
      if (!acc[group]) acc[group] = [];
      acc[group].push(action);
      return acc;
    },
    {},
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="shortcuts-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => onOpenChange(false)}
          />

          {/* Modal */}
          <motion.div
            key="shortcuts-modal"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-[15%] z-50 w-[420px] max-w-[calc(100vw-2rem)] -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-bg-secondary shadow-2xl"
          >
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-medium text-text-primary">
                Keyboard Shortcuts
              </h2>
            </div>

            <div className="max-h-[400px] overflow-y-auto px-5 py-3">
              {Object.entries(grouped).map(([group, items]) => (
                <div key={group} className="mb-4 last:mb-0">
                  <h3 className="mb-2 text-xs font-medium text-text-muted">
                    {groupLabels[group] ?? group}
                  </h3>
                  <div className="space-y-1.5">
                    {items.map((action) => (
                      <div
                        key={action.id}
                        className="flex items-center justify-between py-1"
                      >
                        <span className="text-sm text-text-secondary">
                          {action.label}
                        </span>
                        <kbd className={kbdClass}>{action.shortcut}</kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border px-5 py-3">
              <span className="flex items-center gap-1 text-xs text-text-muted">
                <kbd className="rounded bg-bg-tertiary px-1 py-0.5 font-mono">
                  Esc
                </kbd>
                <span>Close</span>
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

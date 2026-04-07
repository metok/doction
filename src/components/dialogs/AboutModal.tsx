import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { open } from "@tauri-apps/plugin-shell";
import appIcon from "@/assets/icon.png";

declare const __APP_VERSION__: string;

interface AboutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AboutModal({ open: isOpen, onOpenChange }: AboutModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onOpenChange(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onOpenChange]);

  function openExternal(url: string) {
    open(url);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="about-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => onOpenChange(false)}
          />

          <motion.div
            key="about-modal"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.15 }}
            className="fixed left-1/2 top-[15%] z-50 w-[380px] max-w-[calc(100vw-2rem)] -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-bg-secondary shadow-2xl"
          >
            <div className="flex flex-col items-center px-6 pt-8 pb-4">
              <img
                src={appIcon}
                alt="Doction"
                className="h-20 w-20 rounded-2xl"
              />
              <h2 className="mt-4 text-lg font-semibold text-text-primary">
                Doction
              </h2>
              <p className="mt-0.5 text-sm text-text-muted">
                Version {__APP_VERSION__}
              </p>
            </div>

            <div className="px-6 pb-4">
              <p className="text-center text-sm leading-relaxed text-text-secondary">
                A modern desktop workspace for Google Drive.
                Browse, view, and organize your Docs, Sheets, images,
                and PDFs in a Notion-like interface.
              </p>
            </div>

            <div className="mx-6 border-t border-border/40" />

            <div className="space-y-1 px-6 py-4">
              <button
                onClick={() => openExternal("https://metok.github.io/doction/")}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
              >
                <span>Website</span>
                <ExternalLink className="h-3.5 w-3.5 text-text-muted" />
              </button>
              <button
                onClick={() => openExternal("https://github.com/metok/doction")}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
              >
                <span>GitHub</span>
                <ExternalLink className="h-3.5 w-3.5 text-text-muted" />
              </button>
              <button
                onClick={() => openExternal("https://github.com/metok/doction/issues")}
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
              >
                <span>Report an Issue</span>
                <ExternalLink className="h-3.5 w-3.5 text-text-muted" />
              </button>
            </div>

            <div className="border-t border-border px-6 py-3 text-center">
              <p className="text-xs text-text-muted">
                Made by Mehmet Emin Tok
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

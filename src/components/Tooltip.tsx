import { useState, useRef, useCallback, type ReactNode } from "react";

interface TooltipProps {
  label: string;
  shortcut?: string;
  children: ReactNode;
  side?: "top" | "bottom";
  delay?: number;
}

export function Tooltip({ label, shortcut, children, side = "bottom", delay = 400 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const ref = useRef<HTMLDivElement>(null);

  const show = useCallback(() => {
    timer.current = setTimeout(() => setVisible(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    clearTimeout(timer.current);
    setVisible(false);
  }, []);

  return (
    <div
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={[
            "pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-md bg-neutral-800 px-2 py-1 text-xs text-neutral-100 shadow-md",
            side === "bottom" ? "top-full mt-1.5" : "bottom-full mb-1.5",
          ].join(" ")}
        >
          <span>{label}</span>
          {shortcut && (
            <kbd className="ml-1.5 rounded bg-white/15 px-1 py-px font-mono text-[10px]">
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  );
}

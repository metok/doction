import { useCallback, useRef } from "react";
import { usePanesStore, type PaneDirection } from "@/lib/stores/panes";

interface ResizeDividerProps {
  splitId: string;
  direction: PaneDirection;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function ResizeDivider({ splitId, direction, containerRef }: ResizeDividerProps) {
  const setSplitRatio = usePanesStore((s) => s.setSplitRatio);
  const dragging = useRef(false);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      dragging.current = true;

      const container = containerRef.current;
      if (!container) return;

      // Add overlay to prevent iframe/content from capturing pointer
      const overlay = document.createElement("div");
      overlay.style.cssText = "position:fixed;inset:0;z-index:9999;cursor:" +
        (direction === "horizontal" ? "col-resize" : "row-resize");
      document.body.appendChild(overlay);

      const onMove = (ev: PointerEvent) => {
        if (!dragging.current) return;
        const rect = container.getBoundingClientRect();
        let ratio: number;
        if (direction === "horizontal") {
          ratio = (ev.clientX - rect.left) / rect.width;
        } else {
          ratio = (ev.clientY - rect.top) / rect.height;
        }
        setSplitRatio(splitId, ratio);
      };

      const onUp = () => {
        dragging.current = false;
        overlay.remove();
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [splitId, direction, containerRef, setSplitRatio],
  );

  return (
    <div
      onPointerDown={handlePointerDown}
      className={[
        "group relative shrink-0 bg-border/40 transition-colors hover:bg-accent/50",
        direction === "horizontal"
          ? "w-[3px] cursor-col-resize"
          : "h-[3px] cursor-row-resize",
      ].join(" ")}
    >
      {/* Wider hit target */}
      <div
        className={[
          "absolute",
          direction === "horizontal"
            ? "inset-y-0 -left-1 -right-1"
            : "inset-x-0 -top-1 -bottom-1",
        ].join(" ")}
      />
    </div>
  );
}

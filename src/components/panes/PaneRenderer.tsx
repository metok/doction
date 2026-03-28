import { useRef } from "react";
import { type PaneNode } from "@/lib/stores/panes";
import { PaneLeafView } from "./PaneLeafView";
import { ResizeDivider } from "./ResizeDivider";

export function PaneRenderer({ node }: { node: PaneNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  if (node.kind === "leaf") {
    return <PaneLeafView pane={node} />;
  }

  const isHorizontal = node.direction === "horizontal";
  const firstPercent = `${node.ratio * 100}%`;
  const secondPercent = `${(1 - node.ratio) * 100}%`;

  return (
    <div
      ref={containerRef}
      className={`flex flex-1 overflow-hidden ${isHorizontal ? "flex-row" : "flex-col"}`}
    >
      <div
        className="flex min-h-0 min-w-0 overflow-hidden"
        style={{ flexBasis: firstPercent, flexGrow: 0, flexShrink: 0 }}
      >
        <PaneRenderer node={node.children[0]} />
      </div>
      <ResizeDivider splitId={node.id} direction={node.direction} containerRef={containerRef} />
      <div
        className="flex min-h-0 min-w-0 overflow-hidden"
        style={{ flexBasis: secondPercent, flexGrow: 0, flexShrink: 0 }}
      >
        <PaneRenderer node={node.children[1]} />
      </div>
    </div>
  );
}

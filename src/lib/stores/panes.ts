import { create } from "zustand";
import { persist } from "zustand/middleware";

// ── Types ─────────────────────────────────────────────────────────────────

export type PaneDirection = "horizontal" | "vertical";

export type PaneContentType =
  | "doc"
  | "sheet"
  | "folder"
  | "file"
  | "home"
  | "recent"
  | "favorites"
  | "trash";

export interface PaneLeaf {
  kind: "leaf";
  id: string;
  contentType: PaneContentType;
  contentId?: string; // docId, folderId, etc.
}

export interface PaneSplit {
  kind: "split";
  id: string;
  direction: PaneDirection;
  ratio: number; // 0–1, first child's share
  children: [PaneNode, PaneNode];
}

export type PaneNode = PaneLeaf | PaneSplit;

// ── Helpers ───────────────────────────────────────────────────────────────

function newId(): string {
  return crypto.randomUUID();
}

function findNode(root: PaneNode, id: string): PaneNode | null {
  if (root.id === id) return root;
  if (root.kind === "split") {
    return findNode(root.children[0], id) || findNode(root.children[1], id);
  }
  return null;
}

function findParent(root: PaneNode, id: string): PaneSplit | null {
  if (root.kind === "split") {
    if (root.children[0].id === id || root.children[1].id === id) return root;
    return findParent(root.children[0], id) || findParent(root.children[1], id);
  }
  return null;
}

/** Replace a node in the tree (immutable). */
function replaceNode(root: PaneNode, id: string, replacement: PaneNode): PaneNode {
  if (root.id === id) return replacement;
  if (root.kind === "split") {
    return {
      ...root,
      children: [
        replaceNode(root.children[0], id, replacement),
        replaceNode(root.children[1], id, replacement),
      ],
    };
  }
  return root;
}

/** Collect all leaf IDs. */
function collectLeafIds(node: PaneNode): string[] {
  if (node.kind === "leaf") return [node.id];
  return [...collectLeafIds(node.children[0]), ...collectLeafIds(node.children[1])];
}

/** Count leaves. */
function countLeaves(node: PaneNode): number {
  if (node.kind === "leaf") return 1;
  return countLeaves(node.children[0]) + countLeaves(node.children[1]);
}

// ── Store ─────────────────────────────────────────────────────────────────

interface PanesState {
  root: PaneNode;
  activePaneId: string;

  /** Split the given pane into two. The original content goes into the first child. */
  splitPane: (paneId: string, direction: PaneDirection) => void;

  /** Close a pane. If it's the last one, resets to home. */
  closePane: (paneId: string) => void;

  /** Focus a pane. */
  setActivePaneId: (id: string) => void;

  /** Update the content shown in a pane. */
  setPaneContent: (paneId: string, contentType: PaneContentType, contentId?: string) => void;

  /** Update split ratio. */
  setSplitRatio: (splitId: string, ratio: number) => void;

  /** Get the active leaf. */
  getActiveLeaf: () => PaneLeaf | null;

  /** Get total number of panes. */
  getPaneCount: () => number;
}

const DEFAULT_PANE_ID = "pane-default";

const defaultRoot: PaneLeaf = {
  kind: "leaf",
  id: DEFAULT_PANE_ID,
  contentType: "home",
};

export const usePanesStore = create<PanesState>()(
  persist(
    (set, get) => ({
      root: defaultRoot,
      activePaneId: DEFAULT_PANE_ID,

      splitPane: (paneId, direction) => {
        set((s) => {
          const node = findNode(s.root, paneId);
          if (!node || node.kind !== "leaf") return s;

          const firstChild: PaneLeaf = { ...node, id: newId() };
          const secondChild: PaneLeaf = { ...node, id: newId() };

          const split: PaneSplit = {
            kind: "split",
            id: newId(),
            direction,
            ratio: 0.5,
            children: [firstChild, secondChild],
          };

          return {
            root: replaceNode(s.root, paneId, split),
            activePaneId: secondChild.id,
          };
        });
      },

      closePane: (paneId) => {
        set((s) => {
          // If only one pane, reset to home
          if (countLeaves(s.root) <= 1) {
            const home: PaneLeaf = { kind: "leaf", id: newId(), contentType: "home" };
            return { root: home, activePaneId: home.id };
          }

          const parent = findParent(s.root, paneId);
          if (!parent) return s;

          // The surviving sibling replaces the parent split
          const sibling = parent.children[0].id === paneId
            ? parent.children[1]
            : parent.children[0];

          const newRoot = replaceNode(s.root, parent.id, sibling);

          // If the closed pane was active, activate the first leaf of the sibling
          let newActiveId = s.activePaneId;
          if (s.activePaneId === paneId) {
            const leaves = collectLeafIds(sibling);
            newActiveId = leaves[0] ?? s.activePaneId;
          }

          return { root: newRoot, activePaneId: newActiveId };
        });
      },

      setActivePaneId: (id) => {
        set({ activePaneId: id });
      },

      setPaneContent: (paneId, contentType, contentId) => {
        set((s) => {
          const node = findNode(s.root, paneId);
          if (!node || node.kind !== "leaf") return s;

          const updated: PaneLeaf = { ...node, contentType, contentId };
          return { root: replaceNode(s.root, paneId, updated) };
        });
      },

      setSplitRatio: (splitId, ratio) => {
        const clamped = Math.min(0.9, Math.max(0.1, ratio));
        set((s) => {
          const node = findNode(s.root, splitId);
          if (!node || node.kind !== "split") return s;

          const updated: PaneSplit = { ...node, ratio: clamped };
          return { root: replaceNode(s.root, splitId, updated) };
        });
      },

      getActiveLeaf: () => {
        const s = get();
        const node = findNode(s.root, s.activePaneId);
        if (node && node.kind === "leaf") return node;
        return null;
      },

      getPaneCount: () => {
        return countLeaves(get().root);
      },
    }),
    { name: "doction-panes" },
  ),
);

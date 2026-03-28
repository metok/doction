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

export interface PaneEntry {
  contentType: PaneContentType;
  contentId?: string;
}

export interface PaneLeaf {
  kind: "leaf";
  id: string;
  contentType: PaneContentType;
  contentId?: string; // docId, folderId, etc.
  history: PaneEntry[];   // past entries (back stack)
  forward: PaneEntry[];   // forward stack
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

function makeLeaf(contentType: PaneContentType, contentId?: string): PaneLeaf {
  return { kind: "leaf", id: newId(), contentType, contentId, history: [], forward: [] };
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

const MAX_HISTORY = 50;

/** Patch old persisted leaf nodes that lack history/forward fields. */
function migrateNode(node: PaneNode): PaneNode {
  if (node.kind === "leaf") {
    return { ...node, history: node.history ?? [], forward: node.forward ?? [] };
  }
  return { ...node, children: [migrateNode(node.children[0]), migrateNode(node.children[1])] };
}

// ── Store ─────────────────────────────────────────────────────────────────

interface PanesState {
  root: PaneNode;
  activePaneId: string;

  splitPane: (paneId: string, direction: PaneDirection) => void;
  closePane: (paneId: string) => void;
  setActivePaneId: (id: string) => void;
  setPaneContent: (paneId: string, contentType: PaneContentType, contentId?: string) => void;
  setSplitRatio: (splitId: string, ratio: number) => void;
  getActiveLeaf: () => PaneLeaf | null;
  getPaneCount: () => number;

  /** Navigate back in the active pane's history. */
  goBack: () => void;
  /** Navigate forward in the active pane's history. */
  goForward: () => void;
  /** Whether the active pane can go back. */
  canGoBack: () => boolean;
  /** Whether the active pane can go forward. */
  canGoForward: () => boolean;
}

const DEFAULT_PANE_ID = "pane-default";

const defaultRoot: PaneLeaf = {
  kind: "leaf",
  id: DEFAULT_PANE_ID,
  contentType: "home",
  history: [],
  forward: [],
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
          const secondChild: PaneLeaf = { ...node, id: newId(), history: [], forward: [] };

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
          if (countLeaves(s.root) <= 1) {
            const home = makeLeaf("home");
            return { root: home, activePaneId: home.id };
          }

          const parent = findParent(s.root, paneId);
          if (!parent) return s;

          const sibling = parent.children[0].id === paneId
            ? parent.children[1]
            : parent.children[0];

          const newRoot = replaceNode(s.root, parent.id, sibling);

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

          // Don't push to history if content is identical
          if (node.contentType === contentType && node.contentId === contentId) return s;

          // Push current state onto history, clear forward stack
          const entry: PaneEntry = { contentType: node.contentType, contentId: node.contentId };
          const history = [...node.history, entry].slice(-MAX_HISTORY);

          const updated: PaneLeaf = { ...node, contentType, contentId, history, forward: [] };
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

      goBack: () => {
        set((s) => {
          const node = findNode(s.root, s.activePaneId);
          if (!node || node.kind !== "leaf" || node.history.length === 0) return s;

          const history = [...node.history];
          const prev = history.pop()!;
          const forwardEntry: PaneEntry = { contentType: node.contentType, contentId: node.contentId };

          const updated: PaneLeaf = {
            ...node,
            contentType: prev.contentType,
            contentId: prev.contentId,
            history,
            forward: [...node.forward, forwardEntry],
          };
          return { root: replaceNode(s.root, s.activePaneId, updated) };
        });
      },

      goForward: () => {
        set((s) => {
          const node = findNode(s.root, s.activePaneId);
          if (!node || node.kind !== "leaf" || node.forward.length === 0) return s;

          const forward = [...node.forward];
          const next = forward.pop()!;
          const historyEntry: PaneEntry = { contentType: node.contentType, contentId: node.contentId };

          const updated: PaneLeaf = {
            ...node,
            contentType: next.contentType,
            contentId: next.contentId,
            history: [...node.history, historyEntry],
            forward,
          };
          return { root: replaceNode(s.root, s.activePaneId, updated) };
        });
      },

      canGoBack: () => {
        const s = get();
        const node = findNode(s.root, s.activePaneId);
        return !!node && node.kind === "leaf" && node.history.length > 0;
      },

      canGoForward: () => {
        const s = get();
        const node = findNode(s.root, s.activePaneId);
        return !!node && node.kind === "leaf" && node.forward.length > 0;
      },
    }),
    {
      name: "doction-panes",
      version: 1,
      migrate: (persisted: unknown) => {
        const state = persisted as Record<string, unknown>;
        if (state && typeof state === "object" && "root" in state) {
          state.root = migrateNode(state.root as PaneNode);
        }
        return state as unknown as PanesState;
      },
    },
  ),
);

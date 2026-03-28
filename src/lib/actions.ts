import type { LucideIcon } from "lucide-react";

export interface AppAction {
  id: string;
  label: string;
  icon: LucideIcon;
  shortcut?: string; // e.g. "⌘⇧H" for display
  keys?: { mod?: boolean; shift?: boolean; key: string }; // for keyboard matching
  group: "navigation" | "view" | "edit";
  run: () => void;
}

// Mutable registry — actions are registered at runtime from React components
const registry: AppAction[] = [];

export function registerActions(actions: AppAction[]) {
  for (const action of actions) {
    const idx = registry.findIndex((a) => a.id === action.id);
    if (idx >= 0) {
      registry[idx] = action;
    } else {
      registry.push(action);
    }
  }
}

export function unregisterActions(ids: string[]) {
  for (const id of ids) {
    const idx = registry.findIndex((a) => a.id === id);
    if (idx >= 0) registry.splice(idx, 1);
  }
}

export function getActions(): AppAction[] {
  return registry;
}

export function filterActions(query: string): AppAction[] {
  const q = query.toLowerCase();
  return registry.filter((a) => a.label.toLowerCase().includes(q));
}

/** Format a shortcut for display in tooltips (e.g. "⌘⇧H") */
export function formatShortcut(shortcut: string): string {
  return shortcut;
}

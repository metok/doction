# Resizable Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the sidebar resizable by dragging the vertical border, with auto-collapse when dragged below 160px.

**Architecture:** Add `sidebarWidth` to the existing Zustand sidebar store with localStorage persistence. Render a drag handle div between sidebar and content. Mouse event listeners on the handle control width in real-time, clamped between 160–480px.

**Tech Stack:** React, Zustand (with persist middleware), Tailwind CSS, mouse events (no extra libraries)

---

### Task 1: Add width state to sidebar store

**Files:**
- Modify: `src/lib/stores/sidebar.ts`

- [ ] **Step 1: Update the store with width state and persistence**

Replace the entire file contents with:

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 160;
const MAX_WIDTH = 480;

interface SidebarState {
  collapsed: boolean;
  sidebarWidth: number;
  toggle: () => void;
  setCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
}

export { DEFAULT_WIDTH, MIN_WIDTH, MAX_WIDTH };

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      collapsed: false,
      sidebarWidth: DEFAULT_WIDTH,
      toggle: () => set((state) => ({ collapsed: !state.collapsed })),
      setCollapsed: (collapsed) => set({ collapsed }),
      setSidebarWidth: (width) =>
        set({ sidebarWidth: Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, width)) }),
    }),
    {
      name: "doction-sidebar",
      partialize: (state) => ({
        collapsed: state.collapsed,
        sidebarWidth: state.sidebarWidth,
      }),
    },
  ),
);
```

- [ ] **Step 2: Verify the app still compiles**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/stores/sidebar.ts
git commit -m "feat: add sidebarWidth state with persistence to sidebar store"
```

---

### Task 2: Use dynamic width in Sidebar component

**Files:**
- Modify: `src/components/sidebar/Sidebar.tsx`

- [ ] **Step 1: Read width from store and apply as inline style**

In `Sidebar.tsx`, change the store destructure on line 42 from:

```typescript
const { collapsed, toggle } = useSidebarStore();
```

to:

```typescript
const { collapsed, toggle, sidebarWidth } = useSidebarStore();
```

Then change the expanded `<aside>` element (line 138) from:

```tsx
<aside className="flex h-full w-[260px] min-w-[260px] flex-col border-r border-border bg-bg-secondary">
```

to:

```tsx
<aside
  className="flex h-full flex-col border-r border-border bg-bg-secondary"
  style={{ width: sidebarWidth, minWidth: sidebarWidth }}
>
```

- [ ] **Step 2: Verify the app still compiles**

Run: `npm run build`
Expected: Build succeeds. Sidebar still renders at 260px (the default).

- [ ] **Step 3: Commit**

```bash
git add src/components/sidebar/Sidebar.tsx
git commit -m "feat: use dynamic width from store for expanded sidebar"
```

---

### Task 3: Add resize handle and drag logic

**Files:**
- Modify: `src/components/sidebar/Sidebar.tsx`

- [ ] **Step 1: Add ResizeHandle component and import hooks**

At the top of `Sidebar.tsx`, add `useCallback` and `useEffect` to the React import:

```typescript
import { useState, useCallback, useEffect, useRef } from "react";
```

Add the import for the store constants:

```typescript
import { useSidebarStore } from "@/lib/stores/sidebar";
import { MIN_WIDTH, MAX_WIDTH } from "@/lib/stores/sidebar";
```

Then add this component before the `Sidebar` function:

```typescript
function ResizeHandle() {
  const { setSidebarWidth, setCollapsed } = useSidebarStore();
  const dragging = useRef(false);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onMouseMove = (e: MouseEvent) => {
        if (!dragging.current) return;
        if (e.clientX < MIN_WIDTH) {
          setCollapsed(true);
          dragging.current = false;
          document.body.style.cursor = "";
          document.body.style.userSelect = "";
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
          return;
        }
        setSidebarWidth(e.clientX);
      };

      const onMouseUp = () => {
        dragging.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [setSidebarWidth, setCollapsed],
  );

  return (
    <div
      onMouseDown={onMouseDown}
      className="absolute top-0 right-0 z-10 h-full w-1 translate-x-1/2 cursor-col-resize hover:bg-accent/50 active:bg-accent/50"
    />
  );
}
```

- [ ] **Step 2: Render the ResizeHandle inside the expanded sidebar**

Change the expanded `<aside>` wrapper to `relative` positioning and add `<ResizeHandle />` as the last child, just before `</aside>`:

```tsx
<aside
  className="relative flex h-full flex-col border-r border-border bg-bg-secondary"
  style={{ width: sidebarWidth, minWidth: sidebarWidth }}
>
  {/* ... existing children ... */}
  <ResizeHandle />
</aside>
```

Add `relative` to the className (it was not there before).

- [ ] **Step 3: Verify the app compiles and test manually**

Run: `npm run build`
Expected: Build succeeds.

Manual test: `npm run tauri dev`
- Hover the border between sidebar and content — cursor should change to col-resize
- Drag left/right — sidebar width should change
- Drag below 160px — sidebar should collapse to icon view
- Refresh — width should persist

- [ ] **Step 4: Commit**

```bash
git add src/components/sidebar/Sidebar.tsx
git commit -m "feat: add drag handle for resizable sidebar with auto-collapse"
```

---

### Task 4: Remove the border-r from aside, avoid double border with handle

**Files:**
- Modify: `src/components/sidebar/Sidebar.tsx`

- [ ] **Step 1: Check for visual issues**

The `<aside>` has `border-r border-border` and the resize handle sits on top of it. This should work fine visually since the handle is transparent by default and only shows a highlight on hover. No changes needed unless there's a visual glitch during testing.

If the border looks doubled or the handle area looks off, remove `border-r border-border` from the expanded `<aside>` and add it to a wrapper div inside instead. But test first — it's likely fine as-is.

- [ ] **Step 2: Verify visually**

Run: `npm run tauri dev`
Check that the border between sidebar and content looks clean — single line, not doubled.

- [ ] **Step 3: Commit (only if changes were made)**

```bash
git add src/components/sidebar/Sidebar.tsx
git commit -m "fix: clean up sidebar border with resize handle"
```

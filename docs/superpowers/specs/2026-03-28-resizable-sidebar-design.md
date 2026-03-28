# Resizable Sidebar

## Overview

Make the sidebar width adjustable by dragging the vertical border between sidebar and content area. When dragged below a minimum width, the sidebar auto-collapses to icon view.

## Behavior

- The existing border line between sidebar and content becomes a drag handle
- 4px invisible hit zone over the border, cursor changes to `col-resize` on hover
- Dragging resizes the sidebar width in real-time
- **Default width**: 260px (current hardcoded value)
- **Min width**: 160px — below this threshold, sidebar auto-collapses to 48px icon view
- **Max width**: 480px
- Width persists across sessions via localStorage (Zustand persist)
- Expanding from collapsed state restores the last saved width

## Technical Changes

### 1. Sidebar Store (`src/lib/stores/sidebar.ts`)

Add `sidebarWidth` to existing store:

```typescript
interface SidebarState {
  collapsed: boolean;
  sidebarWidth: number;     // new
  toggle: () => void;
  setCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;  // new
}
```

Persist `sidebarWidth` to localStorage alongside existing state.

### 2. Sidebar Component (`src/components/sidebar/Sidebar.tsx`)

- Replace fixed `w-[260px] min-w-[260px]` with `style={{ width: sidebarWidth, minWidth: sidebarWidth }}`
- Collapsed aside stays at `w-12 min-w-12` (unchanged)

### 3. Resize Handle

Add a `div` as the drag handle, rendered as a sibling after `<Sidebar />` in the root layout (or as the last child inside Sidebar):

- Positioned on the right edge of the sidebar
- 4px wide, full height, transparent
- `cursor: col-resize` on hover
- Visual feedback: subtle highlight on hover/active

### 4. Drag Logic

Mouse event handling (no library needed):

1. `onMouseDown` on handle: start tracking
2. `document.addEventListener('mousemove')`: update `sidebarWidth` from `e.clientX`
3. `document.addEventListener('mouseup')`: stop tracking, cleanup listeners
4. During drag: `document.body.style.cursor = 'col-resize'` and `user-select: none` to prevent text selection
5. Clamp width between 160px and 480px
6. If `clientX < 160`: call `setCollapsed(true)` to snap to icon view

### 5. Expanding from Collapsed

When sidebar is expanded (via toggle button), restore `sidebarWidth` from store instead of defaulting to 260px.

## Files Changed

- `src/lib/stores/sidebar.ts` — add width state + persistence
- `src/components/sidebar/Sidebar.tsx` — dynamic width, resize handle
- `src/routes/__root.tsx` — potentially, if handle is placed here

## Out of Scope

- Double-click to reset width (keep it simple)
- Animated collapse/expand transitions
- Keyboard resize

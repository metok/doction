# Split Pane — Technical Specification

## Overview

Doction supports VS Code-style split panes, allowing users to view multiple files side-by-side or stacked. Panes can be split horizontally (left/right) or vertically (top/bottom), resized via drag, and closed independently.

## Data Model

### Binary Tree

The pane layout is a **binary tree** stored in Zustand with localStorage persistence (`doction-panes`).

```
PaneNode = PaneLeaf | PaneSplit

PaneLeaf {
  kind: "leaf"
  id: string (UUID)
  contentType: "doc" | "sheet" | "folder" | "file" | "home" | "recent" | "favorites" | "trash"
  contentId?: string   // file/folder ID — absent for page-types (home, recent, etc.)
}

PaneSplit {
  kind: "split"
  id: string (UUID)
  direction: "horizontal" | "vertical"
  ratio: number (0.1–0.9)
  children: [PaneNode, PaneNode]
}
```

Initial state: single leaf with `contentType: "home"`.

### Store Operations

| Operation | Description |
|-----------|-------------|
| `splitPane(paneId, direction)` | Replace leaf with a split. First child = clone of original, second child = copy. New pane becomes active. |
| `closePane(paneId)` | Remove leaf, unwrap parent split (surviving sibling replaces parent). Last pane resets to home. |
| `setPaneContent(paneId, type, id?)` | Update what a leaf displays. |
| `setSplitRatio(splitId, ratio)` | Update divider position (clamped to 0.1–0.9). |
| `setActivePaneId(id)` | Focus a pane. |

## Rendering

### Component Tree

```
__root.tsx
  └─ <PaneRenderer node={root} />
       ├─ PaneLeafView (leaf node)
       │    └─ DocPageContent / SheetPageContent / FolderPageContent / ...
       └─ PaneSplit (split node)
            ├─ <PaneRenderer> (first child)
            ├─ <ResizeDivider>
            └─ <PaneRenderer> (second child)
```

### PaneRenderer (`src/components/panes/PaneRenderer.tsx`)

Recursive component. For leaf nodes, renders `PaneLeafView`. For split nodes, renders two children in a flex container (row for horizontal, column for vertical) separated by a `ResizeDivider`.

Split ratio is applied via `flex-basis` percentages on each child.

### PaneLeafView (`src/components/panes/PaneLeafView.tsx`)

Maps `contentType` to the corresponding content component:

| contentType | Component |
|-------------|-----------|
| `doc` | `DocPageContent` |
| `sheet` | `SheetPageContent` |
| `file` | `FilePageContent` |
| `folder` | `FolderPageContent` |
| `home` | `HomePageContent` |
| `recent` | `RecentPageContent` |
| `favorites` | `FavoritesPageContent` |
| `trash` | `TrashPageContent` |

Active pane is highlighted with `ring-1 ring-inset ring-accent/40` (only when >1 pane exists). Clicking anywhere in a pane sets it as active.

### ResizeDivider (`src/components/panes/ResizeDivider.tsx`)

- 3px bar between panes, widens to ~10px hit target via invisible overlay
- Cursor: `col-resize` (horizontal) / `row-resize` (vertical)
- Hover: accent highlight (`bg-accent/50`)
- Drag: captures pointer globally, adds a full-screen overlay to prevent iframes from stealing events
- Calls `setSplitRatio()` on every move, clamped to `[0.1, 0.9]`

## Navigation

### File Navigation (`useFileNavigation`)

All file clicks (Home page, FolderView, sidebar tree, command palette) go through a single hook:

- **Normal click**: `setPaneContent(activePaneId, contentType, contentId)` + sync tab
- **Ctrl/Cmd+Click**: add background tab without changing active pane

### Sidebar

Static nav buttons (Home, Favorites, Trash) call `setPaneContent` on the active pane. No router navigation — content is rendered directly by the pane system.

### Tab Bar

Clicking a tab calls `setPaneContent` on the active pane with the tab's content.

### URL Strategy

The URL is **not actively synced** to the pane content. The pane tree is the source of truth, persisted in Zustand. Route files still exist as thin wrappers for initial load / deep-link scenarios, but day-to-day navigation bypasses the router.

## Keyboard Shortcuts

| Shortcut | Action | CMD+K Label |
|----------|--------|-------------|
| `⌘\` | Split active pane right (horizontal) | "Split Right" |
| `⌘⇧\` | Split active pane down (vertical) | "Split Down" |
| `⌘⇧W` | Close active pane | "Close Pane" |
| `⌘W` | Close active tab | "Close Tab" |

All shortcuts are registered via the actions registry and appear in the command palette.

## Content Component Extraction

Route pages were refactored into standalone content components that accept props instead of reading route params:

| Route file | Content component | Props |
|------------|-------------------|-------|
| `doc.$docId.tsx` | `DocPageContent` | `{ docId: string }` |
| `sheet.$sheetId.tsx` | `SheetPageContent` | `{ sheetId: string }` |
| `file.$fileId.tsx` | `FilePageContent` | `{ fileId: string }` |
| `folder.$folderId.tsx` | `FolderPageContent` | `{ folderId: string }` |
| `index.tsx` | `HomePageContent` | none |
| `recent.tsx` | `RecentPageContent` | none |
| `favorites.tsx` | `FavoritesPageContent` | none |
| `trash.tsx` | `TrashPageContent` | none |

Route files are thin wrappers: read params, pass to content component.

## Edge Cases

### Last Pane Close
Closing the last pane resets to a single home leaf. Never leaves the user with zero panes.

### Deep Nesting
The binary tree allows arbitrary nesting (split a pane, then split one of the halves, etc.). No artificial depth limit.

### Ratio Clamping
Split ratio is clamped to `[0.1, 0.9]` to prevent collapsing a pane to zero.

### Persistence
Pane layout survives app restart via Zustand's `persist` middleware (localStorage key: `doction-panes`).

## Future Enhancements

### Tab Groups per Pane
Currently tabs are global. VS Code has per-editor-group tabs — each pane would have its own tab strip. This requires adding a `paneId` field to the Tab interface and filtering the TabBar by active pane.

### Drag to Split
Drag a tab from the tab bar onto a pane edge to create a split. Requires drop zone detection (top/bottom/left/right edges of a pane) and integration with @dnd-kit.

### Split from Context Menu
Right-click on a tab to get "Split Right" / "Split Down" options.

### Max Pane Limit
Optional cap on total panes (e.g., 6) to prevent performance degradation with many open content views.

### URL Sync
Optionally sync the active pane's content to the URL for deep-linking. When the active pane changes, `router.navigate({ replace: true })` updates the URL silently.

## File Map

| File | Purpose |
|------|---------|
| `src/lib/stores/panes.ts` | Pane tree Zustand store |
| `src/components/panes/PaneRenderer.tsx` | Recursive tree renderer |
| `src/components/panes/PaneLeafView.tsx` | Content type → component mapping |
| `src/components/panes/ResizeDivider.tsx` | Drag-to-resize divider |
| `src/components/content/*PageContent.tsx` | Extracted content components |
| `src/lib/hooks/use-file-navigation.ts` | Central navigation hook (pane-aware) |
| `src/lib/actions.ts` | Actions registry (split/close actions) |

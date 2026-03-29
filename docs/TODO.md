# TODO

## Planned Features

### Better PDF Viewer
Replace the current iframe-based PDF preview with `react-pdf` or `@react-pdf-viewer`. Add zoom in/out, page navigation, fit-to-width, and text search. Currently PDFs render via browser default with no controls.

- Replace `src/components/content/PdfPreview.tsx`
- Add `react-pdf` dependency
- Add toolbar: page nav, zoom, search

### Multi-Select + Batch Actions
Shift+Click for range selection, Cmd+Click for toggle. Floating action bar at the bottom for bulk operations: Favorite All, Delete, Move to folder.

- Create `src/lib/stores/selection.ts` (selected IDs, range logic)
- Create `src/components/content/BatchActionBar.tsx` (floating bar with actions)
- Modify `src/components/content/FolderView.tsx` (selection click handlers, visual selection state)
- Disable drag-drop when items are selected

### Google Slides Viewer
Basic slide viewing with thumbnail filmstrip on the left and large slide view on the right. Export slides as PNG via Drive API. Arrow keys and click to navigate.

- Create `src/lib/google/slides.ts` (Slides API client)
- Create `src/lib/hooks/use-slides-data.ts`
- Create `src/components/content/SlidesRenderer.tsx`
- Create `src/components/content/SlidesPageContent.tsx`
- Add `"slides"` to `PaneContentType` in panes store
- Update `PaneLeafView.tsx`, `use-file-navigation.ts`, `__root.tsx`

### Drag Files Between Folders
Drag a file onto a folder (in the main view or sidebar tree) to move it via Drive API `files.update` with `addParents`/`removeParents`.

- Add `moveFile(fileId, newParentId, oldParentId)` to `src/lib/google/drive.ts`
- Modify `src/components/content/FolderView.tsx` (folder items as drop targets)
- Modify `src/components/sidebar/FolderTree.tsx` (sidebar folders as drop targets)
- Distinguish reorder drags from move-to-folder drags in `SortableFileList.tsx`

import { usePanesStore, type PaneLeaf } from "@/lib/stores/panes";
import { DocPageContent } from "@/components/content/DocPageContent";
import { SheetPageContent } from "@/components/content/SheetPageContent";
import { FilePageContent } from "@/components/content/FilePageContent";
import { FolderPageContent } from "@/components/content/FolderPageContent";
import { HomePageContent } from "@/components/content/HomePageContent";
import { RecentPageContent } from "@/components/content/RecentPageContent";
import { FavoritesPageContent } from "@/components/content/FavoritesPageContent";
import { TrashPageContent } from "@/components/content/TrashPageContent";

function PaneContent({ pane }: { pane: PaneLeaf }) {
  switch (pane.contentType) {
    case "doc":
      return pane.contentId ? <DocPageContent docId={pane.contentId} /> : null;
    case "sheet":
      return pane.contentId ? <SheetPageContent sheetId={pane.contentId} /> : null;
    case "file":
      return pane.contentId ? <FilePageContent fileId={pane.contentId} /> : null;
    case "folder":
      return pane.contentId ? <FolderPageContent folderId={pane.contentId} /> : null;
    case "home":
      return <HomePageContent />;
    case "recent":
      return <RecentPageContent />;
    case "favorites":
      return <FavoritesPageContent />;
    case "trash":
      return <TrashPageContent />;
    default:
      return null;
  }
}

export function PaneLeafView({ pane }: { pane: PaneLeaf }) {
  const activePaneId = usePanesStore((s) => s.activePaneId);
  const setActive = usePanesStore((s) => s.setActivePaneId);
  const paneCount = usePanesStore((s) => s.getPaneCount());
  const isActive = activePaneId === pane.id;

  return (
    <div
      className={[
        "flex flex-1 flex-col overflow-hidden",
        paneCount > 1 && isActive ? "ring-1 ring-inset ring-accent/40" : "",
      ].join(" ")}
      onMouseDown={() => { if (!isActive) setActive(pane.id); }}
    >
      <PaneContent pane={pane} />
    </div>
  );
}

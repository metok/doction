import { useEffect, useState, useRef, useCallback } from "react";
import { Pencil, Eye } from "lucide-react";
import { Webview } from "@tauri-apps/api/webview";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useSheetData } from "@/lib/hooks/use-sheet-data";
import { useFileMetadata, useFilePath } from "@/lib/hooks/use-drive-files";
import { SheetRenderer } from "@/components/content/SheetRenderer";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTabsStore } from "@/lib/stores/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { Tooltip } from "@/components/Tooltip";

export function SheetPageContent({ sheetId }: { sheetId: string }) {
  const [editing, setEditing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const webviewRef = useRef<Webview | null>(null);
  const { data, isLoading, error } = useSheetData(sheetId);
  const { data: meta } = useFileMetadata(sheetId);
  const { data: path = [], isLoading: pathLoading } = useFilePath(sheetId);
  const { updateTab, tabs } = useTabsStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (meta?.name) {
      const tab = tabs.find((t) => t.path === `/sheet/${sheetId}`);
      if (tab) updateTab(tab.id, { title: meta.name, mimeType: meta.mimeType });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta?.name]);

  const syncWebviewBounds = useCallback(async () => {
    const wv = webviewRef.current;
    const el = contentRef.current;
    if (!wv || !el) return;

    const rect = el.getBoundingClientRect();
    await wv.setPosition(new (await import("@tauri-apps/api/dpi")).LogicalPosition(rect.left, rect.top));
    await wv.setSize(new (await import("@tauri-apps/api/dpi")).LogicalSize(rect.width, rect.height));
  }, []);

  useEffect(() => {
    if (!editing) return;

    let wv: Webview | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let animFrame: number;

    async function create() {
      const el = contentRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const label = `sheet-editor-${sheetId.replace(/[^a-zA-Z0-9-_]/g, "_")}`;

      const existing = await Webview.getByLabel(label);
      if (existing) await existing.close();

      wv = new Webview(getCurrentWindow(), label, {
        url: `https://docs.google.com/spreadsheets/d/${sheetId}/edit`,
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        transparent: false,
      });

      webviewRef.current = wv;

      resizeObserver = new ResizeObserver(() => {
        cancelAnimationFrame(animFrame);
        animFrame = requestAnimationFrame(() => syncWebviewBounds());
      });
      resizeObserver.observe(el);
      window.addEventListener("resize", syncWebviewBounds);
    }

    create();

    return () => {
      if (wv) { wv.close().catch(() => {}); webviewRef.current = null; }
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener("resize", syncWebviewBounds);
      cancelAnimationFrame(animFrame);
    };
  }, [editing, sheetId, syncWebviewBounds]);

  const exitEdit = useCallback(() => {
    setEditing(false);
    queryClient.invalidateQueries({ queryKey: ["sheets", "data", sheetId] });
    queryClient.invalidateQueries({ queryKey: ["drive", "file", sheetId] });
  }, [queryClient, sheetId]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "e") {
        e.preventDefault();
        setEditing((prev) => {
          if (prev) {
            queryClient.invalidateQueries({ queryKey: ["sheets", "data", sheetId] });
            queryClient.invalidateQueries({ queryKey: ["drive", "file", sheetId] });
          }
          return !prev;
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [queryClient, sheetId]);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <Breadcrumbs path={path} isLoading={pathLoading} file={meta} />
        <div className="px-6 py-6">
          {/* Table header */}
          <div className="mb-3 flex gap-4 border-b border-border pb-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
          {/* Table rows */}
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-4 flex-1" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col">
        <Breadcrumbs path={path} isLoading={pathLoading} file={meta} />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-red-400">Failed to load spreadsheet: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Breadcrumbs path={path} isLoading={pathLoading} file={meta} />

      <div className="flex items-center gap-2 border-b border-border px-6 py-1.5">
        <Tooltip label={editing ? "Back to view" : "Edit in Google Sheets"} shortcut="⌘E">
          <button
            onClick={editing ? exitEdit : () => setEditing(true)}
            className={[
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              editing
                ? "bg-accent/15 text-accent"
                : "text-text-muted hover:bg-bg-tertiary hover:text-text-primary",
            ].join(" ")}
          >
            {editing ? <><Eye className="h-3.5 w-3.5" />Done</> : <><Pencil className="h-3.5 w-3.5" />Edit</>}
          </button>
        </Tooltip>
        {editing && (
          <span className="text-[11px] text-text-muted">
            Editing in Google Sheets — changes save automatically
          </span>
        )}
      </div>

      <div ref={contentRef} className="flex-1 overflow-y-auto">
        {!editing && data && <SheetRenderer spreadsheet={data} />}
      </div>
    </div>
  );
}

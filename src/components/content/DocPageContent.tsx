import { useMemo, useEffect, useState, useRef, useCallback } from "react";
import { Pencil, Eye } from "lucide-react";
import { Webview } from "@tauri-apps/api/webview";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useDocContent } from "@/lib/hooks/use-doc-content";
import { useFileMetadata, useFilePath } from "@/lib/hooks/use-drive-files";
import { parseDocContent } from "@/lib/doc-parser";
import { DocRenderer } from "@/components/content/DocRenderer";
import { Breadcrumbs } from "@/components/navigation/Breadcrumbs";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTabsStore } from "@/lib/stores/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { Tooltip } from "@/components/Tooltip";

export function DocPageContent({ docId }: { docId: string }) {
  const [editing, setEditing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const webviewRef = useRef<Webview | null>(null);
  const { data: doc, isLoading, error } = useDocContent(docId);
  const { data: meta } = useFileMetadata(docId);
  const { data: path = [], isLoading: pathLoading } = useFilePath(docId);
  const { updateTab, tabs } = useTabsStore();
  const queryClient = useQueryClient();

  const blocks = useMemo(() => (doc ? parseDocContent(doc) : []), [doc]);

  useEffect(() => {
    if (meta?.name) {
      const tab = tabs.find((t) => t.path === `/doc/${docId}`);
      if (tab) updateTab(tab.id, { title: meta.name, mimeType: meta.mimeType });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta?.name]);

  // Position and resize the webview to match the content area
  const syncWebviewBounds = useCallback(async () => {
    const wv = webviewRef.current;
    const el = contentRef.current;
    if (!wv || !el) return;

    const rect = el.getBoundingClientRect();

    await wv.setPosition(new (await import("@tauri-apps/api/dpi")).LogicalPosition(
      rect.left, rect.top
    ));
    await wv.setSize(new (await import("@tauri-apps/api/dpi")).LogicalSize(
      rect.width, rect.height
    ));
  }, []);

  // Create/destroy webview when editing state changes
  useEffect(() => {
    if (!editing) return;

    let wv: Webview | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let animFrame: number;

    async function create() {
      const el = contentRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const label = `doc-editor-${docId.replace(/[^a-zA-Z0-9-_]/g, "_")}`;

      // Check if webview already exists
      const existing = await Webview.getByLabel(label);
      if (existing) {
        await existing.close();
      }

      wv = new Webview(getCurrentWindow(), label, {
        url: `https://docs.google.com/document/d/${docId}/edit`,
        x: rect.left,
        y: rect.top,
        width: rect.width,
        height: rect.height,
        transparent: false,
      });

      webviewRef.current = wv;

      // Keep webview in sync when the content area resizes
      resizeObserver = new ResizeObserver(() => {
        cancelAnimationFrame(animFrame);
        animFrame = requestAnimationFrame(() => syncWebviewBounds());
      });
      resizeObserver.observe(el);

      // Also sync on window resize
      window.addEventListener("resize", syncWebviewBounds);
    }

    create();

    return () => {
      if (wv) {
        wv.close().catch(() => {});
        webviewRef.current = null;
      }
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener("resize", syncWebviewBounds);
      cancelAnimationFrame(animFrame);
    };
  }, [editing, docId, syncWebviewBounds]);

  const exitEdit = useCallback(() => {
    setEditing(false);
    queryClient.invalidateQueries({ queryKey: ["docs", "content", docId] });
    queryClient.invalidateQueries({ queryKey: ["drive", "file", docId] });
  }, [queryClient, docId]);

  // ⌘E to toggle edit mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "e") {
        e.preventDefault();
        setEditing((prev) => {
          if (prev) {
            queryClient.invalidateQueries({ queryKey: ["docs", "content", docId] });
            queryClient.invalidateQueries({ queryKey: ["drive", "file", docId] });
          }
          return !prev;
        });
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [queryClient, docId]);

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col">
        <Breadcrumbs path={path} isLoading={pathLoading} file={meta} />
        <div className="mx-auto w-full max-w-3xl px-6 py-10">
          <Skeleton className="mb-6 h-8 w-2/3" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
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
          <p className="text-red-400">Failed to load document: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Breadcrumbs path={path} isLoading={pathLoading} file={meta} />

      {/* Edit/View toggle bar */}
      <div className="flex items-center gap-2 border-b border-border px-6 py-1.5">
        <Tooltip label={editing ? "Back to view" : "Edit in Google Docs"} shortcut="⌘E">
          <button
            onClick={editing ? exitEdit : () => setEditing(true)}
            className={[
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              editing
                ? "bg-accent/15 text-accent"
                : "text-text-muted hover:bg-bg-tertiary hover:text-text-primary",
            ].join(" ")}
          >
            {editing ? (
              <>
                <Eye className="h-3.5 w-3.5" />
                Done
              </>
            ) : (
              <>
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </>
            )}
          </button>
        </Tooltip>
        {editing && (
          <span className="text-[11px] text-text-muted">
            Editing in Google Docs — changes save automatically
          </span>
        )}
      </div>

      {/* Content area — the webview overlays this div when editing */}
      <div ref={contentRef} className="flex-1 overflow-y-auto">
        {!editing && (
          <DocRenderer
            blocks={blocks}
            title={doc?.title ?? "Untitled"}
            lastModified={meta?.modifiedTime}
            docId={docId}
          />
        )}
      </div>
    </div>
  );
}

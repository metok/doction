import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Star, MoreHorizontal, ExternalLink, Link2, Info } from "lucide-react";
import type { DriveFile } from "@/lib/google/types";

interface BreadcrumbsProps {
  path?: DriveFile[];
  isLoading?: boolean;
  file?: DriveFile;
}

function formatFileSize(bytes: string | undefined): string {
  if (!bytes) return "Unknown";
  const n = parseInt(bytes, 10);
  if (isNaN(n)) return "Unknown";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "Unknown";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Breadcrumbs({ path, isLoading, file }: BreadcrumbsProps) {
  const [starred, setStarred] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [copyToast, setCopyToast] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);

  // Close dropdown / popover on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (infoRef.current && !infoRef.current.contains(e.target as Node)) {
        setInfoOpen(false);
      }
    }
    if (menuOpen || infoOpen) {
      document.addEventListener("mousedown", handler);
    }
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen, infoOpen]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-1 px-6 py-3">
        <div className="h-4 w-16 animate-pulse rounded bg-bg-tertiary" />
        <ChevronRight className="h-3.5 w-3.5 text-text-muted" />
        <div className="h-4 w-24 animate-pulse rounded bg-bg-tertiary" />
        <ChevronRight className="h-3.5 w-3.5 text-text-muted" />
        <div className="h-4 w-20 animate-pulse rounded bg-bg-tertiary" />
      </div>
    );
  }

  const segments = path ?? [];

  function handleOpenInDrive() {
    if (file?.webViewLink) {
      window.open(file.webViewLink, "_blank", "noopener,noreferrer");
    }
    setMenuOpen(false);
  }

  function handleCopyLink() {
    if (file?.webViewLink) {
      navigator.clipboard.writeText(file.webViewLink).then(() => {
        setCopyToast(true);
        setTimeout(() => setCopyToast(false), 2000);
      });
    }
    setMenuOpen(false);
  }

  function handleFileInfo() {
    setMenuOpen(false);
    setInfoOpen((prev) => !prev);
  }

  return (
    <div className="relative flex items-center justify-between border-b border-border px-6 py-2.5">
      <nav className="flex items-center gap-1 text-sm">
        {/* Always show My Drive as the root */}
        {segments.length === 0 ? (
          <span className="font-medium text-text-primary">My Drive</span>
        ) : (
          <Link
            to="/"
            className="text-text-secondary transition-colors hover:text-text-primary"
          >
            My Drive
          </Link>
        )}

        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          return (
            <span key={segment.id} className="flex items-center gap-1">
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-text-muted" />
              {isLast ? (
                <span className="font-medium text-text-primary">
                  {segment.name}
                </span>
              ) : (
                <Link
                  to="/folder/$folderId"
                  params={{ folderId: segment.id }}
                  className="text-text-secondary transition-colors hover:text-text-primary"
                >
                  {segment.name}
                </Link>
              )}
            </span>
          );
        })}
      </nav>

      <div className="flex items-center gap-1">
        {/* Star toggle */}
        <div className="relative">
          <button
            title={starred ? "Remove from starred" : "Add to starred"}
            onClick={() => setStarred((s) => !s)}
            className="rounded p-1.5 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            aria-label={starred ? "Remove from starred" : "Add to starred"}
          >
            <Star
              className={`h-4 w-4 transition-colors ${
                starred
                  ? "fill-amber-400 text-amber-400"
                  : ""
              }`}
            />
          </button>
        </div>

        {/* More options menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded p-1.5 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            aria-label="More options"
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-md border border-border bg-bg-secondary shadow-lg">
              <button
                onClick={handleOpenInDrive}
                disabled={!file?.webViewLink}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                Open in Google Drive
              </button>
              <button
                onClick={handleCopyLink}
                disabled={!file?.webViewLink}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Link2 className="h-3.5 w-3.5 shrink-0" />
                Copy link
              </button>
              <button
                onClick={handleFileInfo}
                disabled={!file}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Info className="h-3.5 w-3.5 shrink-0" />
                File info
              </button>
            </div>
          )}
        </div>

        {/* File info popover */}
        {infoOpen && file && (
          <div
            ref={infoRef}
            className="absolute right-4 top-full z-50 mt-1 w-64 rounded-md border border-border bg-bg-secondary p-3 shadow-lg"
          >
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              File info
            </p>
            <dl className="space-y-1.5 text-sm">
              <div>
                <dt className="text-xs text-text-muted">Name</dt>
                <dd className="truncate font-medium text-text-primary">{file.name}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">Type</dt>
                <dd className="truncate text-text-secondary">{file.mimeType}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">Size</dt>
                <dd className="text-text-secondary">{formatFileSize(file.size)}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-muted">Last modified</dt>
                <dd className="text-text-secondary">{formatDate(file.modifiedTime)}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      {/* Copy link toast */}
      {copyToast && (
        <div className="pointer-events-none absolute right-4 top-full z-50 mt-2 rounded-md bg-bg-tertiary px-3 py-1.5 text-xs text-text-primary shadow-md">
          Link copied!
        </div>
      )}
    </div>
  );
}

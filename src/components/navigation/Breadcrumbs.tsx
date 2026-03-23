import { Link } from "@tanstack/react-router";
import { ChevronRight, Star, MoreHorizontal } from "lucide-react";
import type { DriveFile } from "@/lib/google/types";

interface BreadcrumbsProps {
  path?: DriveFile[];
  isLoading?: boolean;
}

export function Breadcrumbs({ path, isLoading }: BreadcrumbsProps) {
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

  return (
    <div className="flex items-center justify-between border-b border-border px-6 py-2.5">
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
        <button
          className="rounded p-1.5 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          aria-label="Star"
        >
          <Star className="h-4 w-4" />
        </button>
        <button
          className="rounded p-1.5 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          aria-label="More options"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

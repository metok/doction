import { Skeleton } from "@/components/ui/Skeleton";
import { usePreferencesStore } from "@/lib/stores/preferences";

export function FolderSkeleton() {
  const viewMode = usePreferencesStore((s) => s.viewMode);

  if (viewMode === "list") {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
            <Skeleton className="h-5 w-5 shrink-0 rounded" />
            <Skeleton className="h-4 flex-1" style={{ maxWidth: `${60 + (i % 3) * 15}%` }} />
            <Skeleton className="h-3 w-20 shrink-0" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2 rounded-lg border border-border p-3">
          <Skeleton className="h-24 w-full rounded" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

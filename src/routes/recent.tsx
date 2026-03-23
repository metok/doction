import { createFileRoute } from "@tanstack/react-router";
import { useRecentStore } from "@/lib/stores/recent";
import { FolderView } from "@/components/content/FolderView";

function RecentPage() {
  const { files } = useRecentStore();

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-primary">Recent</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Recently opened files
        </p>
      </div>

      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-text-muted">No recent files yet</p>
          <p className="mt-1 text-xs text-text-muted">
            Files you open will appear here
          </p>
        </div>
      ) : (
        <FolderView files={files} />
      )}
    </div>
  );
}

export const Route = createFileRoute("/recent")({
  component: RecentPage,
});

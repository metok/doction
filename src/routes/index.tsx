import { createFileRoute, useRouter } from "@tanstack/react-router";
import {
  Loader2,
  Folder,
  FileText,
  Sheet,
  Image,
  File,
  FileArchive,
  Presentation,
  HardDrive,
  ChevronRight,
  Clock,
  Star,
} from "lucide-react";
import {
  useDriveFiles,
  useSharedDrives,
  useRecentlyModified,
} from "@/lib/hooks/use-drive-files";
import { useUserInfo } from "@/lib/hooks/use-auth";
import { useRecentStore } from "@/lib/stores/recent";
import { useFavoritesStore } from "@/lib/stores/favorites";
import {
  isFolder,
  isDocument,
  isSpreadsheet,
  isImage,
  isPdf,
} from "@/lib/google/types";
import type { DriveFile, SharedDrive } from "@/lib/google/types";

// ── Helpers ────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

// ── File type config ───────────────────────────────────────────────────────

function getFileTypeConfig(mimeType: string): {
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
  label: string;
} {
  if (isFolder(mimeType))
    return {
      icon: <Folder className="h-5 w-5" />,
      bgColor: "bg-purple-500/10",
      iconColor: "text-purple-400",
      label: "Folder",
    };
  if (isDocument(mimeType))
    return {
      icon: <FileText className="h-5 w-5" />,
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-400",
      label: "Document",
    };
  if (isSpreadsheet(mimeType))
    return {
      icon: <Sheet className="h-5 w-5" />,
      bgColor: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      label: "Spreadsheet",
    };
  if (mimeType.includes("presentation"))
    return {
      icon: <Presentation className="h-5 w-5" />,
      bgColor: "bg-amber-500/10",
      iconColor: "text-amber-400",
      label: "Slides",
    };
  if (isImage(mimeType))
    return {
      icon: <Image className="h-5 w-5" />,
      bgColor: "bg-pink-500/10",
      iconColor: "text-pink-400",
      label: "Image",
    };
  if (isPdf(mimeType))
    return {
      icon: <File className="h-5 w-5" />,
      bgColor: "bg-red-500/10",
      iconColor: "text-red-400",
      label: "PDF",
    };
  if (
    mimeType.includes("zip") ||
    mimeType.includes("archive") ||
    mimeType.includes("compressed")
  )
    return {
      icon: <FileArchive className="h-5 w-5" />,
      bgColor: "bg-orange-500/10",
      iconColor: "text-orange-400",
      label: "Archive",
    };
  return {
    icon: <File className="h-5 w-5" />,
    bgColor: "bg-gray-500/10",
    iconColor: "text-gray-400",
    label: "File",
  };
}

// ── Navigation helper ──────────────────────────────────────────────────────

function useNavigateToFile() {
  const router = useRouter();
  const { addFile } = useRecentStore();

  return (file: DriveFile) => {
    addFile(file);
    if (isFolder(file.mimeType)) {
      router.navigate({ to: "/folder/$folderId", params: { folderId: file.id } });
    } else if (isDocument(file.mimeType)) {
      router.navigate({ to: "/doc/$docId", params: { docId: file.id } });
    } else if (isSpreadsheet(file.mimeType)) {
      router.navigate({ to: "/sheet/$sheetId", params: { sheetId: file.id } });
    } else if (isImage(file.mimeType) || isPdf(file.mimeType)) {
      router.navigate({ to: "/file/$fileId", params: { fileId: file.id } });
    }
  };
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="text-text-muted">{icon}</span>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
        {title}
      </h2>
      <div className="flex-1 border-t border-border/40" />
      {action}
    </div>
  );
}

/** Compact ~160px card used in horizontal scroll rows */
function FileCard({
  file,
  onClick,
}: {
  file: DriveFile;
  onClick: () => void;
}) {
  const config = getFileTypeConfig(file.mimeType);
  return (
    <button
      onClick={onClick}
      className="group flex w-44 shrink-0 cursor-pointer items-center gap-3 rounded-xl border border-border/60 bg-bg-secondary px-3 py-3 text-left transition-all duration-200 hover:border-border hover:bg-bg-tertiary/50 hover:shadow-lg hover:shadow-black/10"
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${config.bgColor}`}>
        <span className={config.iconColor}>{config.icon}</span>
      </div>
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="truncate text-xs font-medium text-text-primary">{file.name}</p>
        {file.modifiedTime && (
          <p className="text-[10px] text-text-muted">{timeAgo(file.modifiedTime)}</p>
        )}
      </div>
    </button>
  );
}

/** Horizontal scrollable row of file cards */
function HorizontalCardRow({
  files,
  onFileClick,
}: {
  files: DriveFile[];
  onFileClick: (file: DriveFile) => void;
}) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-3" style={{ minWidth: "max-content" }}>
        {files.map((file) => (
          <FileCard key={file.id} file={file} onClick={() => onFileClick(file)} />
        ))}
      </div>
    </div>
  );
}

/** Single row in the "Recently Modified" list */
function RecentlyModifiedRow({
  file,
  onClick,
}: {
  file: DriveFile;
  onClick: () => void;
}) {
  const config = getFileTypeConfig(file.mimeType);
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-bg-tertiary/50"
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.bgColor}`}
      >
        <span className={config.iconColor}>{config.icon}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-sm font-medium text-text-primary">{file.name}</p>
        <p className="text-[11px] text-text-muted">{config.label}</p>
      </div>
      <span className="shrink-0 text-[11px] text-text-muted">{timeAgo(file.modifiedTime)}</span>
    </button>
  );
}

/** Shared drive card in the quick access grid */
function SharedDriveCard({
  drive,
  onClick,
}: {
  drive: SharedDrive;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-2.5 rounded-xl border border-border/60 bg-bg-secondary px-4 py-4 text-center transition-all duration-200 hover:border-border hover:bg-bg-tertiary/50 hover:shadow-lg hover:shadow-black/10 hover:-translate-y-0.5"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 transition-transform duration-200 group-hover:scale-110">
        <HardDrive className="h-5 w-5 text-indigo-400" />
      </div>
      <p className="w-full truncate text-xs font-medium text-text-primary">{drive.name}</p>
    </button>
  );
}

// ── Main dashboard ─────────────────────────────────────────────────────────

function HomePage() {
  const { data: userInfo } = useUserInfo();
  const navigateTo = useNavigateToFile();
  const router = useRouter();

  const recentFiles = useRecentStore((s) => s.files).slice(0, 8);
  const favoriteFiles = useFavoritesStore((s) => s.files);

  const { data: rootData, isLoading: rootLoading } = useDriveFiles("root");
  const { data: sharedDrivesData, isLoading: drivesLoading } = useSharedDrives();
  const { data: recentlyModifiedData, isLoading: modifiedLoading } = useRecentlyModified();

  const rootFiles = (rootData?.files ?? []).slice(0, 8);
  const sharedDrives = sharedDrivesData?.drives ?? [];
  const modifiedFiles = recentlyModifiedData?.files ?? [];

  const firstName = userInfo?.name?.split(" ")[0] ?? "";

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      {/* Header / Greeting */}
      <div className="px-8 pb-6 pt-10">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          {getGreeting()}{firstName ? `, ${firstName}` : ""}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Quick access to your workspace
        </p>
      </div>

      <div className="flex flex-col gap-8 px-8 pb-12">

        {/* ── Recently Opened ── */}
        {recentFiles.length > 0 && (
          <section>
            <SectionHeader
              icon={<Clock className="h-3.5 w-3.5" />}
              title="Recently Opened"
            />
            <HorizontalCardRow files={recentFiles} onFileClick={navigateTo} />
          </section>
        )}

        {/* ── Favorites ── */}
        {favoriteFiles.length > 0 && (
          <section>
            <SectionHeader
              icon={<Star className="h-3.5 w-3.5" />}
              title="Favorites"
            />
            <HorizontalCardRow files={favoriteFiles} onFileClick={navigateTo} />
          </section>
        )}

        {/* ── Recently Modified ── */}
        <section>
          <SectionHeader
            icon={<Clock className="h-3.5 w-3.5" />}
            title="Recently Modified"
          />
          {modifiedLoading && (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
            </div>
          )}
          {!modifiedLoading && modifiedFiles.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-border/60">
              {modifiedFiles.map((file, idx) => (
                <div
                  key={file.id}
                  className={
                    idx < modifiedFiles.length - 1
                      ? "border-b border-border/30"
                      : undefined
                  }
                >
                  <RecentlyModifiedRow
                    file={file}
                    onClick={() => navigateTo(file)}
                  />
                </div>
              ))}
            </div>
          )}
          {!modifiedLoading && modifiedFiles.length === 0 && (
            <p className="text-sm text-text-muted">No recently modified files.</p>
          )}
        </section>

        {/* ── Shared Drives ── */}
        {(sharedDrives.length > 0 || drivesLoading) && (
          <section>
            <SectionHeader
              icon={<HardDrive className="h-3.5 w-3.5" />}
              title="Shared Drives"
            />
            {drivesLoading && (
              <div className="flex h-16 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
              </div>
            )}
            {!drivesLoading && (
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}
              >
                {sharedDrives.map((drive) => (
                  <SharedDriveCard
                    key={drive.id}
                    drive={drive}
                    onClick={() =>
                      router.navigate({
                        to: "/folder/$folderId",
                        params: { folderId: drive.id },
                      })
                    }
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── My Drive (first 8 items) ── */}
        <section>
          <SectionHeader
            icon={<HardDrive className="h-3.5 w-3.5" />}
            title="My Drive"
            action={
              <button
                onClick={() =>
                  router.navigate({
                    to: "/folder/$folderId",
                    params: { folderId: "root" },
                  })
                }
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-secondary"
              >
                View all
                <ChevronRight className="h-3 w-3" />
              </button>
            }
          />
          {rootLoading && (
            <div className="flex h-24 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-text-muted" />
            </div>
          )}
          {!rootLoading && rootFiles.length > 0 && (
            <HorizontalCardRow files={rootFiles} onFileClick={navigateTo} />
          )}
          {!rootLoading && rootFiles.length === 0 && (
            <p className="text-sm text-text-muted">No files in My Drive.</p>
          )}
        </section>

      </div>
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: HomePage,
});

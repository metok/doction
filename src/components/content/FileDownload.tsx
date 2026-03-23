import { Download, ExternalLink, Folder, FileText, Sheet, Image, File, FileArchive, Presentation } from "lucide-react";
import {
  isFolder,
  isDocument,
  isSpreadsheet,
  isImage,
  isPdf,
} from "@/lib/google/types";
import type { DriveFile } from "@/lib/google/types";

function getFileTypeConfig(mimeType: string): {
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
  accentColor: string;
  label: string;
} {
  if (isFolder(mimeType))
    return {
      icon: <Folder className="h-10 w-10" />,
      bgColor: "bg-purple-500/10",
      iconColor: "text-purple-400",
      accentColor: "bg-purple-500 hover:bg-purple-600",
      label: "Folder",
    };
  if (isDocument(mimeType))
    return {
      icon: <FileText className="h-10 w-10" />,
      bgColor: "bg-blue-500/10",
      iconColor: "text-blue-400",
      accentColor: "bg-blue-500 hover:bg-blue-600",
      label: "Document",
    };
  if (isSpreadsheet(mimeType))
    return {
      icon: <Sheet className="h-10 w-10" />,
      bgColor: "bg-emerald-500/10",
      iconColor: "text-emerald-400",
      accentColor: "bg-emerald-500 hover:bg-emerald-600",
      label: "Spreadsheet",
    };
  if (mimeType.includes("presentation"))
    return {
      icon: <Presentation className="h-10 w-10" />,
      bgColor: "bg-amber-500/10",
      iconColor: "text-amber-400",
      accentColor: "bg-amber-500 hover:bg-amber-600",
      label: "Slides",
    };
  if (isImage(mimeType))
    return {
      icon: <Image className="h-10 w-10" />,
      bgColor: "bg-pink-500/10",
      iconColor: "text-pink-400",
      accentColor: "bg-pink-500 hover:bg-pink-600",
      label: "Image",
    };
  if (isPdf(mimeType))
    return {
      icon: <File className="h-10 w-10" />,
      bgColor: "bg-red-500/10",
      iconColor: "text-red-400",
      accentColor: "bg-red-500 hover:bg-red-600",
      label: "PDF",
    };
  if (
    mimeType.includes("zip") ||
    mimeType.includes("archive") ||
    mimeType.includes("compressed")
  )
    return {
      icon: <FileArchive className="h-10 w-10" />,
      bgColor: "bg-orange-500/10",
      iconColor: "text-orange-400",
      accentColor: "bg-orange-500 hover:bg-orange-600",
      label: "Archive",
    };
  return {
    icon: <File className="h-10 w-10" />,
    bgColor: "bg-gray-500/10",
    iconColor: "text-gray-400",
    accentColor: "bg-gray-500 hover:bg-gray-600",
    label: "File",
  };
}

function formatFileSize(bytes: string | undefined): string {
  if (!bytes) return "Unknown size";
  const n = parseInt(bytes, 10);
  if (isNaN(n)) return "Unknown size";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "Unknown";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface FileDownloadProps {
  file: DriveFile;
  downloadUrl: string;
}

export function FileDownload({ file, downloadUrl }: FileDownloadProps) {
  const config = getFileTypeConfig(file.mimeType);

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm rounded-xl border border-border bg-bg-secondary p-8 shadow-lg">
        {/* File icon */}
        <div className="mb-6 flex justify-center">
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-2xl ${config.bgColor}`}
          >
            <span className={config.iconColor}>{config.icon}</span>
          </div>
        </div>

        {/* File name */}
        <h2 className="mb-1 text-center text-lg font-semibold leading-snug text-text-primary">
          {file.name}
        </h2>

        {/* File type badge */}
        <p className="mb-6 text-center text-sm text-text-muted">
          {config.label}
        </p>

        {/* Metadata */}
        <dl className="mb-6 space-y-2 rounded-lg border border-border bg-bg-tertiary p-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-text-muted">Type</dt>
            <dd className="truncate text-right text-text-secondary">
              {file.mimeType}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-text-muted">Size</dt>
            <dd className="text-text-secondary">{formatFileSize(file.size)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-text-muted">Modified</dt>
            <dd className="text-right text-text-secondary">
              {formatDate(file.modifiedTime)}
            </dd>
          </div>
        </dl>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          <a
            href={downloadUrl}
            download={file.name}
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors ${config.accentColor}`}
          >
            <Download className="h-4 w-4" />
            Download
          </a>
          {file.webViewLink && (
            <a
              href={file.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-border bg-bg-tertiary px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-primary hover:text-text-primary"
            >
              <ExternalLink className="h-4 w-4" />
              Open in Google Drive
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

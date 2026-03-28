import { useState } from "react";
import { ZoomIn, ZoomOut, RotateCw } from "lucide-react";

interface ImagePreviewProps {
  src: string;
  alt?: string;
}

const ZOOM_STEP = 0.25;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

export function ImagePreview({ src, alt = "Image preview" }: ImagePreviewProps) {
  const [zoom, setZoom] = useState(1);

  function zoomIn() {
    setZoom((z) => Math.min(z + ZOOM_STEP, MAX_ZOOM));
  }

  function zoomOut() {
    setZoom((z) => Math.max(z - ZOOM_STEP, MIN_ZOOM));
  }

  function reset() {
    setZoom(1);
  }

  const percentage = Math.round(zoom * 100);

  return (
    <div className="flex flex-1 flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-center gap-2 border-b border-border px-4 py-2">
        <button
          onClick={zoomOut}
          disabled={zoom <= MIN_ZOOM}
          className="rounded p-1.5 text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>

        <span className="min-w-[4ch] text-center text-sm font-medium tabular-nums text-text-primary">
          {percentage}%
        </span>

        <button
          onClick={zoomIn}
          disabled={zoom >= MAX_ZOOM}
          className="rounded p-1.5 text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>

        <div className="mx-2 h-4 w-px bg-border" />

        <button
          onClick={reset}
          className="rounded p-1.5 text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
          aria-label="Reset zoom"
        >
          <RotateCw className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable image container */}
      <div className="relative flex-1 overflow-auto">
        <div className="inline-flex min-h-full min-w-full items-center justify-center p-8">
          <img
            src={src}
            alt={alt}
            className="block"
            style={{
              width: `${zoom * 100}%`,
              maxWidth: "none",
              transition: "width 0.15s ease",
            }}
          />
        </div>
      </div>
    </div>
  );
}

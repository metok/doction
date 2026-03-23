interface PdfPreviewProps {
  src: string;
}

export function PdfPreview({ src }: PdfPreviewProps) {
  return (
    <div className="flex flex-1 flex-col px-4 py-4">
      <iframe
        src={src}
        title="PDF Preview"
        className="w-full rounded border border-border"
        style={{ height: "calc(100vh - 120px)" }}
      />
    </div>
  );
}

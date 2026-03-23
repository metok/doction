import { useState } from "react";
import type { Spreadsheet, Sheet } from "@/lib/google/types";

interface SheetRendererProps {
  spreadsheet: Spreadsheet;
}

function getCellValue(
  sheet: Sheet,
  rowIndex: number,
  colIndex: number,
): string {
  const rowData = sheet.data?.[0]?.rowData?.[rowIndex];
  const cell = rowData?.values?.[colIndex];
  return cell?.formattedValue ?? cell?.userEnteredValue?.stringValue ?? "";
}

function SheetTable({ sheet }: { sheet: Sheet }) {
  const rows = sheet.data?.[0]?.rowData ?? [];

  if (rows.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center py-20 text-text-muted">
        This sheet is empty
      </div>
    );
  }

  // Determine max column count
  const colCount = rows.reduce((max, row) => {
    return Math.max(max, row.values?.length ?? 0);
  }, 0);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse border border-border text-sm">
        <thead>
          <tr className="bg-bg-tertiary">
            {Array.from({ length: colCount }).map((_, ci) => (
              <th
                key={ci}
                className="border border-border px-3 py-2 text-left font-semibold text-text-primary"
              >
                {getCellValue(sheet, 0, ci)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(1).map((_, ri) => (
            <tr
              key={ri}
              className={ri % 2 === 0 ? "bg-bg-primary" : "bg-bg-secondary"}
            >
              {Array.from({ length: colCount }).map((_, ci) => (
                <td
                  key={ci}
                  className="border border-border px-3 py-2 text-text-secondary"
                >
                  {getCellValue(sheet, ri + 1, ci)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SheetRenderer({ spreadsheet }: SheetRendererProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const sheets = spreadsheet.sheets ?? [];
  const activeSheet = sheets[activeIndex];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col px-8 py-10">
      <h1 className="mb-6 font-serif text-[32px] font-bold leading-tight text-text-primary">
        {spreadsheet.properties?.title ?? "Untitled Spreadsheet"}
      </h1>

      {/* Tab bar */}
      {sheets.length > 1 && (
        <div className="mb-4 flex gap-1 border-b border-border">
          {sheets.map((sheet, idx) => (
            <button
              key={sheet.properties?.sheetId ?? idx}
              onClick={() => setActiveIndex(idx)}
              className={`rounded-t px-4 py-2 text-sm transition-colors ${
                idx === activeIndex
                  ? "border-b-2 border-accent bg-bg-tertiary font-medium text-text-primary"
                  : "text-text-muted hover:bg-bg-tertiary hover:text-text-secondary"
              }`}
            >
              {sheet.properties?.title ?? `Sheet ${idx + 1}`}
            </button>
          ))}
        </div>
      )}

      {activeSheet ? (
        <SheetTable sheet={activeSheet} />
      ) : (
        <div className="flex flex-1 items-center justify-center py-20 text-text-muted">
          No sheet selected
        </div>
      )}
    </div>
  );
}

import type {
  GoogleDoc,
  StructuralElement,
  ParagraphElement,
  TextStyle,
  TableCell,
} from "./google/types";

export interface DocSpan {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  link?: string;
}

export interface DocBlock {
  type: "paragraph" | "heading" | "list-item" | "table" | "hr" | "image";
  text?: string;
  level?: number; // heading level 1-6 or list nesting
  listId?: string;
  ordered?: boolean;
  spans?: DocSpan[];
  rows?: DocSpan[][][]; // table rows -> cells -> spans
  imageUrl?: string;
}

function parseTextStyle(style?: TextStyle): Partial<DocSpan> {
  if (!style) return {};
  return {
    bold: style.bold ?? undefined,
    italic: style.italic ?? undefined,
    underline: style.underline ?? undefined,
    strikethrough: style.strikethrough ?? undefined,
    link: style.link?.url ?? undefined,
  };
}

function parseElements(elements?: ParagraphElement[]): DocSpan[] {
  if (!elements) return [];
  const spans: DocSpan[] = [];

  for (const el of elements) {
    if (el.textRun) {
      const raw = el.textRun.content ?? "";
      // Strip trailing newline
      const text = raw.replace(/\n$/, "");
      if (!text) continue;
      const style = parseTextStyle(el.textRun.textStyle);
      spans.push({ text, ...style });
    }
  }

  return spans;
}

function parseCellSpans(cell: TableCell): DocSpan[] {
  const spans: DocSpan[] = [];
  for (const se of cell.content ?? []) {
    if (se.paragraph) {
      spans.push(...parseElements(se.paragraph.elements));
    }
  }
  return spans;
}

function parseStructuralElement(se: StructuralElement): DocBlock[] {
  if (se.paragraph) {
    const para = se.paragraph;
    const style = para.paragraphStyle?.namedStyleType ?? "NORMAL_TEXT";
    const elements = para.elements ?? [];

    // Check for horizontal rule
    const hasHr = elements.some((el) => el.horizontalRule !== undefined);
    if (hasHr) {
      return [{ type: "hr" }];
    }

    const spans = parseElements(elements);
    const text = spans.map((s) => s.text).join("");

    // Heading
    const headingMatch = style.match(/^HEADING_(\d)$/);
    if (headingMatch) {
      const level = parseInt(headingMatch[1], 10);
      return [{ type: "heading", level, text, spans }];
    }

    // List item
    if (para.bullet) {
      const listId = para.bullet.listId;
      const nestingLevel = para.bullet.nestingLevel ?? 0;
      return [
        {
          type: "list-item",
          text,
          spans,
          listId,
          level: nestingLevel,
        },
      ];
    }

    // Normal paragraph
    if (!text && spans.length === 0) return [];
    return [{ type: "paragraph", text, spans }];
  }

  if (se.table) {
    const rows: DocSpan[][][] = [];
    for (const row of se.table.tableRows ?? []) {
      const cells: DocSpan[][] = [];
      for (const cell of row.tableCells ?? []) {
        cells.push(parseCellSpans(cell));
      }
      rows.push(cells);
    }
    return [{ type: "table", rows }];
  }

  return [];
}

export function parseDocContent(doc: GoogleDoc): DocBlock[] {
  const content = doc.body?.content ?? [];
  const blocks: DocBlock[] = [];

  for (const se of content) {
    blocks.push(...parseStructuralElement(se));
  }

  return blocks;
}

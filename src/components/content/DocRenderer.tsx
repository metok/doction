import type { DocBlock, DocSpan } from "@/lib/doc-parser";

interface SpanRendererProps {
  span: DocSpan;
}

function SpanRenderer({ span }: SpanRendererProps) {
  let node: React.ReactNode = span.text;

  if (span.code) {
    node = (
      <code className="rounded-md bg-bg-tertiary px-1.5 py-0.5 font-mono text-[13px] text-accent">
        {node}
      </code>
    );
  }
  if (span.bold) {
    node = <strong className="font-semibold">{node}</strong>;
  }
  if (span.italic) {
    node = <em>{node}</em>;
  }
  if (span.underline) {
    node = <span className="underline">{node}</span>;
  }
  if (span.strikethrough) {
    node = <span className="line-through">{node}</span>;
  }
  if (span.link) {
    node = (
      <a
        href={span.link}
        target="_blank"
        rel="noopener noreferrer"
        className="text-accent no-underline transition-colors duration-150 hover:underline hover:text-accent-hover"
      >
        {node}
      </a>
    );
  }

  return <>{node}</>;
}

interface BlockRendererProps {
  block: DocBlock;
}

const HEADING_CLASSES: Record<number, string> = {
  1: "text-3xl font-bold mt-10 mb-4 text-text-primary border-l-2 border-accent pl-4",
  2: "text-2xl font-semibold mt-8 mb-3 text-text-primary border-l-2 border-accent pl-4",
  3: "text-xl font-semibold mt-6 mb-2 text-text-primary",
  4: "text-lg font-semibold mt-5 mb-2 text-text-primary",
  5: "text-base font-semibold mt-4 mb-1 text-text-primary",
  6: "text-sm font-semibold mt-3 mb-1 text-text-secondary",
};

function BlockRenderer({ block }: BlockRendererProps) {
  if (block.type === "heading") {
    const level = block.level ?? 1;
    const cls = HEADING_CLASSES[level] ?? HEADING_CLASSES[1];
    const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;
    return (
      <Tag className={cls}>
        {block.spans?.map((span, i) => <SpanRenderer key={i} span={span} />)}
      </Tag>
    );
  }

  if (block.type === "paragraph") {
    return (
      <p className="mb-4 text-[15px] leading-[1.8] text-text-primary/80">
        {block.spans?.map((span, i) => <SpanRenderer key={i} span={span} />)}
      </p>
    );
  }

  if (block.type === "hr") {
    return (
      <div className="my-10 flex items-center justify-center gap-2">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-border" />
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-border" />
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-border" />
      </div>
    );
  }

  if (block.type === "table") {
    return (
      <div className="my-6 overflow-x-auto">
        <div className="rounded-xl border border-border shadow-sm overflow-hidden">
          <table className="min-w-full border-collapse text-sm">
            <tbody>
              {block.rows?.map((row, ri) => (
                <tr
                  key={ri}
                  className={
                    ri === 0
                      ? "bg-accent/5"
                      : ri % 2 === 0
                        ? "bg-bg-primary"
                        : "bg-bg-secondary/60"
                  }
                >
                  {row.map((cell, ci) => {
                    const Tag = ri === 0 ? "th" : "td";
                    return (
                      <Tag
                        key={ci}
                        className={`px-4 py-3 text-left ${
                          ri === 0
                            ? "font-semibold text-accent/90 border-b border-border/50"
                            : "text-text-primary/80 border-b border-border/50 last-of-type:border-b-0"
                        }`}
                      >
                        {cell.map((span, si) => (
                          <SpanRenderer key={si} span={span} />
                        ))}
                      </Tag>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}

// Group for rendering list-item blocks by listId
interface ListGroup {
  type: "list";
  listId: string;
  ordered?: boolean;
  items: DocBlock[];
}

type GroupedBlock = DocBlock | ListGroup;

function groupBlocks(blocks: DocBlock[]): GroupedBlock[] {
  const result: GroupedBlock[] = [];
  let i = 0;
  while (i < blocks.length) {
    const block = blocks[i];
    if (block.type === "list-item") {
      const listId = block.listId ?? `list-${i}`;
      const group: ListGroup = {
        type: "list",
        listId,
        ordered: block.ordered,
        items: [],
      };
      while (i < blocks.length && blocks[i].type === "list-item" && blocks[i].listId === listId) {
        group.items.push(blocks[i]);
        i++;
      }
      result.push(group);
    } else {
      result.push(block);
      i++;
    }
  }
  return result;
}

interface DocRendererProps {
  title?: string;
  lastModified?: string;
  blocks: DocBlock[];
  docId?: string;
}

export function DocRenderer({ title, lastModified, blocks, docId }: DocRendererProps) {
  const grouped = groupBlocks(blocks);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 pb-20 sm:px-10">
      {(title || docId) && (
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {title && (
              <h1 className="mb-4 border-b border-border pb-4 font-serif text-[32px] font-bold leading-tight text-text-primary">
                {title}
              </h1>
            )}
            {lastModified && (
              <p className="text-xs text-text-muted">
                Last modified{" "}
                {new Date(lastModified).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </div>
          {docId && (
            <a
              href={`https://docs.google.com/document/d/${docId}/edit`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex shrink-0 items-center gap-1.5 rounded-lg border border-border bg-bg-secondary px-3 py-1.5 text-xs font-medium text-text-secondary no-underline transition-colors duration-150 hover:border-accent/40 hover:bg-accent/5 hover:text-accent"
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit in Google Docs
            </a>
          )}
        </div>
      )}
      {/* Render last-modified when there's no title/docId header row */}
      {!title && !docId && lastModified && (
        <p className="mb-8 text-xs text-text-muted">
          Last modified{" "}
          {new Date(lastModified).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      )}

      {grouped.map((item, idx) => {
        if ("type" in item && item.type === "list") {
          const group = item as ListGroup;
          const Tag = group.ordered ? "ol" : "ul";
          return (
            <Tag
              key={idx}
              className={`mb-4 pl-6 space-y-1.5 ${group.ordered ? "list-decimal" : "list-disc"} text-[15px] leading-[1.8] text-text-primary/80 marker:text-accent`}
            >
              {group.items.map((li, li_idx) => (
                <li
                  key={li_idx}
                  style={{ marginLeft: `${(li.level ?? 0) * 16}px` }}
                >
                  {li.spans?.map((span, si) => (
                    <SpanRenderer key={si} span={span} />
                  ))}
                </li>
              ))}
            </Tag>
          );
        }

        return <BlockRenderer key={idx} block={item as DocBlock} />;
      })}
    </div>
  );
}

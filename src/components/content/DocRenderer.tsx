import type { DocBlock, DocSpan } from "@/lib/doc-parser";

interface SpanRendererProps {
  span: DocSpan;
}

function SpanRenderer({ span }: SpanRendererProps) {
  let node: React.ReactNode = span.text;

  if (span.code) {
    node = (
      <code className="rounded bg-bg-tertiary px-1 py-0.5 font-mono text-sm text-accent">
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
        className="text-accent underline hover:text-accent-hover"
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
  1: "text-3xl font-bold mt-8 mb-3 text-text-primary",
  2: "text-2xl font-semibold mt-6 mb-2 text-text-primary",
  3: "text-xl font-semibold mt-5 mb-2 text-text-primary",
  4: "text-lg font-semibold mt-4 mb-1 text-text-primary",
  5: "text-base font-semibold mt-3 mb-1 text-text-primary",
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
      <p className="mb-3 leading-relaxed text-text-secondary">
        {block.spans?.map((span, i) => <SpanRenderer key={i} span={span} />)}
      </p>
    );
  }

  if (block.type === "hr") {
    return <hr className="my-6 border-border" />;
  }

  if (block.type === "table") {
    return (
      <div className="my-4 overflow-x-auto">
        <table className="min-w-full border-collapse border border-border text-sm">
          <tbody>
            {block.rows?.map((row, ri) => (
              <tr
                key={ri}
                className={ri === 0 ? "bg-bg-tertiary" : ri % 2 === 0 ? "bg-bg-primary" : "bg-bg-secondary"}
              >
                {row.map((cell, ci) => {
                  const Tag = ri === 0 ? "th" : "td";
                  return (
                    <Tag
                      key={ci}
                      className={`border border-border px-3 py-2 text-left text-text-secondary ${ri === 0 ? "font-semibold text-text-primary" : ""}`}
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
}

export function DocRenderer({ title, lastModified, blocks }: DocRendererProps) {
  const grouped = groupBlocks(blocks);

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      {title && (
        <h1 className="mb-2 font-serif text-[32px] font-bold leading-tight text-text-primary">
          {title}
        </h1>
      )}
      {lastModified && (
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
              className={`mb-3 pl-6 ${group.ordered ? "list-decimal" : "list-disc"} text-text-secondary`}
            >
              {group.items.map((li, li_idx) => (
                <li
                  key={li_idx}
                  className="mb-1 leading-relaxed"
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

import { describe, it, expect } from "vitest";
import { parseDocContent } from "../doc-parser";
import type { GoogleDoc } from "../google/types";

function makeDoc(content: GoogleDoc["body"]["content"]): GoogleDoc {
  return { body: { content } };
}

describe("parseDocContent", () => {
  it("parses a simple paragraph", () => {
    const doc = makeDoc([
      {
        paragraph: {
          paragraphStyle: { namedStyleType: "NORMAL_TEXT" },
          elements: [
            { textRun: { content: "Hello World\n" } },
          ],
        },
      },
    ]);

    const blocks = parseDocContent(doc);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("paragraph");
    expect(blocks[0].text).toBe("Hello World");
  });

  it("parses headings", () => {
    const doc = makeDoc([
      {
        paragraph: {
          paragraphStyle: { namedStyleType: "HEADING_1" },
          elements: [
            { textRun: { content: "My Title\n" } },
          ],
        },
      },
    ]);

    const blocks = parseDocContent(doc);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("heading");
    expect(blocks[0].level).toBe(1);
    expect(blocks[0].text).toBe("My Title");
  });

  it("parses bold and italic text", () => {
    const doc = makeDoc([
      {
        paragraph: {
          paragraphStyle: { namedStyleType: "NORMAL_TEXT" },
          elements: [
            {
              textRun: {
                content: "Bold and italic\n",
                textStyle: { bold: true, italic: true },
              },
            },
          ],
        },
      },
    ]);

    const blocks = parseDocContent(doc);
    expect(blocks).toHaveLength(1);
    const span = blocks[0].spans?.[0];
    expect(span?.bold).toBe(true);
    expect(span?.italic).toBe(true);
    expect(span?.text).toBe("Bold and italic");
  });

  it("parses a table", () => {
    const doc = makeDoc([
      {
        table: {
          rows: 2,
          columns: 2,
          tableRows: [
            {
              tableCells: [
                {
                  content: [
                    {
                      paragraph: {
                        elements: [{ textRun: { content: "A1" } }],
                      },
                    },
                  ],
                },
                {
                  content: [
                    {
                      paragraph: {
                        elements: [{ textRun: { content: "B1" } }],
                      },
                    },
                  ],
                },
              ],
            },
            {
              tableCells: [
                {
                  content: [
                    {
                      paragraph: {
                        elements: [{ textRun: { content: "A2" } }],
                      },
                    },
                  ],
                },
                {
                  content: [
                    {
                      paragraph: {
                        elements: [{ textRun: { content: "B2" } }],
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    ]);

    const blocks = parseDocContent(doc);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("table");
    const rows = blocks[0].rows!;
    expect(rows).toHaveLength(2);
    expect(rows[0][0][0].text).toBe("A1");
    expect(rows[0][1][0].text).toBe("B1");
    expect(rows[1][0][0].text).toBe("A2");
    expect(rows[1][1][0].text).toBe("B2");
  });

  it("parses links", () => {
    const doc = makeDoc([
      {
        paragraph: {
          paragraphStyle: { namedStyleType: "NORMAL_TEXT" },
          elements: [
            {
              textRun: {
                content: "Click here\n",
                textStyle: { link: { url: "https://example.com" } },
              },
            },
          ],
        },
      },
    ]);

    const blocks = parseDocContent(doc);
    expect(blocks).toHaveLength(1);
    const span = blocks[0].spans?.[0];
    expect(span?.link).toBe("https://example.com");
    expect(span?.text).toBe("Click here");
  });
});

// Google Drive types
export interface SharedDrive {
  id: string;
  name: string;
  colorRgb?: string;
  backgroundImageLink?: string;
}

export interface SharedDriveList {
  drives: SharedDrive[];
  nextPageToken?: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
  iconLink?: string;
  thumbnailLink?: string;
  webViewLink?: string;
  starred?: boolean;
  trashed?: boolean;
}

export interface DriveFileList {
  files: DriveFile[];
  nextPageToken?: string;
  kind?: string;
}

// Google Docs types
export interface RgbColor {
  red?: number;
  green?: number;
  blue?: number;
}

export interface TextStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontSize?: { magnitude?: number; unit?: string };
  foregroundColor?: { color?: { rgbColor?: RgbColor } };
  backgroundColor?: { color?: { rgbColor?: RgbColor } };
  link?: { url?: string };
  weightedFontFamily?: { fontFamily?: string };
}

export interface ParagraphStyle {
  namedStyleType?: string;
  alignment?: string;
  lineSpacing?: number;
  direction?: string;
  spacingMode?: string;
  spaceAbove?: { magnitude?: number; unit?: string };
  spaceBelow?: { magnitude?: number; unit?: string };
  indentFirstLine?: { magnitude?: number; unit?: string };
  indentStart?: { magnitude?: number; unit?: string };
  indentEnd?: { magnitude?: number; unit?: string };
  headingId?: string;
}

export interface Bullet {
  listId?: string;
  nestingLevel?: number;
  textStyle?: TextStyle;
}

export interface TextRun {
  content?: string;
  textStyle?: TextStyle;
}

export interface InlineObjectElement {
  inlineObjectId?: string;
  textStyle?: TextStyle;
}

export interface ParagraphElement {
  startIndex?: number;
  endIndex?: number;
  textRun?: TextRun;
  inlineObjectElement?: InlineObjectElement;
  autoText?: { type?: string; textStyle?: TextStyle };
  pageBreak?: { textStyle?: TextStyle };
  columnBreak?: { textStyle?: TextStyle };
  footnoteReference?: { footnoteId?: string; footnoteNumber?: string; textStyle?: TextStyle };
  horizontalRule?: { textStyle?: TextStyle };
}

export interface Paragraph {
  elements?: ParagraphElement[];
  paragraphStyle?: ParagraphStyle;
  bullet?: Bullet;
  positionedObjectIds?: string[];
}

export interface TableCell {
  startIndex?: number;
  endIndex?: number;
  content?: StructuralElement[];
  tableCellStyle?: Record<string, unknown>;
}

export interface TableRow {
  startIndex?: number;
  endIndex?: number;
  tableCells?: TableCell[];
  tableRowStyle?: Record<string, unknown>;
}

export interface DocTable {
  rows?: number;
  columns?: number;
  tableRows?: TableRow[];
  tableStyle?: Record<string, unknown>;
}

export interface StructuralElement {
  startIndex?: number;
  endIndex?: number;
  paragraph?: Paragraph;
  table?: DocTable;
  tableOfContents?: { content?: StructuralElement[] };
  sectionBreak?: { sectionStyle?: Record<string, unknown> };
}

export interface DocBody {
  content?: StructuralElement[];
}

export interface GoogleDoc {
  documentId?: string;
  title?: string;
  body?: DocBody;
  headers?: Record<string, unknown>;
  footers?: Record<string, unknown>;
  footnotes?: Record<string, unknown>;
  documentStyle?: Record<string, unknown>;
  namedStyles?: Record<string, unknown>;
  lists?: Record<string, unknown>;
  inlineObjects?: Record<string, unknown>;
  positionedObjects?: Record<string, unknown>;
  revisionId?: string;
}

// Google Sheets types
export interface CellFormat {
  numberFormat?: { type?: string; pattern?: string };
  backgroundColor?: RgbColor;
  borders?: Record<string, unknown>;
  padding?: Record<string, unknown>;
  horizontalAlignment?: string;
  verticalAlignment?: string;
  wrapStrategy?: string;
  textFormat?: {
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
    fontFamily?: string;
    fontSize?: number;
    foregroundColor?: RgbColor;
  };
}

export interface CellData {
  userEnteredValue?: {
    stringValue?: string;
    numberValue?: number;
    boolValue?: boolean;
    formulaValue?: string;
  };
  effectiveValue?: {
    stringValue?: string;
    numberValue?: number;
    boolValue?: boolean;
    errorValue?: unknown;
  };
  formattedValue?: string;
  userEnteredFormat?: CellFormat;
  effectiveFormat?: CellFormat;
  hyperlink?: string;
  note?: string;
}

export interface RowData {
  values?: CellData[];
}

export interface GridData {
  startRow?: number;
  startColumn?: number;
  rowData?: RowData[];
  rowMetadata?: Array<{ pixelSize?: number; hiddenByUser?: boolean }>;
  columnMetadata?: Array<{ pixelSize?: number; hiddenByUser?: boolean }>;
}

export interface SheetProperties {
  sheetId?: number;
  title?: string;
  index?: number;
  sheetType?: string;
  gridProperties?: {
    rowCount?: number;
    columnCount?: number;
    frozenRowCount?: number;
    frozenColumnCount?: number;
  };
  hidden?: boolean;
  tabColor?: RgbColor;
}

export interface Sheet {
  properties?: SheetProperties;
  data?: GridData[];
  merges?: Array<{
    startRowIndex?: number;
    endRowIndex?: number;
    startColumnIndex?: number;
    endColumnIndex?: number;
  }>;
  conditionalFormats?: unknown[];
  filterViews?: unknown[];
  protectedRanges?: unknown[];
  basicFilter?: unknown;
  charts?: unknown[];
  bandedRanges?: unknown[];
  developerMetadata?: unknown[];
  rowGroups?: unknown[];
  columnGroups?: unknown[];
  slicers?: unknown[];
}

export interface SpreadsheetProperties {
  title?: string;
  locale?: string;
  autoRecalc?: string;
  timeZone?: string;
  defaultFormat?: CellFormat;
  iterativeCalculationSettings?: unknown;
  spreadsheetTheme?: unknown;
}

export interface Spreadsheet {
  spreadsheetId?: string;
  properties?: SpreadsheetProperties;
  sheets?: Sheet[];
  namedRanges?: unknown[];
  spreadsheetUrl?: string;
  developerMetadata?: unknown[];
  dataSources?: unknown[];
  dataSourceSchedules?: unknown[];
}

// MIME type constants
export const MIME_TYPES = {
  FOLDER: "application/vnd.google-apps.folder",
  DOCUMENT: "application/vnd.google-apps.document",
  SPREADSHEET: "application/vnd.google-apps.spreadsheet",
  PRESENTATION: "application/vnd.google-apps.presentation",
  DRAWING: "application/vnd.google-apps.drawing",
  FORM: "application/vnd.google-apps.form",
  SCRIPT: "application/vnd.google-apps.script",
  SHORTCUT: "application/vnd.google-apps.shortcut",
  PDF: "application/pdf",
  PNG: "image/png",
  JPEG: "image/jpeg",
  GIF: "image/gif",
  WEBP: "image/webp",
  SVG: "image/svg+xml",
  BMP: "image/bmp",
  TIFF: "image/tiff",
} as const;

export type MimeType = (typeof MIME_TYPES)[keyof typeof MIME_TYPES];

// MIME type helper functions
export function isFolder(mimeType: string): boolean {
  return mimeType === MIME_TYPES.FOLDER;
}

export function isDocument(mimeType: string): boolean {
  return mimeType === MIME_TYPES.DOCUMENT;
}

export function isSpreadsheet(mimeType: string): boolean {
  return mimeType === MIME_TYPES.SPREADSHEET;
}

export function isImage(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

export function isPdf(mimeType: string): boolean {
  return mimeType === MIME_TYPES.PDF;
}

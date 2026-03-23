# Doction Design Guide

## Design Philosophy

**Futuristic, minimal, content-first.** Think Linear meets Notion meets a sci-fi terminal. Every pixel should feel intentional. Dark by default. Light as an option, not an afterthought.

## Color System

### Dark Theme (Default)
| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | `#191919` | Main background, content area |
| `bg-secondary` | `#1e1e1e` | Sidebar, cards, elevated surfaces |
| `bg-tertiary` | `#252525` | Hover states, active items, inputs |
| `border` | `#2a2a2a` | Borders, separators, dividers |
| `text-primary` | `#f0f0f0` | Headlines, active text, file names |
| `text-secondary` | `#aaaaaa` | Body text, descriptions |
| `text-muted` | `#666666` | Placeholder text, timestamps, labels |
| `accent` | `#4f46e5` | Primary actions, Google Docs icon, links |
| `accent-hover` | `#6366f1` | Hover state for accent elements |
| `green` | `#22c55e` | Google Sheets icon, success states |
| `amber` | `#f59e0b` | Warnings, low budget indicators |
| `purple-400` | `#a78bfa` | Folder icons |

### Light Theme
| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | `#ffffff` | Main background |
| `bg-secondary` | `#f8f8f8` | Sidebar, cards |
| `bg-tertiary` | `#f0f0f0` | Hover, active |
| `border` | `#e5e5e5` | Borders |
| `text-primary` | `#1a1a1a` | Headlines |
| `text-secondary` | `#555555` | Body text |
| `text-muted` | `#999999` | Placeholder |

## Typography

| Role | Font | Size | Weight |
|------|------|------|--------|
| App navigation | System font (-apple-system) | 13px | 400 |
| Section labels | System font | 11px uppercase | 600 |
| Content titles | Georgia (serif) | 32px | 700 |
| Content headings | System font | 20-28px | 600-700 |
| Content body | System font | 15px, 1.7 line-height | 400 |
| Code / mono | JetBrains Mono | 13px | 400 |

## Spacing & Layout

- **Sidebar width**: 260px (collapsible to 0)
- **Content max-width**: `max-w-3xl` (docs), `max-w-5xl` (sheets)
- **Content padding**: `px-6 py-10` for document content
- **Card padding**: `p-4` standard, `p-6` for larger cards
- **Gap between items**: `gap-0.5` in sidebar, `gap-3` in grid view
- **Border radius**: `rounded-md` (6px) for small elements, `rounded-lg` (8px) for cards, `rounded-xl` (12px) for modals

## Component Patterns

### Cards (File Grid)
- Border: `border border-border`
- Background: `bg-bg-secondary`
- Hover: `hover:border-accent/40 hover:bg-bg-tertiary`
- Transition: `transition` (150ms default)

### Buttons
- Primary: `bg-accent text-white hover:bg-accent-hover rounded-md px-4 py-2`
- Ghost: `text-text-muted hover:bg-bg-tertiary hover:text-text-secondary rounded-md p-1.5`

### Sidebar Items
- Default: `text-text-secondary hover:bg-bg-tertiary hover:text-text-primary rounded-md px-2 py-1.5`
- Active: `bg-bg-tertiary text-text-primary`
- Indent: `16px` per depth level

### Command Palette
- Width: 560px
- Backdrop: `bg-black/50`
- Border: `border border-border`
- Selected item: `aria-selected:bg-bg-tertiary`

## File Type Icons

| Type | Icon | Color |
|------|------|-------|
| Folder | `Folder` | `text-purple-400` |
| Google Doc | `FileText` | `text-accent` (#4f46e5) |
| Google Sheet | `Sheet` | `text-green` (#22c55e) |
| Image | `Image` | `text-text-muted` |
| PDF | `File` | `text-text-muted` |
| Shared Drive | `Users` | `text-blue-400` |
| My Drive | `HardDrive` | `text-text-muted` |

## Animation Guidelines

- **Sidebar expand/collapse**: `transition-all duration-200`
- **Folder tree expand**: Framer Motion `height: 0 -> auto`, 150ms
- **Command palette**: Scale 0.96 -> 1, opacity 0 -> 1, 150ms
- **Drag & drop**: `opacity: 0.4` on dragging item, smooth CSS transform
- **Theme transitions**: No transition on theme switch (instant)

## Interaction Patterns

- **Cmd+K**: Opens command palette from anywhere
- **Click folder in sidebar**: Navigate + expand tree
- **Double-click doc in content**: Open in Google Docs (system browser)
- **Drag files**: Visual reorder within folder, persisted locally
- **Breadcrumbs**: Each segment clickable, last is current (non-link)
- **View toggle**: Grid/List persisted in preferences

## OAuth Success Page

The browser-based success/error pages after Google OAuth should feel premium:
- Dark background (#0a0a0f)
- Subtle radial gradient glow (accent colors)
- Animated SVG checkmark with draw effect
- Floating particle background
- Card with glassmorphism (backdrop-blur, subtle border gradient)
- Staggered fade-up animations (200ms delays)
- Doction branding with shimmer effect

## Design Principles

1. **Content is king** — UI should disappear, content should shine
2. **Dark-first** — Design for dark, adapt for light
3. **Keyboard-first** — Every action reachable without mouse
4. **Smooth but fast** — Animations under 200ms, no loading spinners longer than necessary
5. **Consistent density** — Sidebar is dense, content area is spacious
6. **Trust the grid** — Consistent spacing, aligned edges
7. **No decoration without purpose** — Every border, shadow, gradient serves a function

# Doction — Design Specification

## Overview

Doction is an open-source, Notion-like desktop application that transforms Google Drive into a workspace. Folders become pages, Google Docs render inline as rich content, Sheets display as inline tables, and images/PDFs preview natively. Zero own data persistence — Google Drive IS the database.

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Desktop shell | Tauri v2 (Rust) | ~10x smaller than Electron, native webview, OS keychain access, deep link support |
| Frontend | React 19 + TypeScript (strict) | Industry standard, rich ecosystem |
| Bundler | Vite | Fast HMR, native ESM |
| Routing | TanStack Router | Type-safe, file-system-like routes mapped to Drive folders |
| Server state | TanStack Query | Caching, optimistic updates, background refetching for Google API data |
| Client state | Zustand | Lightweight store for UI state (sidebar collapse, theme, navigation history) |
| Styling | Tailwind CSS v4 + shadcn/ui | Utility-first with accessible component primitives |
| Icons | Lucide React | Consistent, tree-shakeable icon set |
| Animations | Framer Motion | Smooth transitions, drag gesture support |
| Drag & Drop | @dnd-kit/core + @dnd-kit/sortable | Notion-like reordering with accessibility support |
| Command palette | cmdk | Cmd+K fuzzy search, keyboard-first navigation |
| Google APIs | REST via fetch | No Node.js polyfills needed in Tauri webview |

## Architecture

### System Layers

```
┌──────────────────────────────────────────────────┐
│                   Tauri Shell                     │
│                                                   │
│  Rust Backend:                                    │
│  ├── OAuth deep link handler (doction://...)      │
│  ├── Token storage via OS Keychain (keyring)      │
│  ├── Auto-updater (GitHub Releases)               │
│  └── Window management                            │
│                                                   │
│  ┌──────────────────────────────────────────────┐ │
│  │            React Frontend (Webview)           │ │
│  │                                               │ │
│  │  Sidebar (260px)  │  Content Pane             │ │
│  │  ├── Workspace    │  ├── Breadcrumbs          │ │
│  │  ├── Search bar   │  ├── DocRenderer          │ │
│  │  ├── Quick nav    │  ├── SheetRenderer        │ │
│  │  ├── Folder tree  │  ├── ImagePreview         │ │
│  │  └── New page btn │  └── PdfPreview           │ │
│  │                                               │ │
│  │  Command Palette (Cmd+K overlay)              │ │
│  └──────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
        ↕ REST API + OAuth2 Bearer tokens ↕
┌────────────┐ ┌──────────────┐ ┌──────────────────┐
│ Drive v3   │ │ Docs API v1  │ │ Sheets API v4    │
└────────────┘ └──────────────┘ └──────────────────┘
```

### Data Flow

1. User authenticates via Google OAuth2 PKCE flow
2. System browser opens Google consent screen
3. Google redirects to `doction://auth/callback?code=...`
4. Tauri deep link handler captures the authorization code in Rust backend
5. Rust backend exchanges code for tokens via Google token endpoint (client_secret kept in Rust binary)
6. Rust backend stores tokens in OS Keychain via Tauri keyring plugin
7. Frontend requests access token from Rust backend via Tauri IPC command
8. All subsequent API calls use Bearer token in Authorization header
9. TanStack Query manages caching, background refetching, and stale-while-revalidate
10. Rust backend auto-refreshes access token before expiry

### Routing

| Route | Component | Data Source |
|-------|-----------|-------------|
| `/` | Dashboard | Drive API — root folder listing |
| `/folder/$folderId` | FolderPage | Drive API — folder children |
| `/doc/$docId` | DocView | Docs API — document content |
| `/sheet/$sheetId` | SheetView | Sheets API — spreadsheet data |

## UI Design

### Sidebar (260px, collapsible)

- **Workspace header**: App icon + workspace name + collapse toggle
- **Search bar**: Triggers command palette (Cmd+K), shows keyboard shortcut hint
- **Quick navigation**: Home, Favorites, Recent, Trash — each with icon
  - **Favorites**: Uses Drive API `starred` property (read-only query: `files?q=starred=true`). No write scope needed — starring is deferred to Phase 2.
  - **Recent**: Tracked locally in Zustand store persisted to localStorage (last 50 opened files).
  - **Trash**: Uses Drive API query `files?q=trashed=true` (works with readonly scope).
  - **Home**: Shows root Drive folder contents.
- **Folder tree**: Lazy-loaded, expandable/collapsible nodes, file type icons:
  - Purple folder icon for folders
  - Blue doc icon for Google Docs
  - Green table icon for Google Sheets
  - Gray icons for images, PDFs, other files
- **New Page button**: Fixed at bottom, opens Google Drive "new doc" URL in system browser (no write scope needed for MVP; in-app creation deferred to Phase 2)
- **Drag & drop**: Visual reordering within folder view. Order is persisted locally (localStorage) since Drive API doesn't support custom sort order. Actual file *moving* between folders requires write scope and is deferred to Phase 2.

### Content Pane

- **Breadcrumbs**: Full path from root, each segment clickable, star and menu actions on right
- **Content rendering**: Based on file type:
  - **Google Docs**: Parsed from Docs API structural elements, rendered as styled HTML. MVP scope for structural elements:
    - **Supported**: Paragraphs, headings (H1-H6), ordered/unordered lists, inline formatting (bold, italic, underline, strikethrough, code), links, inline images, tables, horizontal rules
    - **Gracefully degraded**: Footnotes (shown as superscript numbers), equations (shown as placeholder), suggested edits (ignored, show final text), headers/footers (omitted), positioned objects (shown inline as best effort)
    - **Not rendered**: Comments, bookmarks, named styles beyond headings
  - **Google Sheets**: Rendered as styled data tables with headers, sortable columns, alternating row colors
  - **Images**: Inline preview with zoom capability
  - **PDFs**: Embedded viewer
  - **Folders**: Grid/list of child files with type icons, names, last modified dates

### Command Palette (Cmd+K)

- Modal overlay centered on screen, 560px wide
- Fuzzy search across all Drive files
- Results show file type icon, name, and folder path breadcrumb
- Keyboard navigation: arrow keys to move, Enter to open, Esc to close
- Recent files shown by default when palette opens

### Visual Design

- **Color scheme**: Dark mode default, light mode toggle
  - Dark: #191919 background, #1e1e1e sidebar, #2a2a2a borders
  - Accent: #4f46e5 (indigo) for primary actions and doc icons
  - Green #22c55e for Sheets, amber for warnings
- **Typography**:
  - Navigation: system font (-apple-system / Segoe UI), 13px
  - Content headings: Georgia or serif stack, 32px for titles
  - Content body: system font, 15px, 1.7 line-height
- **Aesthetic**: Clean, minimal, content-first — Linear meets Notion

## Feature Scope (MVP)

### Must Have

1. **Google OAuth2 PKCE login** — deep link redirect, keychain token storage, auto-refresh
2. **Drive folder tree in sidebar** — lazy-loaded, expandable, with file type icons
3. **Folder as page** — click folder to see contents in content pane (grid + list view)
4. **Google Docs inline rendering** — read-only, styled HTML from Docs API JSON
5. **Google Sheets inline rendering** — read-only data tables from Sheets API
6. **Image preview** — inline display for jpg/png/gif/webp
7. **PDF preview** — embedded viewer
8. **Command palette** — Cmd+K fuzzy search across Drive files
9. **Breadcrumb navigation** — clickable path segments
10. **Drag and drop** — Notion-like visual reordering within folders (order persisted locally). File moving between folders deferred to Phase 2 (requires write scope).
11. **Dark/Light mode** — toggle with system preference detection, persisted in localStorage
12. **Tauri auto-updater** — checks GitHub Releases for updates

### Not in MVP

- Inline editing of Docs/Sheets (Phase 2)
- Google Slides support (Phase 2)
- Offline mode
- Mobile app
- Plugin system
- Real-time collaboration UI (Google handles this natively)
- Custom database/user accounts

## Google APIs

### Required Scopes (MVP — read-only)

- `https://www.googleapis.com/auth/drive.readonly`
- `https://www.googleapis.com/auth/documents.readonly`
- `https://www.googleapis.com/auth/spreadsheets.readonly`

### Key Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /drive/v3/files` | List files in folder, search |
| `GET /drive/v3/files/{id}` | File metadata |
| `GET /docs/v1/documents/{id}` | Document content (structural elements JSON) |
| `GET /sheets/v4/spreadsheets/{id}` | Spreadsheet data |
| `GET /drive/v3/files/{id}?alt=media` | Download file content (images, PDFs) |

### OAuth2 PKCE Flow

1. Generate code_verifier (random 43-128 chars) and code_challenge (SHA256 + base64url)
2. Open system browser: `https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=doction://auth/callback&response_type=code&scope=...&code_challenge=...&code_challenge_method=S256`
3. User consents, Google redirects to `doction://auth/callback?code=...`
4. Tauri deep link handler captures the authorization code
5. **Rust backend** POSTs to `https://oauth2.googleapis.com/token` with code + code_verifier + client_secret (kept in Rust binary, not exposed to webview JS)
6. Receive access_token (1 hour) + refresh_token
7. Rust backend stores both in OS Keychain via Tauri keyring plugin
8. Frontend requests tokens from Rust backend via Tauri IPC command (never directly accesses keychain or token endpoint)
9. Auto-refresh: Rust backend refreshes access_token before expiry using refresh_token

## Project Structure

```
doction/
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs              # Tauri app setup, plugin registration
│   │   ├── main.rs             # Entry point
│   │   └── auth.rs             # Deep link handler, token commands
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── capabilities/
│   │   └── default.json        # Permission capabilities
│   └── icons/
├── src/
│   ├── main.tsx                # React entry point
│   ├── App.tsx                 # Root component with providers
│   ├── routes/
│   │   ├── __root.tsx          # Root layout (sidebar + content)
│   │   ├── index.tsx           # Dashboard / root folder
│   │   ├── folder.$folderId.tsx
│   │   ├── doc.$docId.tsx
│   │   └── sheet.$sheetId.tsx
│   ├── components/
│   │   ├── sidebar/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── FolderTree.tsx
│   │   │   ├── FolderNode.tsx
│   │   │   └── SearchTrigger.tsx
│   │   ├── content/
│   │   │   ├── ContentPane.tsx
│   │   │   ├── DocRenderer.tsx
│   │   │   ├── SheetRenderer.tsx
│   │   │   ├── ImagePreview.tsx
│   │   │   ├── PdfPreview.tsx
│   │   │   └── FolderView.tsx
│   │   ├── navigation/
│   │   │   ├── Breadcrumbs.tsx
│   │   │   └── CommandPalette.tsx
│   │   ├── dnd/
│   │   │   ├── DndProvider.tsx
│   │   │   ├── SortableItem.tsx
│   │   │   └── DragOverlay.tsx
│   │   └── ui/                 # shadcn/ui components
│   ├── lib/
│   │   ├── google/
│   │   │   ├── auth.ts         # OAuth2 PKCE flow
│   │   │   ├── drive.ts        # Drive API wrapper
│   │   │   ├── docs.ts         # Docs API wrapper
│   │   │   ├── sheets.ts       # Sheets API wrapper
│   │   │   └── types.ts        # API type definitions
│   │   ├── hooks/
│   │   │   ├── use-drive-files.ts
│   │   │   ├── use-doc-content.ts
│   │   │   ├── use-sheet-data.ts
│   │   │   ├── use-search.ts
│   │   │   └── use-auth.ts
│   │   └── stores/
│   │       ├── navigation.ts   # Breadcrumb + history state (Zustand)
│   │       ├── sidebar.ts      # Sidebar collapse state (Zustand)
│   │       └── preferences.ts  # Theme, layout prefs (Zustand + localStorage)
│   └── styles/
│       └── globals.css         # Tailwind directives + custom styles
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── components.json             # shadcn/ui config
├── .gitignore
└── LICENSE
```

## Error Handling

- **Auth errors**: Token expired → auto-refresh. Refresh failed → redirect to login screen.
- **API errors**: TanStack Query retry (3 attempts, exponential backoff). Show inline error with retry button.
- **Network offline**: Show banner "You're offline. Some content may be outdated." Serve cached data from TanStack Query.
- **File not found**: Show 404-style page with "This file may have been moved or deleted" and link back to parent folder.
- **Rate limiting**: Google APIs have per-user quotas. Proactive mitigation: max 5 concurrent API requests via a request queue. Show "Too many requests, please wait" with automatic exponential backoff retry.
- **Logout/Account switching**: Clear tokens from OS Keychain, reset TanStack Query cache, redirect to login screen. Account switching = logout + new login.

## Testing Strategy

- **Unit tests**: Vitest for utility functions (auth helpers, API parsers, doc-to-HTML transform)
- **Component tests**: Vitest + Testing Library for React components
- **E2E**: Deferred to Phase 2 (Tauri + Playwright integration)
- **API mocking**: MSW (Mock Service Worker) for Google API responses in development and tests

## Platform Scope

MVP targets **macOS only**. Windows and Linux support is planned for Phase 2 — deep link registration (`doction://`) and code signing differ per platform and are out of scope for the initial release.

## Success Criteria

- App launches on macOS via Tauri
- User can sign in with Google OAuth
- Folder tree renders from Drive with lazy loading
- Clicking a Google Doc shows styled content inline
- Clicking a Google Sheet shows data as a table
- Images and PDFs preview inline
- Cmd+K search works across Drive files
- Files can be drag-and-dropped to reorder
- Dark/light mode toggles correctly
- Auto-updater checks GitHub Releases

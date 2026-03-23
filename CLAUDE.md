# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is Doction?

A Notion-like desktop app built with **Tauri v2 + React 19** that uses Google Drive as its backend. Users browse, view, and organize their Drive files (Docs, Sheets, images, PDFs) in a modern workspace UI.

## Commands

```bash
# Development (requires: source .env.local first for OAuth creds)
npm run tauri dev          # Full Tauri + Vite dev (frontend on :1420)
npm run dev                # Frontend-only Vite dev server

# Build
npm run build              # TypeScript check + Vite production build
npm run tauri build        # Full desktop app build (needs env vars)

# Quality
npm run lint               # ESLint
npx vitest                 # Run all tests
npx vitest run src/lib/__tests__/doc-parser.test.ts  # Single test file
```

## Architecture

### Frontend (src/)

- **Routing**: TanStack Router with file-based routes in `src/routes/`. Route tree auto-generated to `src/routeTree.gen.ts` — never edit manually.
- **Data fetching**: TanStack Query hooks in `src/lib/hooks/`. 2-min stale time, 3 retries with exponential backoff. Query keys structured as `["scope", "feature", ...params]`.
- **State**: Zustand stores with localStorage persistence in `src/lib/stores/` (preferences, sidebar, file-order, recent).
- **Google API clients**: `src/lib/google/` — base `ApiClient` with max 5 concurrent requests + queue. Factory functions (`createDriveApi`, `createDocsApi`, `createSheetsApi`) return async method objects. Consumed via `ApiContext` / `useApi()` hook.
- **Styling**: Tailwind CSS v4 with custom CSS properties for theming (dark default, light via `.light` class). shadcn/ui components (new-york style, zinc base).
- **Components**: `src/components/` organized by feature (auth, sidebar, navigation, content, dnd, theme).

### Backend (src-tauri/)

Rust backend handles OAuth only:
- **auth.rs**: PKCE OAuth flow — spawns localhost TcpListener, opens browser, exchanges code for tokens, stores in Tauri store.
- **Tauri commands**: `start_auth()`, `get_access_token()`, `logout()`, `is_authenticated()` — invoked from React via `@tauri-apps/api`.

### Key patterns

- Root layout (`__root.tsx`): AuthGuard → ApiProvider → Sidebar + content area + CommandPalette
- Route params: `/folder/$folderId`, `/doc/$docId`, `/sheet/$sheetId`, `/file/$fileId`
- Type helpers in `src/lib/google/types.ts`: `isFolder()`, `isDocument()`, `isImage()`, `isPdf()`, MIME_TYPES constants
- Doc content parsed via `src/lib/doc-parser.ts` (Google Doc JSON → `DocBlock[]`)
- Drag-and-drop via @dnd-kit with order persisted to Zustand store

## Environment Setup

Requires Node 22+, Rust stable. OAuth credentials in `.env.local` (git-ignored):
```bash
export GOOGLE_CLIENT_ID="..."
export GOOGLE_CLIENT_SECRET="..."
```
These are injected at build time into the Rust binary.

## Path Alias

`@/*` maps to `./src/*` in both TypeScript and Vite configs.

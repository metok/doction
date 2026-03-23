# Doction

A Notion-like desktop workspace powered by Google Drive. No proprietary database — your Google Drive **is** the database.

Folders become pages. Google Docs render inline. Sheets display as tables. Images and PDFs preview natively. Everything you already have in Drive, presented beautifully.

## Features

- **Google Drive as workspace** — folders as pages, files as content blocks
- **Inline Google Docs** — rendered as styled, readable documents
- **Inline Google Sheets** — tabbed tables with formatted data
- **Image & PDF preview** — zoom, pan, embedded viewing
- **Command palette** — `Cmd+K` fuzzy search across all your Drive files
- **Drag & drop** — reorder files within folders, Notion-style
- **Shared Drives** — team drives listed alongside your personal drive
- **Dark/Light/System theme** — with smooth, consistent styling
- **Breadcrumb navigation** — full path with star, share, and info actions
- **Auto-updater** — checks GitHub Releases for new versions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop | [Tauri v2](https://v2.tauri.app/) (Rust) |
| Frontend | React 19 + TypeScript |
| Bundler | Vite |
| Routing | TanStack Router |
| Data | TanStack Query |
| State | Zustand |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Icons | Lucide React |
| Animations | Framer Motion |
| Drag & Drop | @dnd-kit |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [Rust](https://rustup.rs/) (stable toolchain)
- A Google Cloud project with OAuth 2.0 credentials

### Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Enable these APIs: **Drive API**, **Docs API**, **Sheets API**
4. Go to **APIs & Services > Credentials**
5. Create an **OAuth 2.0 Client ID** (Application type: Desktop)
6. Add `http://localhost` as an authorized redirect URI
7. Go to **OAuth consent screen** > **Test users** and add your email
8. Copy the Client ID and Client Secret

### Installation

```bash
git clone https://github.com/metok/doction.git
cd doction
npm install
```

### Configuration

Open `src-tauri/src/auth.rs` and replace the placeholder credentials:

```rust
const CLIENT_ID: &str = "your-client-id.apps.googleusercontent.com";
const CLIENT_SECRET: &str = "your-client-secret";
```

### Run

```bash
npm run tauri dev
```

## Building

```bash
npm run tauri build
```

Produces platform-specific binaries in `src-tauri/target/release/bundle/`.

## Project Structure

```
doction/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── lib/                # API clients, hooks, stores
│   ├── routes/             # TanStack Router file-based routes
│   └── styles/             # Tailwind CSS
├── src-tauri/              # Tauri Rust backend
│   └── src/                # OAuth, token management
├── docs/                   # Design guide, specs, plans
└── .github/workflows/      # CI/CD
```

## About

Doction is a personal project by [Mehmet Emin Tok](https://www.linkedin.com/in/mehmet-tok/).

This is an early-stage experiment in reimagining how we interact with Google Drive. The goal is to make Drive feel like a modern workspace — fast, keyboard-first, and beautiful — without locking your data into another proprietary system.

**I'm open to feedback.** If you have ideas, find bugs, or want to contribute, feel free to [open an issue](https://github.com/metok/doction/issues) or reach out on [LinkedIn](https://www.linkedin.com/in/mehmet-tok/).

## License

[MIT](LICENSE) — use it, fork it, build on it.

# Contributing to Doction

Du willst mitbauen? Nice. Hier ist alles was du brauchst.

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

## Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [Rust](https://rustup.rs/) (stable toolchain)
- A Google Cloud project with OAuth 2.0 credentials

## Google Cloud Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Enable these APIs: **Drive API**, **Docs API**, **Sheets API**
4. Go to **APIs & Services > Credentials**
5. Create an **OAuth 2.0 Client ID** (Application type: Desktop)
6. Add `http://localhost` as an authorized redirect URI
7. Go to **OAuth consent screen** > **Test users** and add your email
8. Copy the Client ID and Client Secret

## Installation

```bash
git clone https://github.com/metok/doction.git
cd doction
npm install
```

## Configuration

Create a `.env.local` file in the project root:

```bash
export GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
export GOOGLE_CLIENT_SECRET="your-client-secret"
```

## Development

```bash
source .env.local
npm run tauri dev
```

Frontend dev server runs on `http://localhost:1420`.

## Building

```bash
npm run tauri build
```

Produces platform-specific binaries in `src-tauri/target/release/bundle/`.

## Quality

```bash
npm run lint          # ESLint
npx vitest            # Run tests
```

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

## Releasing

Releases werden automatisch gebaut. Push einen Tag:

```bash
git tag v0.2.0
git push origin v0.2.0
```

GitHub Actions baut für macOS (ARM + Intel), Windows und Linux. Der Release wird als Draft erstellt und nach erfolgreichem Build veröffentlicht.

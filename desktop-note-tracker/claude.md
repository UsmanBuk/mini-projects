# Desktop Note Tracker - Project Context

## Overview
A productivity suite combining a Windows desktop application (Electron) with a cloud-based web interface (Next.js), featuring note-taking capabilities with integrated Claude AI chat and cloud synchronization via Supabase.

## Architecture

### Desktop Application (Electron + React)
- **Main Process** (`src/electron/main.ts`): Window management, IPC handlers, global hotkeys
- **Renderer Process** (`src/react/`): React UI with TypeScript
- **Auth Manager** (`src/electron/auth-manager.ts`): Handles Supabase authentication
- **Sync Service** (`src/electron/sync-service.ts`): Cloud synchronization logic

### Web Application (Next.js)
- Located in `web/` directory
- Provides cloud-based access to notes
- Uses Supabase for backend and authentication
- Shares types with desktop app via `shared/` directory

### Shared Code
- **Types** (`shared/types/`): Common TypeScript interfaces/types
- **Utils** (`shared/utils/`): Shared utility functions
- Used by both desktop and web applications

### Database
- **Supabase** backend with migrations in `database/migrations/`
- Schema includes notes, folders, and user data
- Real-time sync capabilities

## Tech Stack

### Desktop
- Electron 28.x
- React 18.x
- TypeScript 5.x
- Tailwind CSS
- Framer Motion (animations)
- Anthropic Claude API
- electron-store (local persistence)
- Webpack (bundling)

### Web
- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase client

### Backend
- Supabase (PostgreSQL, Auth, Storage, Realtime)

## Key Features

1. **Note Management**
   - Quick capture with Enter key
   - Search and filter by date
   - Folder organization
   - Local and cloud storage

2. **AI Integration**
   - Claude AI chat with note context
   - AI assistant accessible from both desktop and web

3. **Sync & Cloud**
   - Real-time sync between desktop and web
   - Conflict resolution
   - Offline-first with local persistence

4. **Desktop-Specific**
   - Always-on-top floating widget
   - Global hotkeys (Ctrl+Shift+N, Ctrl+Shift+Q)
   - Window position persistence
   - Glassmorphism UI

5. **Export**
   - JSON format
   - Markdown format

## Development

### Desktop App
```bash
npm run dev              # Run dev mode (electron + react)
npm run build            # Build for production
npm run dist             # Create distributable
```

### Web App
```bash
cd web
npm run dev              # Run Next.js dev server
npm run build            # Build for production
```

## Environment Variables

### Desktop (.env)
- `ANTHROPIC_API_KEY`: Claude API key
- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key

### Web (web/.env.local)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Project Structure
```
desktop-note-tracker/
├── src/
│   ├── electron/         # Main process
│   └── react/            # Renderer process
│       ├── components/   # React components
│       ├── hooks/        # Custom hooks
│       ├── services/     # Business logic
│       ├── types/        # Type definitions
│       └── utils/        # Utilities
├── web/                  # Next.js web app
│   └── src/
│       ├── app/          # App router pages
│       └── components/   # React components
├── shared/               # Shared code
│   ├── types/           # Common types
│   └── utils/           # Common utilities
├── database/
│   └── migrations/      # SQL migrations
└── dist/                # Build output
```

## Git Status
- Main branch: `main`
- Recent work: Vercel deployment fixes, cloud sync implementation
- Modified files: `shared/types/index.ts`, `src/react/types/index.ts`
- Pending migration: `database/migrations/002_add_folders.sql`

## Notes for Development
- Uses path aliases: `@shared/*` maps to `shared/*`
- TypeScript strict mode enabled
- ESLint and type checking may be disabled for deployment builds
- Window state persists using electron-store
- IPC communication between main and renderer processes

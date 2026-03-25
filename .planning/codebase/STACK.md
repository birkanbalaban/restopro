# Technology Stack

**Analysis Date:** 2025-01-13

## Languages

**Primary:**
- TypeScript ~5.8.2 - Frontend application and server code
- JavaScript (via Vite) - Build system and module imports

**Secondary:**
- SQL - Database queries via better-sqlite3

## Runtime

**Environment:**
- Node.js - Server runtime (version specified in `.nvmrc` or inferred from tsconfig)

**Package Manager:**
- npm - Package management
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- React 19.0.0 - UI framework for frontend application (`src/App.tsx`, component hierarchy)
- Express 4.21.2 - HTTP server framework for API endpoints (`server/src/index.ts`)

**Real-time Communication:**
- Socket.IO 4.8.3 - WebSocket server for real-time updates (`server/src/index.ts`)
- Socket.IO Client 4.8.3 - WebSocket client for frontend (`src/services/socketService.ts`)

**Build & Dev:**
- Vite 6.2.0 - Build tool and dev server (`vite.config.ts`)
- Vite React Plugin 5.0.4 - React integration for Vite

**Styling:**
- Tailwind CSS 4.1.14 - Utility-first CSS framework
- Tailwind CSS Vite Plugin 4.1.14 - Vite integration for Tailwind

**Utilities:**
- Motion 12.36.0 - Animation library
- Lucide React 0.546.0 - Icon library
- clsx 2.1.1 - Conditional class name utility
- Tailwind Merge 3.5.0 - Tailwind class merging utility

## Key Dependencies

**Critical:**
- better-sqlite3 12.8.0 - Embedded SQL database for local-first operation (`server/src/db.ts`)
  - Local file storage: `server/data/cafe.db`
  - Used for tables, orders, menu items, staff, inventory, reservations, sales
  
- @google/genai 1.29.0 - Google Gemini AI API integration (configured but not actively used in current codebase)
  - API key required: `GEMINI_API_KEY` environment variable

**Infrastructure:**
- express 4.21.2 - REST API server for data persistence
- cors 2.8.6 - CORS middleware for cross-origin requests
- socket.io 4.8.3 - Real-time bidirectional communication
- dotenv 17.2.3 - Environment variable management

## DevDependencies

**Tooling:**
- typescript ~5.8.2 - Static type checking
- tsx 4.21.0 - TypeScript execution for Node.js
- vite 6.2.0 - Build tool and dev server
- vitest 4.1.0 - Unit test runner (Vue/Vite ecosystem)
- @vitest/coverage-v8 4.1.0 - Code coverage reporting
- autoprefixer 10.4.21 - PostCSS plugin for vendor prefixes
- @types/express 4.17.21 - TypeScript types for Express
- @types/node 22.14.0 - TypeScript types for Node.js

## Configuration

**Environment:**
- `.env.example` - Template with required variables
- `.env` file expected at runtime (not committed)
- Key variables:
  - `GEMINI_API_KEY` - Google Gemini API authentication key
  - `APP_URL` - Application URL (injected by AI Studio)
  - `PORT` - Server port (defaults to 3005 if not set)
  - `DISABLE_HMR` - Disable hot module reloading (set by AI Studio during agent edits)

**Build:**
- `vite.config.ts` - Vite configuration with React, Tailwind, alias paths
- `tsconfig.json` - TypeScript compiler settings (target ES2022, JSX React, path aliases with `@/*`)
- `package.json` - npm scripts and dependency management

## Scripts

**Development:**
```bash
npm run dev              # Start Vite dev server on port 3010
npm run server           # Start Express backend server via tsx
```

**Production:**
```bash
npm run build            # Build for production (vite build)
npm run preview          # Preview production build
npm run clean            # Remove dist directory
```

**Quality:**
```bash
npm run lint             # Type check with tsc --noEmit
npm run test             # Run unit tests with vitest
npm run test:coverage    # Run tests with coverage reporting
```

## Platform Requirements

**Development:**
- Node.js (LTS recommended)
- npm 6.0+
- Port 3010 (Vite frontend dev server)
- Port 3005 (Express backend server)

**Production:**
- Google Cloud Run (AI Studio deployment target)
- Cloud Run injects `GEMINI_API_KEY` and `APP_URL` at runtime
- SQLite database stored in `server/data/cafe.db` (persists between deployments)

## Architecture Notes

**Monorepo Structure:**
- Frontend: React app in `src/` directory
- Backend: Express server in `server/` directory
- Shared: TypeScript types in `src/types.ts`, constants in `src/constants.ts`
- Database: SQLite with schema defined in `server/src/db.ts`

**Local-First Design:**
- Primary persistence: SQLite (not cloud-based)
- Real-time sync: Socket.IO broadcasts between server and clients
- No direct Firebase integration currently (firestore.rules and firebase-blueprint.json are reference/planning documents)

---

*Stack analysis: 2025-01-13*

# RestoPro Codebase Organization

## Overview

RestoPro is organized with clear separation of concerns: frontend (React + Vite) in `/src/`, backend (Express + SQLite) in `/server/`, and configuration at the root level. This document describes the structure and guides developers on where to add new features.

---

## Directory Structure

### Root Level

- **package.json** — Project manifest with all dependencies and scripts
- **tsconfig.json** — TypeScript configuration (strict mode enabled)
- **vite.config.ts** — Vite build configuration
- **.env.example** — Template for environment variables (see Phase 2)
- **index.html** — HTML entry point (serves /src/main.tsx)

### `/src/` — Frontend Application

```
src/
├── main.tsx              # React app entry point
├── App.tsx               # Root component with routing and state management
├── index.css             # Global styles + Tailwind imports
├── types.ts              # All TypeScript interfaces (User, Table, Order, etc.)
├── utils.ts              # Shared utility functions
├── constants.ts          # Sample data and configuration constants
│
├── services/             # API and communication services
│   ├── apiService.ts     # Express backend API wrapper (all data fetches)
│   └── socketService.ts  # Socket.io real-time connection manager
│
├── hooks/                # Custom React hooks
│   └── usePrinters.ts    # Printer configuration state management
│
├── components/           # Reusable UI components
│   ├── layout/           # Structural components (sidebars, headers)
│   └── shared/           # Shared elements (buttons, modals, toasts)
│
└── views/                # Page-level components (full screen views)
    ├── DashboardView.tsx          # Main dashboard/POS view
    ├── KitchenView.tsx            # Kitchen display system
    ├── MenuView.tsx               # Menu management
    ├── StaffView.tsx              # Staff management
    ├── SettingsView.tsx           # Settings and configuration
    ├── Reservations.tsx           # Reservation management
    ├── InventoryView.tsx          # Inventory tracking
    └── FloorPlan/                 # Floor plan layout and table management
        ├── index.tsx              # Main floor plan view
        ├── TableCard.tsx          # Individual table component
        ├── MenuSelector.tsx       # Item selection modal
        ├── DraftSidebar.tsx       # Draft orders sidebar
        └── ...other components
```

### `/server/` — Express Backend

```
server/
└── src/
    ├── index.ts         # Express server entry point
    ├── db.ts            # SQLite database initialization and schema
    └── routes/          # API route handlers (if modularized in future)
```

### `/.planning/` — Project Management

```
.planning/
├── STATE.md                         # Execution state and progress tracking
├── ROADMAP.md                       # Feature roadmap and phase definitions
├── REQUIREMENTS.md                  # Acceptance criteria for all requirements
├── PROJECT.md                       # Project vision and decisions
├── CODEBASE_ORGANIZATION.md         # This file
└── phases/                          # Phase-specific plans and summaries
    └── 01-firebase-removal-codebase-cleanup/
        ├── 01-PLAN.md              # Detailed execution plan
        ├── 01-CONTEXT.md           # Context and decisions
        └── 01-SUMMARY.md           # Execution summary and metrics
```

---

## Key Patterns & Conventions

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ React Components (src/views/, src/components/)              │
│  └─ Call: apiService.functionName()                        │
│     └─ Emits: socket.emit('event', data)                   │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP (fetch)
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ Express API (server/src/index.ts)                           │
│  POST /api/orders                                           │
│  GET  /api/tables                                           │
│  etc. (full endpoint list in src/services/apiService.ts)   │
└────────────────────┬────────────────────────────────────────┘
                     │ Database
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ SQLite Database (server/src/db.ts)                          │
│  Single source of truth for all state                       │
│  Tables: tables, orders, menu_items, staff, etc.           │
└─────────────────────────────────────────────────────────────┘
                     │ Socket.io
                     ↓
┌─────────────────────────────────────────────────────────────┐
│ All Connected Clients (Real-time Updates)                  │
│  Multiple tablets and kitchen displays stay in sync         │
└─────────────────────────────────────────────────────────────┘
```

**Key Rule:** Components NEVER make direct API calls. Always use `apiService` for consistent error handling and centralized request management.

### Error Handling Pattern

All asynchronous operations follow a consistent error pattern:

```typescript
// In apiService
try {
    const response = await fetch(url, options);
    if (!response.ok) throw { code: 'CLIENT_ERROR', message: '...' };
    return response.json();
} catch (error) {
    throw {
        code: 'NETWORK_ERROR' | 'SERVER_ERROR' | 'PARSE_ERROR',
        message: 'Human-readable error',
        details: error  // for debugging
    };
}

// In components
try {
    await apiService.createOrder(...);
} catch (error) {
    const apiError = error as ApiError;
    showToast(`[${apiError.code}] ${apiError.message}`, 'error');
}
```

**Error Codes:**
- `NETWORK_ERROR` — Network request failed, server unreachable
- `CLIENT_ERROR` — 4xx HTTP response (validation, not found, etc.)
- `SERVER_ERROR` — 5xx HTTP response (server exception)
- `PARSE_ERROR` — Response body could not be parsed
- `UNKNOWN_ERROR` — Unexpected error type

### Type Safety

**All data shapes must be defined in `src/types.ts`:**

```typescript
// ✅ Good
import { Order, Table } from '../types';

const orders: Order[] = apiService.getOrders();
const table: Table = orders[0].tableId;

// ❌ Bad
const data: any = await fetch('/api/orders').then(r => r.json());
```

TypeScript strict mode is enabled. All types must be properly annotated—no implicit `any`.

### Component Organization

**View Components** (`src/views/`) represent full-screen pages:
- Receive props from parent (state, callbacks)
- Manage local state for UI interactions
- Call `apiService` methods
- Emit Socket.io events

**Shared Components** (`src/components/shared/`) are reusable widgets:
- Small, single-purpose
- Accept all config via props
- Do not call APIs directly

**Layout Components** (`src/components/layout/`) structure the UI:
- Sidebars, headers, footers
- Pass props to child components
- No business logic

### Utility Functions

Utilities are in `src/utils.ts`. Categories:

| Category | Examples |
|----------|----------|
| **CSS** | `cn()` — Merge Tailwind classes intelligently |
| **Time/Date** | `formatElapsed()`, `isUrgent()`, `formatDate()` |
| **Formatting** | `formatCurrency()`, `formatNumber()` |
| **Validation** | `isValidPin()`, `isValidEmail()` |

Use utility functions consistently to avoid code duplication.

### Logging & Debugging

**Production builds have zero console statements.** In development, use:

```typescript
if (import.meta.env.DEV) {
    console.log('Debug info', data);
}
```

For critical errors, rely on error handling infrastructure (error codes, user-facing messages).

---

## Adding New Features

### Example: Add a New Report Type

1. **Define types in `src/types.ts`:**
   ```typescript
   export interface ReportData {
       period: string;
       totalSales: number;
       itemsCount: number;
   }
   ```

2. **Add API endpoint in `src/services/apiService.ts`:**
   ```typescript
   getReport: (startDate: string, endDate: string) => 
       request<ReportData>('/reports', {
           method: 'POST',
           body: JSON.stringify({ startDate, endDate })
       })
   ```

3. **Create view component `src/views/ReportView.tsx`:**
   ```typescript
   import { apiService } from '../services/apiService';
   import { ReportData } from '../types';

   export const ReportView = ({ showToast }) => {
       const [report, setReport] = useState<ReportData | null>(null);

       const loadReport = async () => {
           try {
               const data = await apiService.getReport(...);
               setReport(data);
           } catch (error) {
               const apiError = error as ApiError;
               showToast(`${apiError.code}: ${apiError.message}`, 'error');
           }
       };

       return <div>...</div>;
   };
   ```

4. **Implement backend endpoint in `server/src/index.ts`:**
   ```typescript
   app.post('/api/reports', (req, res) => {
       try {
           const { startDate, endDate } = req.body;
           const data = db.prepare('SELECT ... WHERE date BETWEEN ? AND ?')
               .all(startDate, endDate);
           res.json(data);
       } catch (error) {
           res.status(500).json({ error: (error as Error).message });
       }
   });
   ```

5. **Test & Commit:**
   - Run `npm run lint` (zero TypeScript errors)
   - Run `npm run build` (success)
   - Test in browser via `npm run preview`

---

## Build & Deploy

### Development

```bash
# Terminal 1 - Start Express server
npm run server
# Listens on http://localhost:3005

# Terminal 2 - Start Vite dev server
npm run dev
# Listens on http://localhost:3010
```

Access application at `http://localhost:3010`

### Production Build

```bash
# Build frontend
npm run build
# Output: /dist/ directory

# Build verification
npm run lint        # TypeScript check
npm run preview     # Serve production build locally
```

---

## Dependency Policy

### Always Use

- **React 19+** — UI framework
- **Vite** — Build tool
- **TypeScript 5.8+** — Type safety
- **Tailwind CSS** — Styling
- **Express** — Backend framework
- **SQLite** — Local database
- **Socket.io** — Real-time updates

### Never Add Without Discussion

- Cloud services (Firebase, AWS, GCP) — By design, we're local-first
- State management libraries (Redux, Zustand) — Keep state simple
- HTTP clients (axios) — Use fetch with apiService wrapper
- UI frameworks beyond React — Stick with React patterns

---

## Common Tasks

### Search for Usages
```bash
grep -r "functionName" src/ --include="*.tsx" --include="*.ts"
```

### Find TODO/FIXME Comments
```bash
grep -r "TODO\|FIXME" src/ --include="*.tsx" --include="*.ts"
```

### Type Check
```bash
npm run lint
```

### Find All Exports from a File
```bash
grep "^export" src/types.ts
```

### Check for Dead Code
Exported functions/types not imported anywhere are candidates for removal.

---

## Architecture Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|-----------|
| Local-first (no cloud) | Reliability in restaurant with poor internet | Manual sync for multi-location (Phase 2+) |
| SQLite as DB | Lightweight, embeddable, single file | No horizontal scaling (not needed for restaurant) |
| Socket.io for sync | Handles dropouts gracefully | Must manage reconnection logic carefully |
| Express for API | Simple, familiar, good performance | Need to manage CORS and security |
| React for UI | Component reusability, large ecosystem | Need strict discipline to avoid spaghetti |
| No state library | Keep things simple, avoid over-engineering | Passed props can get complex in deep trees |
| Strict TypeScript | Catch errors at compile time | Extra build step (but worth it) |

---

## Warnings & Anti-Patterns

🚫 **DO NOT:**
- Make direct `fetch()` calls outside `apiService`
- Use `any` types without comment explaining why
- Leave `console.log` statements in production code
- Hardcode API URLs outside `apiService`
- Create unnamed or deeply nested components
- Put business logic in view components (extract to utils)
- Ignore TypeScript errors (fix them!)
- Skip testing in the browser before committing

✅ **DO:**
- Import types from `src/types.ts`
- Call `apiService` methods for all data
- Use utility functions from `src/utils.ts`
- Handle errors with try/catch and ApiError format
- Keep components small and focused
- Document complex logic with comments
- Run `npm run lint` before committing
- Test in browser after changes

---

## Questions & Support

For questions about the architecture or codebase organization:

1. Check this document first
2. Review comments in relevant source files
3. Look at similar features already implemented
4. Read the phase documentation in `.planning/phases/*/`

---

*Last updated: Phase 1 (Firebase Removal & Codebase Cleanup)*  
*Next review: After Phase 2 (Environment Configuration)*

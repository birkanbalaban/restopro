# Architecture

**Analysis Date:** 2025-03-25

## Pattern Overview

**Overall:** Fullstack monorepo with decoupled frontend (React/Vite) and backend (Express/SQLite) connected via REST API and WebSockets

**Key Characteristics:**
- Frontend: React 19 + TypeScript in `src/`
- Backend: Express.js + better-sqlite3 in `server/`
- Real-time synchronization via Socket.io
- State management: Centralized in App.tsx with localStorage for client settings
- Type safety: Shared types across frontend and backend via `src/types.ts`

## Layers

**Presentation Layer:**
- Purpose: UI components and views for the POS interface
- Location: `src/components/`, `src/views/`
- Contains: React components (view containers, layout components, shared UI elements)
- Depends on: Services, hooks, types, constants
- Used by: App.tsx (root component)

**Services Layer:**
- Purpose: API communication and real-time socket events
- Location: `src/services/`
- Contains: 
  - `apiService.ts` - REST API wrapper with typed methods for all entities
  - `socketService.ts` - Socket.io client singleton
- Depends on: Types
- Used by: Views and App.tsx for data operations

**Hooks Layer:**
- Purpose: Custom React hooks for stateful logic
- Location: `src/hooks/`
- Contains: `usePrinters.ts` - manages printer configuration with localStorage
- Depends on: Types
- Used by: App.tsx and views

**Constants & Types Layer:**
- Purpose: Shared data types, mock data, and configuration
- Location: `src/types.ts`, `src/constants.ts`
- Contains: TypeScript interfaces and default data
- Depends on: Nothing
- Used by: All other layers

**Backend API Layer:**
- Purpose: HTTP endpoints and Socket.io event handling
- Location: `server/src/index.ts` (513 lines - all routes in one file)
- Contains: Express route handlers for tables, menu, orders, sales, staff, reservations, inventory
- Depends on: Database layer, constants
- Used by: Frontend via fetch and Socket.io

**Database Layer:**
- Purpose: SQLite schema and data operations
- Location: `server/src/db.ts`
- Contains: Database initialization, schema creation, seed data loading
- Depends on: better-sqlite3 driver
- Used by: API layer for all CRUD operations

**Utilities:**
- Location: `src/utils.ts`
- Contains: `cn()` utility for Tailwind class merging
- Used by: Components throughout the codebase

## Data Flow

**Initialization Flow:**

1. Frontend (`src/main.tsx`) → Create React root and render `App.tsx`
2. App.tsx mounts → Calls `fetchData()` to load initial state from `/api/*` endpoints
3. App.tsx → Establishes Socket.io connection via `socketService.connect()`
4. Backend server starts → `initDB()` creates SQLite schema
5. Backend → `seedDB()` populates initial data from `src/constants.ts`

**User Login Flow:**

1. User enters PIN on `KeypadLogin.tsx`
2. Calls `apiService.getStaff()` to validate (currently all staff have PINs in constants)
3. Sets `currentStaff` state in App.tsx
4. Session auto-lock triggers 5-minute timeout via `resetTimer()`
5. User logout clears `currentStaff` state

**Order Creation & Management Flow:**

1. User selects table from `FloorPlanView`
2. Opens `MenuSelector` to add items
3. Items collected in `draftOrder` state (DraftSidebar)
4. User confirms → Calls `apiService.createOrder(tableId)` 
5. Server creates order record, broadcasts `orders_updated`
6. Frontend receives Socket event → Refetches orders via `apiService.getOrders()`
7. Order items status updated in `KitchenView` → Calls `updateOrderItemStatus()`
8. Backend broadcasts `orders_updated` → Syncs across all clients
9. Payment collected → `completeSale()` records transaction and marks order completed

**Real-time Sync Pattern:**

1. Action in UI triggers API call (e.g., `updateTableStatus()`)
2. Backend receives request → Updates database
3. Backend broadcasts Socket event (e.g., `'table_updated'`)
4. App.tsx listens for event (line 100-106) → Calls corresponding `apiService.get*()`
5. State updates in App.tsx → Triggers re-render with fresh data

**State Management:**

- App.tsx maintains 8+ pieces of state: tables, menuItems, orders, staff, sales, inventory, reservations, shifts
- State lifted to App.tsx and passed to views via props
- Views call `apiService` methods which trigger re-fetches via Socket events
- No Redux/Zustand - state management is simple but not scalable for larger teams
- Client-side settings (printers) stored in localStorage via `usePrinters` hook

## Key Abstractions

**apiService:**
- Purpose: Centralized REST API client
- Location: `src/services/apiService.ts`
- Pattern: Object with typed method for each endpoint
- Example methods: `getTables()`, `createOrder()`, `completeSale()`, `updateInventory()`
- Handles: URL building, JSON serialization, error throwing

**socketService:**
- Purpose: Singleton Socket.io wrapper
- Location: `src/services/socketService.ts`
- Pattern: Class with `connect()`, `on()`, `off()`, `emit()` methods
- Auto-connects on first use
- No event type safety (uses string event names)

**Entities (TypeScript Interfaces):**
- `Table` - Restaurant table with status, capacity, position
- `Order` - Draft or submitted order with items and total
- `OrderItem` - Line item in an order with status tracking
- `MenuItem` - Menu item with modifiers and printer routing
- `Staff` - Employee with role-based access
- `InventoryItem` - Stock item with supplier and expiration tracking
- `Reservation` - Table reservation with customer info
- `PrinterConfig` - Printer configuration stored in localStorage

**Views (Page Components):**
- `FloorPlanView` - Main POS interface showing table grid
- `MenuView` - Menu management (admin only)
- `KitchenView` - Kitchen order display and status updates
- `InventoryView` - Stock management with low-stock alerts
- `StaffView` - Employee management and shift scheduling
- `ReservationsView` - Reservation management
- `DashboardView` - Sales analytics
- `SettingsView` - Printer configuration

## Entry Points

**Frontend Entry Point:**
- Location: `src/main.tsx`
- Triggers: Renders React app to `#root` element in `index.html`
- Responsibilities: Mounts App.tsx, loads global CSS

**App Component (Root):**
- Location: `src/App.tsx` (331 lines)
- Triggers: Mounts automatically after main.tsx
- Responsibilities: 
  - User authentication (PIN-based login)
  - Session management with 5-minute timeout
  - Data fetching and state management for all entities
  - Socket.io event listening and state sync
  - View routing (9 different views)
  - Toast notifications for user feedback

**Backend Entry Point:**
- Location: `server/src/index.ts`
- Triggers: Run via `npm run server` (uses tsx to run TypeScript directly)
- Responsibilities:
  - Initialize Express app with middleware (CORS, JSON)
  - Create HTTP server and Socket.io instance
  - Initialize SQLite database and load seed data
  - Expose 40+ REST API endpoints
  - Broadcast Socket.io events on data changes

**Database Init:**
- Location: `server/src/db.ts` line 18-138
- Triggers: Called once on server startup via `initDB()`
- Responsibilities: Create 9 SQLite tables (tables, orders, order_items, menu_items, staff, shifts, inventory, reservations, sales)

## Error Handling

**Strategy:** Basic try-catch with JSON error responses and console logging

**Patterns:**

**Frontend:**
- API calls wrapped in try-catch, errors logged to console
- `fetchData()` catches errors silently with `console.error()` (line 82-84)
- User feedback via Toast component for success/error messages
- No explicit error state tracking per entity

**Backend:**
- Route handlers use try-catch blocks returning HTTP status codes
- 500 errors return JSON with error message
- 404 responses for not found cases
- Console logging with prefixes (e.g., `[Kitchen]`, `[App]`) for debugging
- Database transactions used for multi-step operations (sales, item transfers)

## Cross-Cutting Concerns

**Logging:** 
- Frontend: `console.log()` and `console.error()` in App.tsx, socketService, and kitchen view
- Backend: Prefixed console logs with module context (e.g., `[Kitchen] Item X status update`)
- No structured logging or log aggregation

**Validation:** 
- Frontend: Type safety via TypeScript
- Backend: No explicit validation - relies on database constraints and type coercion
- Missing: Input validation, sanitization, null checks in API routes

**Authentication:** 
- PIN-based: Users select staff member and enter PIN
- No JWT or session tokens
- Session stored in React state only (no persistence)
- 5-minute auto-lock on inactivity via `resetTimer()`
- Security gap: PINs stored plaintext in database

**Authorization:**
- Role-based access (admin, manager, waiter, chef)
- Frontend checks role to show/hide views
- No backend route protection - any authenticated client can access any endpoint
- Gap: Manager features accessible to all if frontend code modified

---

*Architecture analysis: 2025-03-25*

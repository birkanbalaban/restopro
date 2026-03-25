# External Integrations

**Analysis Date:** 2025-01-13

## APIs & External Services

**Google Gemini AI:**
- Service: Google Gemini API
- What it's used for: AI capabilities (configured but not actively integrated in current codebase)
- SDK/Client: `@google/genai` 1.29.0 (imported but unused)
- Auth: Environment variable `GEMINI_API_KEY`
- Status: Ready for future AI feature integration

**Google AI Studio:**
- Service: Google AI Studio platform
- What it's used for: Application hosting and deployment environment
- Features utilized:
  - Automatic injection of `GEMINI_API_KEY` at runtime
  - Automatic injection of `APP_URL` with Cloud Run service URL
  - HMR (Hot Module Reloading) control via `DISABLE_HMR` environment variable

## Data Storage

**Databases:**
- Type/Provider: SQLite (embedded)
- Connection: File-based (`server/data/cafe.db`)
- Client: better-sqlite3 12.8.0
- Collections/Tables:
  - `tables` - Restaurant table configurations and statuses
  - `menu_items` - Menu items with modifiers and printer routing
  - `orders` - Active and completed orders
  - `order_items` - Individual items within orders
  - `staff` - Staff member information with roles
  - `shifts` - Staff shift scheduling
  - `inventory` - Inventory tracking with stock levels
  - `reservations` - Table reservations
  - `sales` - Completed transaction records

**File Storage:**
- Local filesystem only - Images stored as URLs/paths in database
- No cloud storage integration (S3, GCS, etc.)

**Caching:**
- In-memory Socket.IO event propagation for real-time updates
- No explicit caching layer (Redis, etc.)

## Authentication & Identity

**Auth Provider:**
- Firestore-based authentication (planned, not implemented)
- Current implementation: PIN-based staff login (hardcoded in `server/src/db.ts`)

**Current Approach:**
- Staff PIN authentication (stored in `staff.pin` field)
- No OAuth or external identity provider
- Firestore Security Rules defined in `firestore.rules` (reference/planning document)
- Rules implement role-based access (admin, manager, staff roles)

## Real-Time Communication

**WebSocket:**
- Framework: Socket.IO 4.8.3
- Server: `server/src/index.ts` initializes Socket.IO on HTTP server
- Client: `src/services/socketService.ts` connects to `http://localhost:3005`
- Events broadcasted:
  - `table_updated` - Table status changes
  - `menu_updated` - Menu item modifications
  - `orders_updated` - Order status updates
  - `staff_updated` - Staff information changes
  - `shifts_updated` - Shift schedule changes
  - `inventory_updated` - Inventory stock changes
  - `reservations_updated` - Reservation status changes
  - `sales_updated` - New sale records

## Monitoring & Observability

**Error Tracking:**
- None configured (no Sentry, Rollbar, etc.)
- Console logging only (see `server/src/index.ts` for Socket.IO and order update logs)

**Logs:**
- Console.log in server code:
  - Socket.IO connection/disconnection
  - Order item status updates (debug logging)
  - Database operation errors
- No centralized logging service (no CloudLogging, Datadog, etc.)

## CI/CD & Deployment

**Hosting:**
- Google Cloud Run (AI Studio deployment)
- Automatic deployment on code push
- Environment variables injected by AI Studio:
  - `GEMINI_API_KEY` - From user secrets
  - `APP_URL` - Cloud Run service URL
  - `DISABLE_HMR` - Set during agent edits

**CI Pipeline:**
- Not configured (no GitHub Actions, Cloud Build, etc.)
- Manual deployment via AI Studio interface

## Environment Configuration

**Required env vars:**
```
GEMINI_API_KEY          # Google Gemini API key (required for AI features)
APP_URL                 # Application base URL (injected by AI Studio)
PORT                    # Server port (optional, defaults to 3005)
DISABLE_HMR             # Disable hot module reloading (optional, set by AI Studio)
```

**Secrets location:**
- `.env` file (local development, not committed)
- AI Studio Secrets panel (production)
- Never commit `.env` or secrets to repository

**Vite Configuration:**
- `vite.config.ts` passes `GEMINI_API_KEY` to frontend via `define` plugin
- `loadEnv` reads from `.env*` files during build

## Webhooks & Callbacks

**Incoming:**
- Socket.IO events from clients (no traditional webhooks)
- REST API endpoints accept updates from frontend

**Outgoing:**
- None configured (no payment webhooks, external API callbacks, etc.)
- Could be added for payment processing, inventory notifications, etc.

## Cross-Domain Considerations

**CORS:**
- Enabled via `cors` middleware in `server/src/index.ts`
- Configuration: `cors()` with default settings (allows all origins)
- Socket.IO CORS: `{ origin: '*', methods: ['GET', 'POST', 'DELETE'] }`

**Vite Dev Server:**
- Allowed hosts: `['restopro.bosver.site']` (configured in `vite.config.ts`)
- HMR (Hot Module Reloading) disabled in AI Studio (via `DISABLE_HMR` env var)

## API Surface

**REST Endpoints:** All prefixed with `/api`

**Tables:**
- `GET /api/tables` - List all tables
- `POST /api/tables/:id/status` - Update table status
- `POST /api/tables/:id/position` - Update table coordinates
- `POST /api/tables/:id/waiter` - Assign waiter to table

**Menu:**
- `GET /api/menu` - List menu items
- `POST /api/menu` - Create menu item
- `PATCH /api/menu/:id` - Update menu item
- `DELETE /api/menu/:id` - Delete menu item

**Orders:**
- `GET /api/orders` - List active orders
- `GET /api/orders/:id` - Get specific order
- `POST /api/orders` - Create new order
- `POST /api/orders/:id/items` - Add items to order
- `POST /api/orders/:id/items/:itemId/status` - Update item status
- `DELETE /api/orders/:id/items/:itemId` - Remove item from order
- `POST /api/orders/:id/discount` - Apply discount to order

**Sales:**
- `POST /api/sales` - Record completed sale
- `GET /api/sales` - List sales records

**Staff:**
- `GET /api/staff` - List staff members
- `POST /api/staff` - Add staff member
- `PATCH /api/staff/:id` - Update staff information
- `DELETE /api/staff/:id` - Remove staff member

**Shifts:**
- `GET /api/shifts` - List shifts
- `POST /api/shifts` - Create shift
- `DELETE /api/shifts/:id` - Delete shift

**Reservations:**
- `GET /api/reservations` - List reservations
- `POST /api/reservations` - Create reservation
- `PATCH /api/reservations/:id` - Update reservation
- `POST /api/reservations/:id/status` - Update reservation status

**Inventory:**
- `GET /api/inventory` - List inventory items
- `POST /api/inventory` - Add inventory item
- `PATCH /api/inventory/:id` - Update inventory item
- `DELETE /api/inventory/:id` - Delete inventory item
- `POST /api/inventory/:id/stock` - Update stock level

**System:**
- `POST /api/seed` - Re-seed database with initial data

## Data Flow Summary

1. **Frontend → Server**: HTTP REST calls via `src/services/apiService.ts`
2. **Server → Database**: SQLite queries via better-sqlite3
3. **Server → Frontend**: Socket.IO broadcasts on data changes
4. **Frontend ↔ Server**: WebSocket for real-time updates
5. **Optional**: Google Gemini AI integration (infrastructure ready, awaiting feature implementation)

---

*Integration audit: 2025-01-13*

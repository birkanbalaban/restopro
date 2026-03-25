# Codebase Concerns

**Analysis Date:** 2025-01-15

## Security Issues

**CORS Configuration - Wildcard Origin:**
- Issue: Server allows all origins with `origin: '*'` in CORS settings
- Files: `server/src/index.ts` (line 14)
- Impact: Exposes API to cross-site request forgery attacks from any domain. In production, this is a critical security risk.
- Fix approach: Replace wildcard with explicit allowed origins. Use environment variable to configure: `origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3010'`

**PIN Authentication Lacks Rate Limiting:**
- Issue: Keypad login allows unlimited PIN guesses without delay or lockout
- Files: `src/views/KeypadLogin.tsx` (lines 22-42)
- Impact: Brute force attacks can guess 4-digit PINs (10,000 combinations) quickly. No account lockout after failed attempts.
- Fix approach: Implement server-side rate limiting on `/api/staff` endpoints, add exponential backoff after N failed attempts, store failed attempt counts in database

**PINs Stored in Plain Text:**
- Issue: Staff PINs are stored unencrypted in database
- Files: `server/src/db.ts` (staff table), `server/src/index.ts` (lines 328-334)
- Impact: Database breach exposes all staff authentication credentials
- Fix approach: Hash PINs using bcrypt before storage, update login to compare hashes

**No Input Validation on API Endpoints:**
- Issue: All endpoints accept and use request data without validation
- Files: `server/src/index.ts` (throughout, e.g., lines 56, 101, 157, 287, 329, 375, 401)
- Impact: Malformed data, null values, or injection attacks can corrupt database or cause crashes
- Fix approach: Add validation middleware, validate required fields before insert/update operations

**Sensitive Data in Error Messages:**
- Issue: Raw error messages returned to client may expose system details
- Files: `server/src/index.ts` (lines 95, 133, 152, 174, 213, 247, 395, 410, 423, 450, 465, 479, 501)
- Impact: Attacker can learn system internals from error stack traces
- Fix approach: Log full errors server-side, return generic "Something went wrong" to client in production

**SQL Injection Vulnerability in PATCH Endpoints:**
- Issue: Dynamic SQL construction with Object.keys() in update endpoints is vulnerable to injection
- Files: `server/src/index.ts` (lines 71-73, 339-341, 417-419, 473-475)
- Example: Updating `menu_items` or `staff` uses unsanitized field names: ``UPDATE staff SET ${fields}``
- Impact: Attacker can inject arbitrary SQL via field names in request body
- Fix approach: Use explicit whitelist of allowed fields for each update operation, validate against whitelist before building query

**No Authentication on Any Endpoints:**
- Issue: All API endpoints accessible without authentication or authorization checks
- Files: `server/src/index.ts` (all endpoints)
- Impact: Anyone with network access can modify orders, staff, inventory, financial records
- Fix approach: Add middleware to verify session/token, check user role for sensitive operations (manager-only for menu/staff/inventory)

## Tech Debt

**Pervasive Use of `any` Type:**
- Issue: Extensive casting to `any` throughout codebase bypasses TypeScript type safety
- Files: 
  - `server/src/index.ts`: 15 instances (lines 33, 47, 121, 123, 139, 141, 199, 204, 222, 257, 261, 318)
  - `src/views/MenuView.tsx`: 2 instances (lines 18, 333)
- Impact: Silent type errors, refactoring breaks silently, loses IDE autocomplete benefits
- Fix approach: Define proper types for database queries, use type-safe query builders or ORMs

**No Error Recovery or Retry Logic:**
- Issue: Failed database operations cause complete endpoint failure with 500 error
- Files: `server/src/index.ts` (all database operations within try/catch blocks)
- Impact: Transient database connection issues crash requests, no graceful degradation
- Fix approach: Implement exponential backoff retry logic for transient errors, distinguish between recoverable and permanent failures

**Hardcoded Configuration Values:**
- Issue: API_BASE URL hardcoded in client code
- Files: `src/services/apiService.ts` (line 3: `const API_BASE = 'http://localhost:3005/api'`)
- Impact: Breaks when deployed to different port or domain, requires code change for each environment
- Fix approach: Load from environment variables or config file

**Database Initialization Issues:**
- Issue: `seedDB()` called on every server startup, drops/recreates tables if they exist
- Files: `server/src/index.ts` (lines 23-30), `server/src/db.ts` (seedDB function)
- Impact: Production data can be lost on server restart, development/production use same code path
- Fix approach: Only seed if database is empty or explicitly triggered via API, add environment-specific initialization

**No Transaction Management for Complex Operations:**
- Issue: Order creation spans multiple statements but only some operations are wrapped in `db.transaction()`
- Files: `server/src/index.ts` (order items creation at lines 183-215 is transactional, but discount and status updates are not)
- Impact: Partial failures leave database in inconsistent state, e.g., order created but items not saved
- Fix approach: Wrap all multi-step operations in explicit transactions

**Missing Database Migrations:**
- Issue: No migration system for schema changes
- Files: `server/src/db.ts` (schema is one-time initialization)
- Impact: Difficult to evolve schema in production, no version control for schema changes
- Fix approach: Implement migration system (e.g., with Flyway or custom migration runner)

**Console Logging in Production Code:**
- Issue: Many debug console.log statements left in code
- Files: `server/src/index.ts` (lines 220, 224, 232, 238, 242, 246, 507, 512)
- Impact: Logs are verbose, performance overhead, inconsistent logging levels
- Fix approach: Use proper logging library (winston, pino) with configurable levels, remove debug logs

## Performance Bottlenecks

**N+1 Query Pattern in Orders Endpoint:**
- Issue: Fetching active orders queries database once, then queries order_items for each order individually
- Files: `server/src/index.ts` (lines 119-135)
- Problem: With 100 tables/orders, this is 101 database queries instead of 1-2
- Fix approach: Use single JOIN query to fetch orders with items in one operation

**Recalculating Order Total on Every Item Change:**
- Issue: When adding/removing items, entire order total recalculated with separate query
- Files: `server/src/index.ts` (lines 199-206, 257-258)
- Impact: O(n) behavior for each item modification, inefficient with large orders
- Fix approach: Calculate total in SQL using SUM() aggregate, only execute one calculation per request

**No Database Indexing:**
- Issue: Schema defined but no indexes on frequently queried fields
- Files: `server/src/db.ts` (no CREATE INDEX statements)
- Common queries: `orderId`, `tableId`, `status`, `menuItemId`
- Impact: Linear scans on large tables, slow queries as data grows
- Fix approach: Add indexes on foreign key columns and status fields

**Broadcast to All Clients on Every Change:**
- Issue: Every API mutation broadcasts to all connected clients
- Files: `server/src/index.ts` (lines 62, 74, 80, 114, 170-171, 207, 210, 243, 265, 278, 309-310, 333, 342, 356, 364, 379, 386, 407, 420, 437, 462, 476, 486, 498)
- Impact: With many users, this is O(n) clients notified per request, network overhead
- Fix approach: Broadcast only relevant updates (e.g., only notify clients watching that table), use room-based broadcasts

**No Pagination on List Endpoints:**
- Issue: All GET endpoints return entire dataset (tables, staff, inventory, sales, reservations)
- Files: `server/src/index.ts` (lines 40-42, 323-325, 369-371, 390-397, 445-451)
- Impact: With thousands of records, response payload is huge, loading time is slow
- Fix approach: Implement pagination with limit/offset, add filtering by status/date

## Fragile Areas

**Modifier Groups JSON Serialization:**
- Issue: modifierGroups stored as JSON strings in database, parsed/stringified on every request
- Files: `server/src/index.ts` (lines 48-51, 69), `src/views/MenuView.tsx` (lines 18-42)
- Risk: Malformed JSON crashes parsing, schema changes require manual updates, string comparison doesn't work
- Safe modification: Add validation of JSON structure, use type-safe JSON parsing, consider normalizing into separate table

**StatusTimestamps JSON Handling:**
- Issue: Timestamps tracked as JSON object string in database, multiple parse/stringify cycles
- Files: `server/src/index.ts` (lines 222-240)
- Risk: If parsing fails, item status update silently fails, state becomes inconsistent
- Safe modification: Store as separate timestamp columns or use JSON database type, validate before storing

**Order Item Status State Machine:**
- Issue: No validation of status transitions (can jump from 'new' to 'paid' or any invalid state)
- Files: `server/src/index.ts` (line 219 accepts any status)
- Risk: Kitchen display system shows invalid states, payment processing confused by invalid status
- Safe modification: Define valid state transitions, validate on update, return error for invalid transitions

**Socket.io Connection Management:**
- Issue: Connected socket handlers do nothing, no disconnect cleanup
- Files: `server/src/index.ts` (lines 506-508)
- Risk: Socket connections accumulate over time, no way to track which clients are connected
- Safe modification: Track connected users, implement disconnect handler to clean up

**Table Status Synchronization:**
- Issue: Table status can be set independently of order state (table free but order still active)
- Files: `server/src/index.ts` (lines 99-116 table status, 162-176 order creation)
- Risk: Leads to inconsistent state where order exists but table is free
- Safe modification: Enforce invariants in database constraints or business logic layer

## Missing Critical Features

**No User Session Management:**
- Problem: User login via PIN but no session created, can't identify who performed actions
- Blocks: Audit logging, accountability, user-specific features
- Impact: Can't track which staff member placed order or modified data

**No Audit Trail:**
- Problem: No record of who made what changes and when
- Blocks: Compliance, accountability, dispute resolution
- Impact: Can't investigate issues or prove actions

**No Permission System:**
- Problem: No role-based access control, manager features not restricted
- Blocks: Can't have different permissions for waiter, manager, chef roles
- Impact: All users can modify sensitive data (menu prices, staff, discounts)

**No Backup/Recovery:**
- Problem: Single SQLite database with no backup mechanism
- Blocks: Data loss scenario - can't recover from database corruption or accidental deletion
- Impact: Critical business data loss possible

**Missing Transfer Order Items Endpoint:**
- Problem: API declares `transferOrderItems` function but endpoint not implemented in server
- Files: `src/services/apiService.ts` (line 52), but no `/api/orders/:id/transfer` route
- Impact: Can't move items between tables, workaround needed

**Missing Split Payment Endpoint:**
- Problem: API declares `splitPayment` function but endpoint not implemented in server  
- Files: `src/services/apiService.ts` (line 58), but no `/api/orders/:id/split-payment` route
- Impact: Can't split checks between multiple customers

## Test Coverage Gaps

**No Unit or Integration Tests:**
- What's not tested: All business logic in API endpoints
- Files: `server/src/index.ts` (514 lines of untested code)
- Risk: Regressions go undetected, refactoring breaks features silently
- Priority: High - database logic and state transitions especially critical

**No Frontend Component Tests:**
- What's not tested: React components with complex state
- Files: `src/views/MenuView.tsx` (595 lines), `src/views/InventoryView.tsx` (502 lines), `src/views/StaffView.tsx` (452 lines)
- Risk: UI bugs in large components, state management bugs
- Priority: Medium - UI-only bugs less critical than data bugs

**No E2E Tests:**
- What's not tested: Complete user workflows (create order, pay, print)
- Risk: Integration bugs between frontend/backend
- Priority: High for production deployment

**No Validation Testing:**
- What's not tested: Input validation, error cases
- Risk: Invalid data accepted, edge cases cause crashes
- Priority: High - directly impacts data integrity

## Dependencies at Risk

**Outdated Dependency - Motion Animation Library:**
- Risk: `motion` v12.36.0 may have performance issues or security vulnerabilities
- Impact: Animation performance, memory leaks, supply chain risk
- Migration plan: Update to latest version, monitor for breaking changes

**Deprecated Pattern - CORS Wildcard:**
- Risk: Will not work in future Chrome versions with cross-site request restrictions
- Impact: API won't work from web in production
- Migration plan: Configure explicit origins immediately

**Better-SQLite3 Fork Dependency:**
- Risk: Tightly coupled to SQLite, schema changes difficult, no type safety
- Impact: Hard to migrate to PostgreSQL if needed, no query type checking
- Migration plan: Consider Drizzle ORM or Prisma for better type safety and migration support

## Scaling Limits

**Single SQLite Database:**
- Current capacity: SQLite handles ~100-1000 concurrent connections reasonably, performance degrades significantly
- Limit: Single-server deployment, no horizontal scaling possible
- Scaling path: Migrate to PostgreSQL for multi-server, connection pooling, replication

**In-Memory Socket.io Broadcasting:**
- Current capacity: Works for <100 concurrent users
- Limit: Broadcast to all clients is O(n), no client-specific subscriptions
- Scaling path: Implement Redis adapter for Socket.io, client room-based subscriptions

**No Caching Layer:**
- Current capacity: Every request hits database
- Limit: Response times degrade linearly with data size
- Scaling path: Add Redis caching for menu items, inventory, frequently accessed tables

**Data Accumulation:**
- Current capacity: Sales records accumulate indefinitely, no archiving
- Limit: Database file grows over time, queries slow down
- Scaling path: Implement data archiving, separate analytics database, partitioned tables

## Known Stability Issues

**Order Item Status Updates Can Fail Silently:**
- Symptoms: Kitchen display shows wrong status, items don't mark as ready
- Files: `server/src/index.ts` (lines 227-234 JSON parse can fail)
- Trigger: If `statusTimestamps` field has malformed JSON
- Workaround: Manually reset order status via API

**Modifier Groups Display Issues:**
- Symptoms: Menu items with modifiers don't display correctly sometimes
- Files: `src/views/MenuView.tsx` (lines 18-42 initializes from potentially undefined modifierGroups)
- Trigger: New menu items created without modifierGroups field
- Workaround: Ensure modifierGroups always defined as empty array

**Socket Connection Leaks:**
- Symptoms: Memory usage increases over time, broadcasts get slower
- Files: `server/src/index.ts` (no disconnect handler)
- Trigger: Clients disconnect without proper cleanup
- Workaround: Restart server periodically

---

*Concerns audit: 2025-01-15*

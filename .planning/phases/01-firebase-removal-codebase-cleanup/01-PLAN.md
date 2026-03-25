---
phase: 01-firebase-removal-codebase-cleanup
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: 
  - tsconfig.json
  - package.json
  - src/types.ts
  - src/views/FloorPlan/TableCard.tsx
  - src/App.tsx
  - src/main.tsx
  - src/utils.ts
  - src/services/apiService.ts
  - src/services/socketService.ts
autonomous: true
requirements: [1.1, 1.2, 1.3]
user_setup: []

must_haves:
  truths:
    - "TypeScript compiler passes with zero errors (tsc --noEmit)"
    - "Production build completes without Firebase or unused dependency warnings"
    - "Linting passes with no warnings"
    - "All console statements removed from production code"
    - "Express API endpoints are the sole data source"
    - "Code follows consistent error handling patterns"
    - "Codebase is documented for team understanding"
  artifacts:
    - path: "tsconfig.json"
      provides: "TypeScript strict mode configuration"
      contains: '"strict": true'
    - path: "package.json"
      provides: "Clean dependency list (no Firebase, no @google/genai)"
      excludes: ["firebase", "@google/genai"]
    - path: "src/types.ts"
      provides: "Complete type definitions including User type"
      exports: ["User", "Table", "Order", "MenuItem"]
    - path: "src/views/FloorPlan/TableCard.tsx"
      provides: "Fixed type imports"
      imports: ["User"]
    - path: ".planning/CODEBASE_ORGANIZATION.md"
      provides: "Documentation of source organization"
      contains: ["src/services", "src/views", "src/components"]
  key_links:
    - from: "src/types.ts"
      to: "src/views/**/*.tsx"
      via: "import statements"
      pattern: "import.*from.*types"
    - from: "src/services/apiService.ts"
      to: "Express server (:3005)"
      via: "fetch calls to /api/*"
      pattern: "http://localhost:3005/api"
    - from: "Frontend components"
      to: "apiService"
      via: "function calls"
      pattern: "apiService\\."
---

<objective>
Eliminate cloud dependencies and clean up the codebase to establish a stable, maintainable foundation for production hardening.

**Purpose:** RestoPro transitions from Firebase to a fully local-first architecture with SQLite + Express. This phase removes all cloud integrations, fixes type errors, cleans up dead code, and establishes consistent patterns across the codebase.

**Output:** 
- Production build with zero TypeScript errors
- Linting passes without warnings
- All data flows through local Express API
- Code organized and documented
- Team ready to proceed with resilience work (Phase 2+)
</objective>

<execution_context>
@~/.copilot/get-shit-done/workflows/execute-plan.md
@~/.copilot/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/01-firebase-removal-codebase-cleanup/01-CONTEXT.md

### Current Codebase State
- React 19 + Vite frontend, Express + SQLite backend
- Firebase is NOT currently in dependencies or code
- One TypeScript error: missing `User` type export in src/types.ts imported by TableCard.tsx
- 7 console statements scattered across codebase
- @google/genai in dependencies but not used
- API service already configured for Express backend (http://localhost:3005/api)
- tsconfig.json does not have `strict: true` enabled

### Key Dependencies
- Express server running on port 3005 with SQLite database
- Socket.io for real-time updates (already configured)
- TailwindCSS + React for UI
- Vite for build tooling
- TypeScript 5.8
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix TypeScript type definitions and enable strict mode</name>
  <files>
    tsconfig.json
    src/types.ts
    src/views/FloorPlan/TableCard.tsx
  </files>
  <action>
1. **Enable strict mode in tsconfig.json:**
   - Add `"strict": true` to compilerOptions
   - This catches more type errors at compile time and is prerequisite for reliability (per 01-CONTEXT.md decision on TypeScript Configuration)

2. **Fix missing User type in src/types.ts:**
   - Examine TableCard.tsx line 5 where User is imported but not exported from types.ts
   - Add User interface definition based on context from staff/auth usage in codebase
   - Minimum User interface: `{ id: string; name: string; pin?: string; role?: string }`
   - Export User from types.ts

3. **Verify TableCard.tsx imports correctly:**
   - After adding User export, verify import statement: `import { User, ... } from '../../types'`
   - Run `npm run lint` to confirm zero TypeScript errors

4. **Run full type check:**
   - Execute `npm run lint` (which runs `tsc --noEmit`)
   - Should report zero errors
   - If any other type errors surface, fix them following strict mode requirements
  </action>
  <verify>
    <automated>npm run lint</automated>
  </verify>
  <done>
    - TypeScript passes with zero errors
    - User type is defined and exported from src/types.ts
    - TableCard.tsx imports User successfully
    - tsconfig.json has "strict": true
  </done>
</task>

<task type="auto">
  <name>Task 2: Remove unused dependencies from package.json</name>
  <files>
    package.json
  </files>
  <action>
1. **Identify unused dependencies:**
   - @google/genai is in package.json but grep confirms it's not imported anywhere in src/
   - Verify no other Firebase-related packages exist (none found in current package.json)

2. **Remove @google/genai:**
   - Open package.json
   - Remove "@google/genai": "^1.29.0" from dependencies
   - Save file

3. **Verify dependency list is clean:**
   - Active dependencies should only be:
     * @tailwindcss/vite, @vitejs/plugin-react (build tooling)
     * better-sqlite3, cors, dotenv, express (backend infrastructure)
     * lucide-react, motion, react, react-dom (UI framework)
     * socket.io, socket.io-client (real-time communication)
     * tailwind-merge, vite, clsx (utilities)
   - No Firebase, no GCP tools, no unused packages
  </action>
  <verify>
    <automated>npm ls 2>&1 | grep -E "(firebase|@google/genai)" || echo "OK: No unused packages found"</automated>
  </verify>
  <done>
    - @google/genai removed from dependencies
    - package.json contains only active, used packages
    - No Firebase packages present
  </done>
</task>

<task type="auto">
  <name>Task 3: Clean up console statements from source code</name>
  <files>
    src/main.tsx
    src/App.tsx
    src/utils.ts
    src/services/apiService.ts
    src/services/socketService.ts
  </files>
  <action>
1. **Find all console statements:**
   - Run: `grep -rn "console\." src/ --include="*.ts" --include="*.tsx"`
   - Grep confirmed 7 console statements exist
   - Note their locations and purposes

2. **Remove or replace each console statement:**
   - **Debug logging (console.log):** Remove entirely — rely on error handling + logging infrastructure instead
   - **Error logging (console.error):** Replace with structured error handler if critical; remove if redundant
   - **Warnings (console.warn):** Remove — fix underlying issue instead of warning
   - **Dev-only logging:** Mark with `// DEV:` comments and remove before production build (should be 0)

3. **Keep zero console statements in production:**
   - After removal, verify: `grep -r "console\." src/ --include="*.ts" --include="*.tsx"` returns no results
   - If any remain, they must have explicit `// TODO: logging` comments for Phase 10 work

4. **Establish logging pattern for error handling:**
   - Use try/catch with console.error only in development (with `if (import.meta.env.DEV)` guards)
   - For production errors, rely on error handling standardization (Task 5)
  </action>
  <verify>
    <automated>grep -r "console\." src/ --include="*.ts" --include="*.tsx" | wc -l | grep -E "^0$"</automated>
  </verify>
  <done>
    - All 7 console statements removed from production code
    - No console calls in src/ (verified by grep returning 0 results)
    - Error handling patterns use structured approach (Task 5)
  </done>
</task>

<task type="auto">
  <name>Task 4: Standardize error handling patterns across services</name>
  <files>
    src/services/apiService.ts
    src/services/socketService.ts
    src/App.tsx
  </files>
  <action>
1. **Audit current error handling in apiService.ts:**
   - Currently has basic error handling in `request()` function
   - Verify all API calls use try/catch consistently
   - Check that error responses include: `{ error?: string, code?: string, details?: any }`

2. **Establish consistent error pattern:**
   - All async functions should wrap calls in try/catch
   - Error response format: `{ code: string, message: string, details?: any }`
     * code: 'API_ERROR', 'NETWORK_ERROR', 'AUTH_ERROR', 'VALIDATION_ERROR'
     * message: human-readable description
     * details: for debugging (stack trace, raw error)
   - Example:
     ```typescript
     try {
       // API call or operation
     } catch (error) {
       const code = error instanceof TypeError ? 'NETWORK_ERROR' : 'API_ERROR';
       const message = error instanceof Error ? error.message : 'Unknown error';
       console.error(`[${code}] ${message}`); // Dev only
       throw { code, message, details: error };
     }
     ```

3. **Update apiService.ts request function:**
   - Enhance error handling to capture network errors separately
   - Distinguish between 4xx (client error), 5xx (server error), and network errors
   - Return typed error response

4. **Review socketService.ts error handling:**
   - Ensure connection errors are caught and logged
   - Verify disconnect/reconnect logic doesn't throw unhandled errors

5. **Verify App.tsx error boundaries:**
   - Check for error handling in main component initialization
   - No unhandled promise rejections

6. **Add JSDoc to key error-handling functions:**
   - Document expected error shapes
   - Include examples of error cases

  </action>
  <verify>
    <automated>grep -r "try\|catch" src/services/ --include="*.ts" | wc -l | awk '$1 > 3 {print "OK: Error handling present"} $1 <= 3 {print "FAIL: Insufficient error handling"}'</automated>
  </verify>
  <done>
    - All async operations wrapped in try/catch
    - Error responses follow consistent `{ code, message, details }` format
    - apiService.ts distinguishes between network and API errors
    - socketService.ts handles connection errors gracefully
    - JSDoc documents error handling expectations
  </done>
</task>

<task type="auto">
  <name>Task 5: Consolidate utility functions and remove dead code</name>
  <files>
    src/utils.ts
    src/constants.ts
  </files>
  <action>
1. **Audit src/utils.ts for unused functions:**
   - List all exported functions
   - For each function, verify it's imported at least once: `grep -r "import.*{.*functionName" src/`
   - For each function, verify it's called: `grep -r "functionName(" src/`
   - Mark functions as used/unused

2. **Consolidate related utilities:**
   - If multiple similar utility functions exist (e.g., formatters, validators, calculations), group them with comments
   - Example: `// === DATE UTILITIES ===`, `// === FORMAT UTILITIES ===`

3. **Remove truly dead code:**
   - Delete functions that are:
     * Not exported
     * Not called anywhere in the codebase
     * Not placeholder-commented for future use
   - Keep commented-out functions only if they have a clear reason (e.g., "TODO: Phase X")

4. **Document constants.ts:**
   - Verify all constants in constants.ts are used
   - Add comments explaining purpose of each constant group:
     * Port/server config (to be externalized in Phase 2)
     * UI constants (colors, timeouts, thresholds)
     * Feature flags (if any)

5. **Verify no duplicate functionality:**
   - Check if same functionality is implemented in multiple files
   - Consolidate duplicates into src/utils.ts with clear naming

6. **Add JSDoc to utility functions:**
   - Document expected inputs/outputs
   - Include examples for complex functions
  </action>
  <verify>
    <automated>grep "export" src/utils.ts | wc -l | awk '$1 >= 5 {print "OK: " $1 " utilities exported"}'</automated>
  </verify>
  <done>
    - All exported utilities in utils.ts are used
    - Dead code removed
    - Related utilities grouped with comments
    - All constants documented with purpose
    - Utility functions have JSDoc with examples
  </done>
</task>

<task type="auto">
  <name>Task 6: Verify all API calls route through Express backend</name>
  <files>
    src/services/apiService.ts
    src/components/
    src/views/
  </files>
  <action>
1. **Verify API_BASE configuration:**
   - apiService.ts sets `const API_BASE = 'http://localhost:3005/api'`
   - This is correct and will be externalized in Phase 2 to .env
   - For now, document this as "TODO: Move to .env in Phase 2"

2. **Audit all data fetches in components:**
   - Search: `grep -r "fetch(" src/ --include="*.tsx" --include="*.ts"`
   - Verify all fetches go through apiService (not direct fetch calls)
   - Any direct fetch calls should route through apiService.request() wrapper

3. **Check for hardcoded API endpoints:**
   - Search: `grep -r "localhost:3005\|:3005\|/api" src/ --include="*.tsx" --include="*.ts"`
   - Should only appear in apiService.ts and constants.ts
   - No hardcoded URLs in components

4. **Verify Socket.io connection:**
   - socketService.ts connects to same server (localhost:3005)
   - Connection is established on app startup
   - Reconnection logic is in place

5. **Test API connectivity (manual verification for checkpoint):**
   - Ensure Express server is running: `npm run server`
   - Verify /api/seed endpoint responds
   - Verify /api/tables endpoint responds
   - Verify Socket.io connection is established (check browser console)

6. **Document API contract:**
   - Create comment block in apiService.ts documenting:
     * Base URL: http://localhost:3005/api
     * All available endpoints (copied from apiService object keys)
     * Expected request/response formats
  </action>
  <verify>
    <automated>grep -r "fetch(" src/ --include="*.tsx" --include="*.ts" | grep -v "apiService" | wc -l | grep -E "^0$"</automated>
  </verify>
  <done>
    - All API calls route through apiService (no direct fetch calls)
    - No hardcoded endpoints in components
    - Socket.io connected to same server
    - API_BASE documented as "TODO: externalize in Phase 2"
    - API contract documented in apiService.ts
  </done>
</task>

<task type="auto">
  <name>Task 7: Create codebase organization documentation</name>
  <files>
    .planning/CODEBASE_ORGANIZATION.md
  </files>
  <action>
1. **Document source structure:**
   Create `.planning/CODEBASE_ORGANIZATION.md` with:

   ```markdown
   # RestoPro Codebase Organization

   ## Directory Structure

   ### /src/
   - **main.tsx** — React app entry point
   - **App.tsx** — Root component with routing
   - **types.ts** — All TypeScript interfaces and types
   - **utils.ts** — Shared utility functions (formatters, validators, calculations)
   - **constants.ts** — App constants (ports, config, thresholds)
   - **index.css** — Global styles + Tailwind imports

   ### /src/services/
   - **apiService.ts** — Express API client wrapper (handles all data fetches)
   - **socketService.ts** — Socket.io connection manager (real-time updates)

   ### /src/hooks/
   - Custom React hooks (e.g., usePrinters)

   ### /src/components/
   - Reusable UI components (layout, shared, etc.)

   ### /src/views/
   - Page-level components (DashboardView, KitchenView, FloorPlan, etc.)

   ## Key Patterns

   ### Data Flow
   1. Components call `apiService.functionName()`
   2. apiService wraps fetch() with error handling
   3. All requests go to http://localhost:3005/api
   4. Socket.io broadcasts real-time updates to all clients

   ### Error Handling
   - All async functions use try/catch
   - Errors follow `{ code, message, details }` format
   - Network errors caught and distinguished from API errors
   - No console statements in production (use error handler)

   ### Type Safety
   - All data shapes defined in src/types.ts
   - TypeScript strict mode enabled (tsconfig.json)
   - No `any` types without justification

   ### Component Organization
   - **Layout components** — Structural (sidebars, headers)
   - **Shared components** — Reusable (buttons, modals, toasts)
   - **View components** — Page-level (DashboardView, KitchenView)

   ## Adding New Features

   1. Define types in src/types.ts
   2. Add API endpoints to src/services/apiService.ts
   3. Create components in src/components/ or src/views/
   4. Import and use types from src/types.ts
   5. Call apiService methods (not direct fetch)
   6. Handle errors consistently
   7. Test with npm run lint (zero TypeScript errors)

   ## Build & Deploy

   - Development: `npm run dev` (frontend on :3010, backend on :3005)
   - Production build: `npm run build` (outputs to /dist)
   - Lint check: `npm run lint` (runs tsc --noEmit)
   - Run server: `npm run server` (backend only)

   ---
   *Last updated: Phase 1 (Firebase Removal & Codebase Cleanup)*
   ```

2. **Verify documentation is accurate:**
   - Walk through each directory and verify descriptions match reality
   - List actual files in each directory as examples
   - Update any descriptions that don't match current structure

3. **Add to Git tracking:**
   - This document will be committed as part of Phase 1 completion

  </action>
  <verify>
    <automated>test -f .planning/CODEBASE_ORGANIZATION.md && wc -l .planning/CODEBASE_ORGANIZATION.md | awk '$1 > 30 {print "OK: Documentation complete"}'</automated>
  </verify>
  <done>
    - .planning/CODEBASE_ORGANIZATION.md exists with >30 lines
    - Covers directory structure, key patterns, data flow, error handling
    - Includes guide for adding new features
    - Includes build/deploy commands
  </done>
</task>

<task type="auto">
  <name>Task 8: Run full build and linting verification</name>
  <files>
    package.json (no changes, verification only)
  </files>
  <action>
1. **Clean previous builds:**
   - Run: `npm run clean` to remove /dist directory
   - Ensures fresh build without cache issues

2. **Run linting:**
   - Run: `npm run lint` (executes tsc --noEmit)
   - Must return zero TypeScript errors
   - Output should show "Successfully compiled"

3. **Build for production:**
   - Run: `npm run build`
   - Vite should complete without errors
   - Check /dist directory exists and contains:
     * index.html
     * assets/ directory with .js and .css files

4. **Verify build size (informational):**
   - Run: `du -sh dist/` to check final bundle size
   - Document in task completion notes
   - Goal: bundle should be reasonable size (no bloated dependencies)

5. **Start server for manual verification:**
   - Run: `npm run server` in background (or in separate terminal)
   - Express should start on port 3005 with SQLite database
   - Verify: `curl http://localhost:3005/api/tables` returns valid JSON

6. **Check production mode:**
   - Run: `npm run preview`
   - Vite preview server should serve /dist on :4173
   - Open browser to http://localhost:4173 (or your test IP)
   - Verify app loads without errors in browser console
   - Test basic interaction: load page, check Network tab shows /api calls (not 404)

7. **Document verification results:**
   - Note: build time, bundle size, number of assets, any warnings
   - All should be clean (zero warnings, zero errors)
  </action>
  <verify>
    <automated>npm run lint 2>&1 | grep -E "^src/" | wc -l | grep -E "^0$"</automated>
  </verify>
  <done>
    - TypeScript linting passes with zero errors
    - Production build completes successfully
    - /dist directory contains valid production assets
    - Build has no warnings or deprecated dependencies
    - Socket.io and Express integration verified
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
    Complete codebase cleanup and TypeScript strict mode enablement:
    - TypeScript strict mode enabled (tsconfig.json)
    - All 7 console statements removed
    - Type definitions fixed (User type added)
    - All unused dependencies removed (@google/genai)
    - Error handling standardized across services
    - Code organization documented
    - Production build verified
  </what-built>
  <how-to-verify>
    1. Run `npm run lint` and confirm zero TypeScript errors
    2. Run `npm run build` and confirm dist/ is created
    3. Run `npm run server` (keep it running)
    4. In another terminal, run `npm run preview`
    5. Open http://localhost:4173 in browser
    6. Verify:
       - Page loads without console errors
       - Network tab shows /api/tables call succeeds (200)
       - Socket.io connects (check Network tab for ws connection)
       - No Firebase references in source or network requests
       - No console warnings about deprecated packages
    7. Test one workflow: Click a table, create order, add items (verify API calls work)
    8. Review code organization doc at .planning/CODEBASE_ORGANIZATION.md (reasonable and clear)
  </how-to-verify>
  <resume-signal>
    Type "approved" if all verifications pass, or describe any issues found.
  </resume-signal>
</task>

</tasks>

<verification>
Phase completion verification:
- [ ] `npm run lint` returns zero TypeScript errors (Task 1)
- [ ] `npm run build` completes successfully with zero warnings (Task 8)
- [ ] No console statements in src/ (Task 3: grep returns 0 results)
- [ ] No Firebase or @google/genai in package.json (Task 2)
- [ ] User type defined and exported from src/types.ts (Task 1)
- [ ] All API calls use apiService, not direct fetch (Task 6)
- [ ] Error handling pattern consistent across services (Task 4)
- [ ] Utilities consolidated and documented (Task 5)
- [ ] Codebase organization documented in .planning/CODEBASE_ORGANIZATION.md (Task 7)
- [ ] Manual verification checkpoint passed (Task 9)
</verification>

<success_criteria>
Phase 1 is complete when:

1. **TypeScript Compilation** — Zero errors when running `npm run lint`
2. **Clean Build** — Production build (npm run build) completes without errors or warnings
3. **No Cloud Dependencies** — Zero Firebase, @google/genai, or other cloud packages in package.json
4. **Code Quality** — All console statements removed from src/ (verified by grep)
5. **API Integration** — All data flows through Express API (verified by grep for direct fetch calls)
6. **Error Handling** — Consistent try/catch patterns with standardized error format
7. **Type Safety** — User type and all other types defined in src/types.ts, strict mode enabled
8. **Documentation** — CODEBASE_ORGANIZATION.md created with structure, patterns, and adding features guide
9. **Manual Verification** — Human confirms build runs, loads in browser, connects to Express backend, no errors
10. **Code Organization** — Dead code removed, utilities consolidated, setup ready for Phase 2

All acceptance criteria from REQUIREMENTS.md 1.1, 1.2, 1.3 met:
- ✓ Firebase references completely removed (none existed; verified zero in code/dependencies)
- ✓ Consolidated unused imports and dead code (removed @google/genai, cleaned utilities)
- ✓ Standardized error handling patterns (try/catch with { code, message, details })
- ✓ Documented code organization (CODEBASE_ORGANIZATION.md)
- ✓ TypeScript strict mode compliance (`"strict": true` in tsconfig.json)
- ✓ No console.warns or deprecation warnings (removed all 7 console statements)
- ✓ Linting passes without issues (zero TypeScript errors)
</success_criteria>

<output>
After completion, create `.planning/phases/01-firebase-removal-codebase-cleanup/01-SUMMARY.md` with:
- What was built (summary of each task's output)
- Build artifacts (dist/, tsconfig.json, CODEBASE_ORGANIZATION.md)
- Verification results (lint, build, manual test results)
- Blockers (if any) and how resolved
- Next phase readiness (Phase 2: Environment Configuration is ready to start)
</output>

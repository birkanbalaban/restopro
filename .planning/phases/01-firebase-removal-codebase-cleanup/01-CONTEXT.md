# Phase 1: Firebase Removal & Codebase Cleanup - Context

**Gathered:** 2026-03-25  
**Status:** Ready for planning  
**Source:** Project initialization discussion

## Domain

This phase removes Firebase cloud integration and cleans up the codebase to establish a stable foundation for production hardening. All data operations transition to local SQLite + Express server. The app remains fully functional but with zero cloud dependency.

**Scope:**
- Remove Firebase imports and calls from all files
- Remove unused dependencies from package.json
- Clean up dead code and consolidate utilities
- Standardize error handling patterns
- Ensure TypeScript strict mode compliance
- Document code organization for team

**Out of scope this phase:**
- Performance optimization (Phase 3: SQLite optimization)
- Configuration externalization (Phase 2: .env)
- Feature additions (Phases 6+)

## Decisions

### Firebase Removal
- **Decision:** Complete removal, not conditional compilation
  - Rationale: Local-first architecture is non-negotiable; keeping Firebase code as "fallback" adds complexity
  - Outcome: All Firebase references deleted; zero fallback logic

### Data Persistence Strategy
- **Decision:** All reads/writes go to local SQLite via Express API
  - Rationale: Single source of truth; simplifies sync logic
  - Current state: Express server exists with database setup
  - Outcome: Frontend authenticates with server (no Firebase auth); all data flows through Express

### Error Handling
- **Decision:** Standardize on try/catch with consistent error response format
  - Rationale: Simplifies debugging; consistent error handling across codebase
  - Outcome: All async functions use try/catch; error responses include `{code, message, details}`

### Code Organization
- **Decision:** Keep existing src/ structure; consolidate utils, remove duplication
  - Rationale: Minimal disruption; existing structure works
  - Outcome: Flatten utility files; establish clear pattern for future additions

### TypeScript Configuration
- **Decision:** Enable `strict: true` in tsconfig.json
  - Rationale: Catches type errors at compile time; prerequisite for reliability
  - Outcome: All files must pass `tsc --noEmit`; no any types without justification

### Linting & Code Style
- **Decision:** Run existing linter; no new tools added
  - Rationale: Team already familiar with current setup
  - Outcome: Linting passes without warnings in production build

## Implementation Notes

**Firebase Files to Remove:**
- All imports: `firebase/app`, `firebase/firestore`, `firebase/auth`, etc.
- Firebase service initialization in `src/services/firebaseService.ts` (or similar)
- Firebase config constants

**Files Likely to Change:**
- `src/services/firebaseService.ts` — delete or replace with Express API client
- `src/types.ts` — remove Firebase-specific types
- `server/src/routes/*` — ensure all endpoints work without Firebase
- `package.json` — remove firebase, firebase-admin dependencies

**Testing Checklist:**
- Frontend builds with zero Firebase errors
- All API calls hit local Express endpoints
- Login/auth flow works with server auth (not Firebase)
- Data writes persist in SQLite
- Data reads return fresh data from SQLite

## the agent's Discretion

- **File organization within src/**  — Reorg as needed for clarity
- **Error handling implementation details** — Try/catch structure, logging format
- **Unused import cleanup tool** — Use existing linter or manual cleanup
- **Documentation format** — Code comments, architecture doc structure

## Deferred Ideas

- Migration of existing Firebase data (Phase 2 or later after server stabilizes)
- Backup/restore procedures (Phase 10)
- API authentication improvement (may defer if basic auth sufficient)

---
*Phase: 01-firebase-removal-codebase-cleanup*  
*Context gathered: 2026-03-25 via initialization discussion*

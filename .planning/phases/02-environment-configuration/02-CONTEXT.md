# Phase 2: Environment Configuration & Externalization - Context

**Gathered:** 2026-03-25  
**Status:** Ready for planning  
**Source:** Project initialization + Phase 1 insights

## Domain

This phase externalizes hardcoded configuration (ports, IPs, paths) into environment files. The application becomes portable and deployable to different environments (dev, staging, production) without code changes.

**Scope:**
- Create .env template with all configuration variables
- Move port configuration (3005, 3010) to .env
- Move hardcoded IPs to .env
- Support .env.local and .env.production overrides
- Implement environment detection (development, production, test)
- Document configuration setup for operations team

**Out of scope this phase:**
- Database credentials encryption (future hardening)
- Secrets management system (future, if needed)
- Configuration validation schema (keep simple for v1.0)

## Decisions

### Configuration Source
- **Decision:** Use .env files (NODE_ENV standard approach)
  - Rationale: Industry standard, simple, works with Docker/K8s
  - Outcome: All config read from process.env on startup

### Default Values
- **Decision:** Sensible defaults for development, explicit production requirements
  - Rationale: Dev can run without setup, production must be explicit
  - Outcome: .env.example shows recommended values; prod requires explicit .env

### Port Configuration
- **Decision:** Separate ports for frontend dev (3010) and backend API (3005)
  - Rationale: Matches current architecture; dev needs separate hot-reload server
  - Outcome: `VITE_PORT=3010`, `API_PORT=3005`

### Environment Detection
- **Decision:** Use NODE_ENV (production/development/test)
  - Rationale: Standard Node practice; affects logging, caching, error detail
  - Outcome: Different behavior per NODE_ENV (e.g., SQLite WAL in production)

### IP Address Configuration
- **Decision:** Store both server IP and listen address separately
  - Rationale: Server IP for client connections; listen address (0.0.0.0) for server binding
  - Outcome: `SERVER_HOST` and `LISTEN_HOST` (or similar)

### Sensitive vs Public Config
- **Decision:** All config stays in .env (no encrypted secrets v1.0)
  - Rationale: Local restaurant deployment, no external secrets needed
  - Outcome: .env is git-ignored; .env.example is tracked

## Implementation Notes

**Files to Modify:**
- `server/src/index.ts` — Read from process.env instead of hardcoded values
- `vite.config.ts` — Use VITE_* prefixed env vars
- `package.json` — Add cross-env for cross-platform support if needed
- Create `.env.example` with all variables and comments

**Configuration Variables:**
```
# Frontend/Vite
VITE_PORT=3010
VITE_API_URL=http://localhost:3005

# Backend/Express
API_PORT=3005
LISTEN_HOST=0.0.0.0
SERVER_HOST=localhost

# Database
DATABASE_PATH=./data/restopro.db

# Environment
NODE_ENV=development
DEBUG=restopro:*
```

**Testing Checklist:**
- Server starts with custom port from .env
- Frontend connects to API at configured URL
- .env.local overrides .env
- .env.production has required values
- Setup documentation matches values

## the agent's Discretion

- **Variable naming convention** — USE_CAPS_SNAKE_CASE or lowercase (standardize based on existing patterns)
- **Prefix strategy** — How to namespace frontend vs backend vars
- **Validation approach** — Warn on missing vars vs fail startup
- **Documentation format** — Inline comments vs separate CONFIG.md

## Deferred Ideas

- Environment-specific secrets (v2 with proper secrets manager)
- Configuration hot-reload on .env changes
- Configuration UI for non-technical staff (future)
- Multi-location support (v2)

---
*Phase: 02-environment-configuration*  
*Context gathered: 2026-03-25 via Phase 1 completion*

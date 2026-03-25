---
phase: 02-environment-configuration
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .env.example
  - .gitignore
  - server/src/index.ts
  - vite.config.ts
  - src/services/apiService.ts
  - .planning/docs/CONFIGURATION.md
autonomous: true
requirements: [1.2]
user_setup: []

must_haves:
  truths:
    - "Backend server starts with custom port from .env without code changes"
    - "Frontend connects to API at URL configured via VITE_API_URL"
    - ".env is git-ignored, .env.example is tracked with all variables"
    - "Default values support development without setup"
    - "Production values explicitly required (no fallback to defaults)"
  artifacts:
    - path: ".env.example"
      provides: "Template with all configuration variables and documentation"
      min_lines: 35
      contains: "API_PORT=3005"
    - path: "server/src/index.ts"
      provides: "Express server reading ports and host from process.env"
      exports: ["const port ="]
      contains: "process.env.API_PORT"
    - path: "vite.config.ts"
      provides: "Vite frontend using VITE_API_URL for API connection"
      exports: ["VITE_API_URL"]
      contains: "loadEnv"
    - path: "src/services/apiService.ts"
      provides: "API service using environment-configured endpoint"
      exports: ["API_BASE"]
      contains: "process.env.VITE_API_URL || 'http://localhost:3005'"
    - path: ".planning/docs/CONFIGURATION.md"
      provides: "Setup guide for development and production"
      min_lines: 40
  key_links:
    - from: "vite.config.ts"
      to: ".env.example"
      via: "loadEnv function"
      pattern: "loadEnv.*VITE"
    - from: "src/services/apiService.ts"
      to: ".env (frontend)"
      via: "process.env.VITE_API_URL"
      pattern: "process\\.env\\.VITE"
    - from: "server/src/index.ts"
      to: ".env (backend)"
      via: "process.env.API_PORT"
      pattern: "process\\.env\\.(API_PORT|LISTEN_HOST)"
    - from: ".gitignore"
      to: ".env"
      via: ".env entry"
      pattern: "\\.env$"
---

<objective>
Externalize all hardcoded configuration (ports, IPs, API URLs) to environment variables. This enables deployment to different environments without code changes and sets foundation for multi-server setups.

**Purpose:**
- Current hardcoded values (port 3005, 3010, API URL localhost) lock the app to one configuration
- Phase 2 makes app portable: same code runs in dev, test, production with different .env files
- Enables operations team to adjust configuration without developer involvement

**Output:**
- .env.example with all variables documented
- .env.local for development (created by developer, git-ignored)
- .env for production (created by ops, git-ignored)
- Backend reading from process.env.API_PORT, process.env.LISTEN_HOST
- Frontend reading from process.env.VITE_API_URL
- Configuration documentation for setup team
</objective>

<execution_context>
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/PROJECT.md
@.planning/phases/02-environment-configuration/02-CONTEXT.md
@.planning/phases/01-firebase-removal-codebase-cleanup/01-SUMMARY.md
</execution_context>

<context>
## Phase 1 Delivery Context

Phase 1 completed codebase cleanup, established error handling patterns, and fixed all TypeScript errors. Current state:
- ✅ Strict TypeScript mode enabled
- ✅ Socket.io reconnection logic implemented
- ✅ Error handling standardized to {code, message, details} format
- ✅ apiService is single point of API access
- ✅ Production build: 644KB, zero warnings

**Known Stubs from Phase 1** (address in Phase 2):
```
src/services/apiService.ts:9  - API_BASE hardcoded to localhost:3005
server/src/index.ts:10        - PORT hardcoded to 3005
```

## Current Code State

### Backend (server/src/index.ts)
- Express app with hardcoded port: `httpServer.listen(3005)`
- CORS allowing all origins (development only)
- No environment variable reading
- Paths hardcoded: DATABASE_PATH = './data/restopro.db'

### Frontend (vite.config.ts)
- defineConfig supports loadEnv (available but not used)
- Server port hardcoded in package.json: `vite --port=3010`
- No environment variables passed to frontend build
- HMR config exists but static

### API Service (src/services/apiService.ts)
- `const API_BASE = 'http://localhost:3005/api'` hardcoded
- Comment already notes: "TODO: Move to environment variable (.env) in Phase 2"
- Single place to change for development (but requires code change)

### .env.example
- Currently contains GEMINI_API_KEY and APP_URL from AI Studio context
- Does NOT contain RestoPro configuration variables
- Must be updated with: API_PORT, LISTEN_HOST, SERVER_HOST, VITE_PORT, VITE_API_URL, DATABASE_PATH, NODE_ENV

### .gitignore
- Does NOT currently have .env or .env.local entries
- Must add to prevent accidental commits of secrets

## Requirement Mapping

**Requirement 1.2: Environment Configuration** (from REQUIREMENTS.md)
```
Acceptance Criteria:
- [ ] Port and IP values read from environment variables ← Task 1, 2
- [ ] Default .env.example provided with sensible defaults ← Task 1
- [ ] Application starts with custom ports without code changes ← Task 2, 3, 4
- [ ] Configuration documented in setup guide ← Task 5
```

## Decisions from Phase 2 Context

| Decision | Rationale | Implementation |
|----------|-----------|-----------------|
| Use .env files (NODE_ENV standard) | Industry standard, simple, Docker/K8s compatible | Read from process.env on startup |
| Sensible dev defaults, explicit prod values | Dev runs without setup; prod requires explicit .env | .env.example has dev values; production needs override |
| Separate frontend/backend ports | Vite dev server (3010) separate from API (3005) | VITE_PORT=3010, API_PORT=3005 |
| Use NODE_ENV for environment detection | Standard Node practice affecting logging, caching | development, production, test |
| Store server IP separately from listen address | Server IP for client connections; listen address (0.0.0.0) for binding | LISTEN_HOST (server binding), SERVER_HOST (client connections) |

## Constraint: dotenv Already Installed

dotenv@17.2.3 is in package.json (installed in Phase 1 cleanup). Tasks should use this.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create comprehensive .env.example with all configuration variables</name>
  <files>.env.example</files>
  <action>
Replace current .env.example (which only has GEMINI_API_KEY and APP_URL) with comprehensive RestoPro configuration template.

Create new .env.example with:

**Header comment:** Explain this is development template, production needs explicit .env file, .env.local overrides .env

**Environment Section:**
```
NODE_ENV=development
DEBUG=restopro:*
```
With comment: "development | production | test. Affects logging verbosity and error detail."

**Frontend/Vite Section:**
```
VITE_PORT=3010
VITE_API_URL=http://localhost:3005
VITE_ENABLE_DEBUG=false
```
With comment: "VITE_* vars are available in browser via import.meta.env. Port for dev server. API_URL used by apiService."

**Backend/Express Section:**
```
API_PORT=3005
LISTEN_HOST=0.0.0.0
SERVER_HOST=localhost
```
With comments: "API_PORT: Backend server port. LISTEN_HOST: Address to bind (0.0.0.0 for all interfaces). SERVER_HOST: Address clients should connect to (localhost for local, IP for network)."

**Database Section:**
```
DATABASE_PATH=./data/restopro.db
DATABASE_BACKUP_PATH=./data/backups
```
With comment: "SQLite database location. Backup path for Phase 3."

**CORS Section (development only):**
```
CORS_ORIGIN=*
```
With comment: "Development: * (all origins). Production: https://yourdomain.com"

**Footer comment:** Explain:
- .env is git-ignored (never commit secrets/config)
- .env.example is tracked (all developers see available variables)
- .env.local overrides .env (for local development changes)
- .env.production for production deployment

Verify: File exists, all 10+ variables documented, comments explain each variable's purpose.
  </action>
  <verify>
    <automated>test -f .env.example && grep -q "API_PORT=3005" .env.example && grep -q "VITE_API_URL=" .env.example && grep -q "NODE_ENV=" .env.example && wc -l .env.example | awk '{exit ($1 >= 35 ? 0 : 1)}'</automated>
  </verify>
  <done>.env.example exists with ≥35 lines covering frontend, backend, database, environment, and CORS configuration. All variables documented with inline comments.</done>
</task>

<task type="auto">
  <name>Task 2: Update server/src/index.ts to read configuration from environment variables</name>
  <files>server/src/index.ts</files>
  <action>
Update Express server startup to read ports and host from process.env instead of hardcoded values.

**At top of file, after imports, add (before app = express()):**
```typescript
// Load environment variables - dotenv already in package.json
import dotenv from 'dotenv';
dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env' : '.env.local' });

// Configuration with defaults for development
const config = {
  apiPort: parseInt(process.env.API_PORT || '3005', 10),
  listenHost: process.env.LISTEN_HOST || '0.0.0.0',
  serverHost: process.env.SERVER_HOST || 'localhost',
  databasePath: process.env.DATABASE_PATH || './data/restopro.db',
  nodeEnv: process.env.NODE_ENV || 'development',
};
```

**Find this line:**
```typescript
httpServer.listen(3005, () => {
```

**Replace with:**
```typescript
const port = config.apiPort;
const host = config.listenHost;
httpServer.listen(port, host, () => {
  console.log(`[${config.nodeEnv}] Express server running at http://${config.serverHost}:${port}`);
});
```

**Update any hardcoded database path:**
If any database initialization hardcodes './data/restopro.db', replace with config.databasePath.

**Verify:**
- dotenv import added
- config object reads from process.env with sensible defaults
- httpServer.listen uses config.apiPort and config.listenHost
- console output shows actual port being used
- Startup log shows NODE_ENV (development/production/test)

Type safety: Ensure all config values are properly typed (port is number, host is string).
  </action>
  <verify>
    <automated>grep -q "import dotenv from 'dotenv'" server/src/index.ts && grep -q "process.env.API_PORT" server/src/index.ts && grep -q "config.listenHost" server/src/index.ts && grep -q "serverHost" server/src/index.ts</automated>
  </verify>
  <done>server/src/index.ts reads API_PORT, LISTEN_HOST, SERVER_HOST from process.env with defaults. Server starts with configured values, not hardcoded ports.</done>
</task>

<task type="auto">
  <name>Task 3: Update vite.config.ts to use VITE_* environment variables</name>
  <files>vite.config.ts</files>
  <action>
Update Vite configuration to read port from VITE_PORT environment variable instead of hardcoding in package.json script.

**Current package.json has:**
```
"dev": "vite --port=3010 --host=0.0.0.0"
```

**Update vite.config.ts server configuration:**

Add to the returned config object (in defineConfig):
```typescript
server: {
  port: parseInt(process.env.VITE_PORT || '3010', 10),
  host: '0.0.0.0',
  hmr: process.env.DISABLE_HMR !== 'true',
  allowedHosts: ['restopro.bosver.site'],
},
```

This replaces the existing server configuration.

**Update package.json script:**
Change:
```
"dev": "vite --port=3010 --host=0.0.0.0"
```

To:
```
"dev": "vite --host=0.0.0.0"
```

(Port now comes from .env via VITE_PORT)

**Verify:**
- vite.config.ts loads port from process.env.VITE_PORT
- package.json dev script no longer hardcodes port
- Port reads default 3010 if not set
- TypeScript type-safe

Note: Vite uses environment variables from .env file automatically when running (no manual dotenv.config needed like Express requires).
  </action>
  <verify>
    <automated>grep -q "VITE_PORT" vite.config.ts && grep -q "parseInt(process.env.VITE_PORT" vite.config.ts && grep "\"dev\":" package.json | grep -v "port=3010"</automated>
  </verify>
  <done>vite.config.ts reads VITE_PORT from environment. package.json dev script no longer hardcodes port 3010.</done>
</task>

<task type="auto">
  <name>Task 4: Update src/services/apiService.ts to use VITE_API_URL environment variable</name>
  <files>src/services/apiService.ts</files>
  <action>
Update apiService to read API base URL from environment variable instead of hardcoded localhost:3005.

**Find this line:**
```typescript
const API_BASE = 'http://localhost:3005/api';
```

**Replace with:**
```typescript
// API URL configured via VITE_API_URL environment variable
// Default to localhost:3005 for development
// Vite automatically makes VITE_* prefixed env vars available via import.meta.env
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3005') + '/api';
```

**Update JSDoc comment above API_BASE:**
Change:
```
* API Base URL: http://localhost:3005/api
* TODO: Move to environment variable (.env) in Phase 2
```

To:
```
* API Base URL: Configured via VITE_API_URL environment variable (defaults to http://localhost:3005)
* Phase 2: ✅ Environment-configured
```

**Verify:**
- API_BASE reads from import.meta.env.VITE_API_URL
- Fallback to http://localhost:3005 if not set
- import.meta.env is available in Vite (no manual import needed)
- JSDoc comment updated to remove TODO

Type safety: import.meta.env properties are string | undefined, so || operator properly handles fallback.
  </action>
  <verify>
    <automated>grep -q "import.meta.env.VITE_API_URL" src/services/apiService.ts && grep -q "http://localhost:3005" src/services/apiService.ts && ! grep -q "TODO.*Phase 2" src/services/apiService.ts</automated>
  </verify>
  <done>apiService.ts reads API URL from VITE_API_URL environment variable with fallback to localhost:3005.</done>
</task>

<task type="auto">
  <name>Task 5: Update .gitignore to exclude .env files</name>
  <files>.gitignore</files>
  <action>
Add entries to .gitignore to prevent accidental commits of configuration files containing sensitive data.

Add these lines to .gitignore (if not already present):
```
# Environment configuration (never commit actual .env)
.env
.env.local
.env.*.local
.env.production

# But track the template
!.env.example
```

**Verify:**
- .env is ignored (prevents committing production secrets)
- .env.local is ignored (dev configuration)
- .env.example is NOT ignored (! prefix means "track this file")
- Check file exists and contains the entries

Note: If .gitignore already has some entries, add these at end in an "Environment" section for clarity.
  </action>
  <verify>
    <automated>grep -q "^.env$" .gitignore && grep -q "!.env.example" .gitignore && ! git check-ignore .env.example 2>/dev/null</automated>
  </verify>
  <done>.gitignore includes .env, .env.local patterns. .env.example is tracked (exception to ignore rule).</done>
</task>

<task type="auto">
  <name>Task 6: Create .planning/docs/CONFIGURATION.md setup and deployment guide</name>
  <files>.planning/docs/CONFIGURATION.md</files>
  <action>
Create comprehensive configuration guide for development and production setup.

**Structure:**

**Header:** "RestoPro Configuration & Deployment Guide"
- Context: Why configuration is externalized
- Audience: Developers, DevOps, operations team

**Section 1: Development Setup**
```
### For Local Development

1. Copy .env.example to .env.local
   cp .env.example .env.local

2. Edit .env.local with your values:
   - VITE_API_URL=http://localhost:3005 (connects to local backend)
   - API_PORT=3005 (backend port)
   - VITE_PORT=3010 (frontend dev server port)

3. Start the backend server:
   npm run server

4. In another terminal, start frontend dev server:
   npm run dev

Frontend will be available at http://localhost:3010
API at http://localhost:3005
```

**Section 2: Production Deployment**
```
### For Production

1. Create .env file on production server (NOT committed to git):
   
   NODE_ENV=production
   API_PORT=3005
   LISTEN_HOST=0.0.0.0
   SERVER_HOST=192.168.1.100  (your server IP)
   VITE_API_URL=http://192.168.1.100:3005
   VITE_PORT=3010
   DATABASE_PATH=/var/lib/restopro/restopro.db

2. Build frontend for production:
   npm run build

3. Deploy dist/ to web server or serve with Express static middleware

4. Start Express backend:
   npm run server

Backend serves API at http://{SERVER_HOST}:3005
Frontend connects via VITE_API_URL
```

**Section 3: Environment Variables Reference**

Create table:
```
| Variable | Purpose | Example | Required |
|----------|---------|---------|----------|
| NODE_ENV | Application environment (affects logging, caching) | development, production, test | No (default: development) |
| API_PORT | Express backend server port | 3005 | No (default: 3005) |
| LISTEN_HOST | Address Express binds to | 0.0.0.0 (all), 127.0.0.1 (local) | No (default: 0.0.0.0) |
| SERVER_HOST | Address clients use to connect | localhost, 192.168.1.100 | No (default: localhost) |
| VITE_PORT | Frontend dev server port (npm run dev only) | 3010 | No (default: 3010) |
| VITE_API_URL | API URL frontend connects to | http://localhost:3005 | No (default: http://localhost:3005) |
| DATABASE_PATH | SQLite database file location | ./data/restopro.db | No (default: ./data/restopro.db) |
| CORS_ORIGIN | CORS allowed origins (development: *, production: domain) | * or https://yourdomain.com | No (default: *) |
```

**Section 4: Troubleshooting**

```
### Common Issues

**Frontend can't connect to API**
- Check VITE_API_URL in .env.local matches actual API location
- Check API_PORT in .env.local matches where backend is running
- Check CORS_ORIGIN allows frontend origin
- Check firewall allows connection to API_PORT

**Backend won't start**
- Check API_PORT is not already in use: lsof -i :3005
- Check LISTEN_HOST is valid (0.0.0.0 for network, 127.0.0.1 for local)
- Check NODE_ENV is valid: development, production, or test

**Config changes not taking effect**
- Remember: .env.local overrides .env
- Restart both frontend (npm run dev) and backend (npm run server)
- Vite caches env vars; hard refresh browser (Ctrl+Shift+R)
```

**Section 5: File Structure**

```
.env              (git-ignored, production/deployment config)
.env.local        (git-ignored, local development overrides)
.env.example      (tracked in git, template for all variables)
```

Verify: File exists with ≥40 lines covering setup, variables, and troubleshooting.
  </action>
  <verify>
    <automated>test -f .planning/docs/CONFIGURATION.md && grep -q "For Local Development" .planning/docs/CONFIGURATION.md && grep -q "Environment Variables Reference" .planning/docs/CONFIGURATION.md && wc -l .planning/docs/CONFIGURATION.md | awk '{exit ($1 >= 40 ? 0 : 1)}'</automated>
  </verify>
  <done>.planning/docs/CONFIGURATION.md exists with development setup, production deployment, variable reference, and troubleshooting sections (≥40 lines).</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>
Complete environment configuration system:
- .env.example with all frontend, backend, database, and environment variables
- server/src/index.ts reading ports/host from process.env
- vite.config.ts reading VITE_PORT from environment
- src/services/apiService.ts reading VITE_API_URL from environment
- .gitignore updated to exclude .env files
- CONFIGURATION.md setup guide created
  </what-built>
  <how-to-verify>
**Step 1: Create .env.local for development**
```bash
cp .env.example .env.local
# Verify file was created
ls -la .env.local
```

**Step 2: Start backend with environment variables**
```bash
npm run server
# Expected output:
# [development] Express server running at http://localhost:3005
# Server listening on 0.0.0.0:3005
```

**Step 3: In another terminal, start frontend**
```bash
npm run dev
# Expected output:
# Local: http://localhost:3010
```

**Step 4: Test frontend API connection**
- Open http://localhost:3010 in browser
- Open browser dev console (F12)
- Should NOT see connection errors in console
- If you see "failed to fetch from http://localhost:3005", verify VITE_API_URL in .env.local

**Step 5: Test with custom port**
- Create .env.local with: API_PORT=3001
- Kill server (Ctrl+C)
- Run: npm run server
- Should start on port 3001 instead of 3005
- Stop server, restore API_PORT=3005 before next step

**Step 6: Verify .gitignore works**
```bash
git status
# .env.local should NOT appear in "Untracked files"
# .env.example should appear as "Changes not staged" if modified
```

**Expected Results:**
- Backend starts with port from process.env.API_PORT (default 3005)
- Frontend dev server on port from process.env.VITE_PORT (default 3010)
- Frontend successfully connects to API
- No connection errors in browser console
- .env, .env.local are git-ignored
- .env.example is tracked
- CONFIGURATION.md accessible and helpful

If any step fails, describe the issue for correction.
  </how-to-verify>
  <resume-signal>Confirm all 6 steps passed or describe any issues encountered</resume-signal>
</task>

</tasks>

<verification>
**Requirement 1.2 Acceptance Criteria Checklist:**

After all tasks complete:

□ **Port and IP values read from environment variables**
  - Verify: `npm run server` prints port from process.env.API_PORT
  - Verify: vite.config.ts uses process.env.VITE_PORT
  - Verify: apiService.ts uses import.meta.env.VITE_API_URL

□ **Default .env.example provided with sensible defaults**
  - Verify: .env.example exists with ≥35 lines
  - Verify: Contains: API_PORT=3005, VITE_PORT=3010, VITE_API_URL=http://localhost:3005
  - Verify: Every variable has explanatory comment

□ **Application starts with custom ports without code changes**
  - Verify: API_PORT=3001 npm run server starts on 3001 (not hardcoded 3005)
  - Verify: VITE_PORT=3020 npm run dev starts on 3020 (not hardcoded 3010)
  - Verify: No code modifications needed to change ports

□ **Configuration documented in setup guide**
  - Verify: .planning/docs/CONFIGURATION.md exists
  - Verify: Development setup section with step-by-step instructions
  - Verify: Production deployment section with environment variables
  - Verify: Troubleshooting section for common issues

**Additional Verification:**

□ **Git state clean**
  - .env and .env.local are in .gitignore (never committed)
  - .env.example is tracked (committed to repo)
  - No .env files appear in git status

□ **Code quality maintained**
  - All TypeScript still passes: npm run lint
  - No console errors on startup
  - Error handling patterns unchanged

□ **Production readiness**
  - Production .env can be created without editing source code
  - NODE_ENV switches logging/behavior based on production value
  - CORS_ORIGIN configurable for production domain
</verification>

<success_criteria>
**Phase 2 is complete when:**

1. ✅ **Configuration Externalized**
   - All hardcoded ports (3005, 3010) removed from code
   - All hardcoded API URLs removed from code
   - All configuration driven by .env files

2. ✅ **Portability Enabled**
   - Application runs with different ports via .env (no recompilation)
   - Frontend connects to configured API URL (no code changes)
   - Production and development can use same codebase with different .env

3. ✅ **Documentation Complete**
   - CONFIGURATION.md covers setup from scratch
   - CONFIGURATION.md covers production deployment
   - Troubleshooting guide included for ops team

4. ✅ **Git State Correct**
   - .env and .env.local are git-ignored
   - .env.example is committed and tracked
   - No secrets in git history

5. ✅ **Acceptance Criteria Met**
   - Port values read from environment ✓
   - IP values read from environment ✓
   - .env.example provided with defaults ✓
   - Application starts with custom ports (no code changes) ✓
   - Configuration documented ✓

6. ✅ **Phase 1 Patterns Maintained**
   - TypeScript strict mode compliance: npm run lint passes
   - Error handling patterns unchanged
   - No new console statements
   - No new warnings in build output
</success_criteria>

<output>
After all tasks complete and checkpoint verified:

1. Create `.planning/phases/02-environment-configuration/02-SUMMARY.md` with:
   - What was built (6 tasks completed)
   - Files modified (.env.example, server/src/index.ts, vite.config.ts, src/services/apiService.ts, .gitignore, .planning/docs/CONFIGURATION.md)
   - Acceptance criteria verification (Requirement 1.2 fully satisfied)
   - Key decisions and patterns established
   - Metrics (configuration variables externalized, lines modified)
   - Known stubs for Phase 3 (database WAL mode, backup paths)
   - Lessons learned (why externalization matters, how .env cascades work)

2. Commit to git:
   ```bash
   cd /home/server/.gemini/antigravity/scratch/restopro
   node "$HOME/.copilot/get-shit-done/bin/gsd-tools.cjs" commit "docs(02): create execution plan" --files .planning/phases/02-environment-configuration/02-PLAN.md
   ```

3. Update .planning/ROADMAP.md:
   - Phase 2 goal: ✅ ACHIEVED (environment configuration complete)
   - Update Plan list with completion checkbox
   - Note in Phase 2: "Deliverables met: ports/IPs externalized, .env.example created, documentation complete"

4. Next step: `/gsd-execute-phase 02-environment-configuration` to run the plan
</output>

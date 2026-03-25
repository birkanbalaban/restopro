# RestoPro: Local-First POS System

## Context

RestoPro is a production-ready Point of Sale system designed for restaurant operations. The system is transitioning from Firebase (cloud) to a fully local-first architecture with SQLite + Express backend, enabling deployment on a mini-PC server in restaurant environments where cloud connectivity is unreliable.

**Current State:**
- React + Vite frontend with TailwindCSS
- Express server with SQLite database
- Socket.io for real-time updates
- Partial UI implementation for Dashboard, FloorPlan, Kitchen displays
- Payment system with partial payment support
- Firebase integration (being phased out)

**Core Problem We're Solving:**
Restaurant staff need a reliable, resilient POS system that:
1. Works offline or with intermittent connectivity
2. Syncs across multiple devices on local WiFi (5+ tablets, kitchen displays)
3. Tracks inventory with automatic stock deductions
4. Generates end-of-day financial reports
5. Handles payment operations without cloud dependencies

## What This Is

**RestoPro v1.0: Production-Ready Local-First POS**

A complete backend and frontend system for managing restaurant operations (ordering, payment, inventory, reporting) on a local server. The system operates entirely on-premises with no cloud dependency, enabling 24/7 uptime in restaurant environments with unreliable internet.

## Requirements

### Validated

- ✓ React-based UI framework — existing
- ✓ SQLite local database — existing
- ✓ Express server backbone — existing
- ✓ Socket.io real-time messaging — existing (needs stabilization)
- ✓ Payment collection workflow — existing (partial)
- ✓ Floor plan / table management UI — existing (partial)
- ✓ Kitchen display system — existing (partial)

### Active

- [ ] Production hardening: Clean up codebase, remove Firebase dependencies, eliminate technical debt
- [ ] SQLite optimization: Enable Write-Ahead Logging (WAL) mode for improved read/write performance
- [ ] Network resilience: Stabilize Socket.io reconnection logic for WiFi transitions
- [ ] Configuration management: Move hardcoded ports (3005, 3010) and IPs to .env
- [ ] Multi-device sync: Guarantee consistent state across 5+ tablets and kitchen displays on local WiFi
- [ ] Inventory tracking: Automatic stock deduction when items are ordered
- [ ] End-of-day reports: Cash/card payment summaries, top-selling items, staff efficiency (Z-Reports)
- [ ] Printer integration: Enable receipt and report printing to local printers
- [ ] Error resilience: Handle power loss, server crashes, network disconnections gracefully

### Out of Scope (v1.0)

- Cloud sync or backup — Local-only by design
- Multi-location support — Single restaurant location
- Advanced analytics beyond end-of-day reports — Z-Report only
- Payment gateway integration — Cash and card in-house only
- Customer loyalty programs — Not in v1.0
- Menu management UI — Use database directly for now

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Local-first over cloud | Cloud unreliable in restaurant environments; on-premise reduces latency and guarantees uptime | All data stays on local mini-PC, no external dependencies |
| SQLite as primary database | Lightweight, embeddable, no separate DB server required | Enables single-file backup, simple deployment |
| Socket.io for real-time updates | Handles connection drops gracefully with reconnect; standardized for web apps | Requires stable reconnection logic for WiFi roaming |
| Phase 1: Tech debt cleanup, Phase 2: Operational features | Stability is prerequisite; rushing features on fragile foundation = production failures | Week 1: cleanup/hardening, Week 2: reports/printer |
| .env configuration | Eliminates hardcoded IPs/ports; enables different environments (test, staging, production) | Config driven from environment files |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-25 after initialization*

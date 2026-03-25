# RestoPro v1.0: Roadmap

## Milestone v1.0: Production-Ready Local-First POS

Target: 2-week delivery cycle
- **Week 1:** Technical foundation (cleanup, hardening, sync stability)
- **Week 2:** Operational features (reporting, inventory, printing)

---

## Phase 1: Firebase Removal & Codebase Cleanup

**Goal:** Eliminate cloud dependencies, clean up code debt, prepare foundation for resilience work.

**Deliverables:**
- All Firebase references removed from frontend and backend
- Unused dependencies pruned
- TypeScript strict mode compliance
- Code organized and documented

**Definition of Done:**
- Zero Firebase errors in build
- Linting passes with no warnings
- Build size reduced
- Team understands new code organization

---

## Phase 2: Environment Configuration & Externalization

**Goal:** Move hardcoded values to configuration, enable deployment flexibility.

**Deliverables:**
- Port and IP configuration via .env
- Support for .env.local and .env.production
- .env.example created with defaults
- Configuration documentation

**Definition of Done:**
- Application runs with custom port/IP without code changes
- .env is git-ignored, .env.example is tracked
- Setup guide updated

---

## Phase 3: SQLite Optimization & Database Hardening

**Goal:** Optimize database performance, enable Write-Ahead Logging, ensure data integrity.

**Deliverables:**
- WAL mode enabled
- Journal mode configured for resilience
- Database performance tested
- Backup/recovery procedures documented

**Definition of Done:**
- WAL mode verified in production
- Read/write performance improved by ≥20%
- Corruption recovery tested
- Runbooks documented

---

## Phase 4: Socket.io Reconnection Logic & WiFi Roaming

**Goal:** Stabilize real-time updates, handle network transitions gracefully.

**Deliverables:**
- Robust reconnection logic for WiFi transitions
- Message queuing during disconnection
- Heartbeat/ping-pong implementation
- Testing with 5+ simultaneous clients

**Definition of Done:**
- Device roaming between WiFi APs without data loss
- Auto-reconnect within 5 seconds
- Message queue prevents message loss
- Tested with 5 tablets + 2 kitchen displays

---

## Phase 5: Multi-Device State Synchronization

**Goal:** Ensure all tablets and kitchen displays stay in sync.

**Deliverables:**
- Order state sync across all devices
- Payment state sync across all devices
- Kitchen display sync
- Conflict resolution for simultaneous updates

**Definition of Done:**
- Order changes propagate to all devices in <1 second
- No duplicate orders or orphaned payments
- All devices converge to same state automatically
- Manual testing with 5+ devices passes

---

## Phase 6: Inventory Tracking & Automatic Stock Deduction

**Goal:** Track inventory, prevent over-ordering, support partial item deductions.

**Deliverables:**
- Stock deduction on order placement
- Item categories tracked
- Out-of-stock prevention
- Partial deductions supported (e.g., meat weight tracking)
- Low-stock alerts

**Definition of Done:**
- Stock decremented immediately on order
- Out-of-stock items disabled in menu
- Kitchen view shows current stock
- Inventory reports accurate at end-of-day

---

## Phase 7: End-of-Day Financial Reporting (Z-Reports)

**Goal:** Generate accurate financial reports for reconciliation.

**Deliverables:**
- Daily sales totals by payment method
- Cash/card payment breakdown
- Discrepancy detection
- Report timestamping and audit trail

**Definition of Done:**
- Z-Report shows total sales and payment breakdown
- Reconciliation checks pass
- Report accurate for each day
- Audit trail maintained

---

## Phase 8: Top-Selling Items & Staff Efficiency Reports

**Goal:** Provide operational analytics for business review.

**Deliverables:**
- Top-selling items ranking by volume and revenue
- Staff efficiency metrics (sales per staff member)
- Time period filtering (today, week, month)

**Definition of Done:**
- Reports show top 10 items correctly
- Revenue calculations accurate
- Staff metrics tracked reliably
- Filters work as expected

---

## Phase 9: Printer Integration & Receipt Printing

**Goal:** Enable receipt and report printing to local printers.

**Deliverables:**
- Kitchen receipt printing
- POS receipt printing
- Printer error handling
- Print queue for offline printer recovery

**Definition of Done:**
- Receipts print correctly formatted
- Printer disconnection doesn't crash system
- Print queue works when printer reconnects
- Multiple printers can be configured

---

## Phase 10: Power Loss Recovery & Crash Resilience

**Goal:** Protect against data loss during power loss or crashes.

**Deliverables:**
- Incomplete order detection on startup
- Recovery UI for incomplete transactions
- Automatic state reconstruction
- Crash logging and error diagnostics

**Definition of Done:**
- No data loss after power failure
- System restarts cleanly
- Incomplete orders visible for recovery/cancellation
- Error logs help with debugging

---

## Phase 11: End-to-End Testing & Hardening

**Goal:** Comprehensive testing of all features, edge cases, and resilience scenarios.

**Deliverables:**
- Full functional test coverage
- Network failure scenarios tested
- Power loss scenarios tested
- Load testing with 5+ devices
- Documentation of known limitations

**Definition of Done:**
- All acceptance criteria met
- Edge cases tested and handled
- Runbooks and troubleshooting guides complete
- Team confident in production readiness

---

## Phase 12: Documentation & Team Training

**Goal:** Ensure team can operate, maintain, and deploy the system.

**Deliverables:**
- Setup and deployment guide
- Operation runbook
- Troubleshooting guide
- Staff training materials
- Architecture documentation

**Definition of Done:**
- Team can set up system from scratch
- Team understands troubleshooting steps
- Training completed
- All documentation reviewed and approved

---

## Rollout Criteria

Before marking v1.0 complete:

- [ ] All 12 phases delivered
- [ ] Production hardening complete
- [ ] Multi-device sync stable (5+ devices tested)
- [ ] Reporting and inventory accurate
- [ ] Recovery procedures tested
- [ ] Documentation complete
- [ ] Team trained
- [ ] 7-day stability test passed (24/7 uptime, no data loss)

---

## Notes

- Phases 1-5 represent Week 1 focus (technical foundation)
- Phases 6-9 represent Week 2 focus (operational features)
- Phases 10-12 are validation and handoff
- Fine granularity allows parallel execution within each week
- Checkpoint: After Phase 5, operational features can proceed in parallel

---
*Last updated: 2026-03-25 during project initialization*

# RestoPro v1.0: Requirements & Acceptance Criteria

## Functional Requirements

### 1. Production Hardening & Technical Debt Cleanup

**Requirement 1.1: Codebase Cleanup**
- [ ] Remove Firebase dependencies from codebase
- [ ] Consolidate unused imports and dead code
- [ ] Standardize error handling patterns
- [ ] Document code organization and conventions

**Acceptance Criteria:**
- Firebase references completely removed from frontend and backend
- TypeScript strict mode compliance
- No console.warns or deprecation warnings in production build
- Linting passes without issues

**Requirement 1.2: Environment Configuration**
- [ ] Move hardcoded port values (3005, 3010) to .env
- [ ] Move hardcoded IP addresses to .env configuration
- [ ] Support .env.local and .env.production overrides
- [ ] Document all configuration variables

**Acceptance Criteria:**
- Port and IP values read from environment variables
- Default .env.example provided with sensible defaults
- Application starts with custom ports without code changes
- Configuration documented in setup guide

**Requirement 1.3: SQLite Optimization**
- [ ] Enable Write-Ahead Logging (WAL) mode for SQLite
- [ ] Configure journal mode for resilience
- [ ] Test database performance with typical query loads
- [ ] Document backup/recovery procedures

**Acceptance Criteria:**
- WAL mode enabled and verified in production
- Read/write performance improved by at least 20%
- Database corruption recovery tested
- Backup procedures documented

### 2. Network & Multi-Device Sync

**Requirement 2.1: Socket.io Stability**
- [ ] Implement robust reconnection logic for WiFi transitions
- [ ] Handle network disconnections gracefully
- [ ] Queue messages during disconnection and replay on reconnect
- [ ] Implement heartbeat/ping-pong for dead connection detection
- [ ] Test with 5+ simultaneous client connections

**Acceptance Criteria:**
- Device can roam between WiFi APs without data loss
- Reconnection happens automatically within 5 seconds
- No message loss during transitions
- Tablet stays in sync with server state
- Tested with 5 tablets + 2 kitchen displays simultaneously

**Requirement 2.2: Multi-Device State Consistency**
- [ ] Sync order state across all tablets
- [ ] Sync payment state across all devices
- [ ] Sync kitchen display updates across all displays
- [ ] Conflict resolution for simultaneous updates
- [ ] Verify all devices show same state after sync

**Acceptance Criteria:**
- Order changes on any tablet reflected on all devices within 1 second
- Kitchen display updates propagate to all kitchen displays
- No duplicate orders or orphaned payments
- All devices converge to same state automatically

### 3. Inventory Management

**Requirement 3.1: Inventory Tracking**
- [ ] Deduct stock automatically when order is placed
- [ ] Track inventory by item and category (Meat, Vegetables, Dry Goods, etc.)
- [ ] Prevent orders when stock < 1 unit
- [ ] Support partial item deductions (e.g., 1 item uses 200g of meat)

**Acceptance Criteria:**
- Stock decremented immediately when order confirmed
- Out-of-stock items disabled in menu
- Kitchen view shows current stock levels
- Inventory reports accurate at end-of-day

**Requirement 3.2: Inventory Low-Stock Alerts**
- [ ] Alert when item falls below minimum threshold
- [ ] Highlight low-stock items in kitchen display
- [ ] Log stock depletion events for auditing

**Acceptance Criteria:**
- Alert triggers at configurable threshold
- Kitchen staff sees alert prominently
- Audit log shows all stock movements

### 4. End-of-Day Reporting

**Requirement 4.1: Daily Financial Report (Z-Report)**
- [ ] Calculate total sales by payment method (cash, card)
- [ ] Generate payment method breakdown (cash/card totals)
- [ ] Include discrepancy detection (expected vs. actual)
- [ ] Timestamp and sign report

**Acceptance Criteria:**
- Z-Report shows total sales and payment breakdown
- Reconciliation checks pass
- Report generated accurately for each day
- Audit trail maintained

**Requirement 4.2: Top-Selling Items Report**
- [ ] Rank items by quantity sold
- [ ] Calculate revenue by item
- [ ] Filter by time period (today, week, month)

**Acceptance Criteria:**
- Report shows top 10 items by sales volume
- Revenue calculations accurate
- Filters work correctly

**Requirement 4.3: Staff Efficiency Report**
- [ ] Track sales by server/staff member
- [ ] Calculate average transaction time
- [ ] Show items processed per staff member

**Acceptance Criteria:**
- Staff sales tracked accurately
- Efficiency metrics calculated correctly
- Data supports staff performance review

### 5. Printer Integration

**Requirement 5.1: Receipt Printing**
- [ ] Print order receipt to kitchen printer
- [ ] Print payment receipt to POS printer
- [ ] Handle printer connection errors gracefully
- [ ] Queue prints if printer unavailable

**Acceptance Criteria:**
- Receipt prints correctly formatted
- Payment receipt matches payment details
- Printer errors don't crash system
- Print queue works when printer reconnects

**Requirement 5.2: Report Printing**
- [ ] Print Z-Report to report printer
- [ ] Print inventory reports
- [ ] Support multiple printer configurations

**Acceptance Criteria:**
- Reports print with correct formatting
- Headers and totals displayed correctly
- Multiple printers can be configured

### 6. Error Resilience & Data Recovery

**Requirement 6.1: Power Loss Recovery**
- [ ] Detect incomplete orders/transactions on startup
- [ ] Provide recovery UI for incomplete orders
- [ ] Automatic state reconstruction from database

**Acceptance Criteria:**
- System restarts cleanly after power loss
- No data corruption or loss
- Staff can see what was in progress
- Can resume or cancel incomplete orders

**Requirement 6.2: Crash Recovery**
- [ ] Log application state before critical operations
- [ ] Recover gracefully from database errors
- [ ] Provide error messages for debugging

**Acceptance Criteria:**
- Crashes don't cause data loss
- Error logs help debug issues
- System recovers automatically where possible

## Non-Functional Requirements

**Performance:**
- Response time for order placement < 500ms
- Inventory update propagation < 1 second
- SQLite query response < 100ms for typical queries
- Support 5+ simultaneous users

**Reliability:**
- 99.9% uptime on local server (no cloud dependency)
- Zero data loss on power loss (database integrity)
- Graceful degradation for network issues

**Maintainability:**
- Clear code organization and naming conventions
- Documented architecture decisions
- Setup and deployment guides
- Error logging and monitoring

**Security:**
- All data stays on-premises (no external calls)
- API rate limiting to prevent abuse
- Input validation on all endpoints
- No sensitive data in logs

## Success Criteria for v1.0

- [ ] All production hardening complete (Firebase removed, config externalized, SQLite optimized)
- [ ] Multi-device sync stable with 5+ devices
- [ ] Inventory auto-deductions working
- [ ] Z-Reports generating accurately
- [ ] Printer integration functional
- [ ] No data loss on power failure
- [ ] 24/7 stability demonstrated in test environment
- [ ] Setup and operation documented
- [ ] Team trained and confident in deployment

---
*Last updated: 2026-03-25 during project initialization*

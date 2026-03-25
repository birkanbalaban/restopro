# Testing Patterns

**Analysis Date:** 2026-03-25

## Test Framework

**Runner:**
- Vitest 4.1.0
- Config: No dedicated `vitest.config.ts` found; uses default Vitest configuration
- Installed alongside: `@vitest/coverage-v8` for coverage reporting

**Assertion Library:**
- Not detected in dependencies; Vitest uses built-in assertion/expect API
- Compatible with standard Jasmine matchers

**Run Commands:**
```bash
npm test              # Run all tests (vitest run)
npm run test:coverage # Run tests with coverage report
```

**Current Status:**
- **No test files detected** in the codebase (`src/**/*.test.*`, `src/**/*.spec.*`)
- Testing infrastructure is configured but not yet in use
- This indicates an opportunity to establish testing patterns from scratch

## Test File Organization

**Recommended Location:**
- Co-located with source files (not separated)
- Pattern: `[FileName].test.tsx` for React components
- Pattern: `[fileName].test.ts` for services/utilities
- Structure: Mirror `src/` directory structure in parallel test files

**Example structure (to be established):**
```
src/
├── components/
│   ├── shared/
│   │   ├── Toast.tsx
│   │   └── Toast.test.tsx
│   └── layout/
│       ├── SidebarItem.tsx
│       └── SidebarItem.test.tsx
├── services/
│   ├── apiService.ts
│   ├── apiService.test.ts
│   ├── socketService.ts
│   └── socketService.test.ts
├── hooks/
│   ├── usePrinters.ts
│   └── usePrinters.test.ts
└── views/
    ├── DashboardView.tsx
    └── DashboardView.test.tsx
```

## Test Structure

**Recommended Suite Organization:**
Based on codebase patterns, follow this structure:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SidebarItem } from './SidebarItem';

describe('SidebarItem Component', () => {
  describe('Rendering', () => {
    it('should render with label when not collapsed', () => {
      // test
    });

    it('should hide label when collapsed', () => {
      // test
    });
  });

  describe('User Interactions', () => {
    it('should call onClick handler when clicked', () => {
      // test
    });
  });

  describe('Styling', () => {
    it('should apply active styles when active prop is true', () => {
      // test
    });
  });
});
```

**Patterns to Establish:**

1. **Setup Pattern:**
   ```typescript
   beforeEach(() => {
     // Reset mocks, clear DOM, initialize test data
   });

   afterEach(() => {
     // Cleanup resources
   });
   ```

2. **Teardown Pattern:**
   - Use `afterEach` to clear mocks and state
   - Clean up timers and event listeners (note: `App.tsx` uses many event listeners for session auto-lock)

3. **Assertion Pattern:**
   - Use Vitest's built-in expect: `expect(...).toBe(...)`, `expect(...).toHaveBeenCalled()`
   - Screen queries for component testing: `screen.getByRole()`, `screen.getByText()`

## Mocking

**Framework:** Vitest's built-in `vi` module

**Recommended Mocking Patterns:**

1. **Service Mocking:**
   ```typescript
   import { vi } from 'vitest';
   import * as apiService from '../services/apiService';

   vi.mock('../services/apiService', () => ({
     apiService: {
       getTables: vi.fn(() => Promise.resolve([])),
       getMenuItems: vi.fn(() => Promise.resolve([])),
       // ... mock other methods
     }
   }));
   ```

2. **Socket Service Mocking:**
   ```typescript
   vi.mock('../services/socketService', () => ({
     socketService: {
       connect: vi.fn(),
       on: vi.fn(),
       off: vi.fn(),
       emit: vi.fn()
     }
   }));
   ```

3. **React Hook Mocking:**
   ```typescript
   vi.mock('../hooks/usePrinters', () => ({
     usePrinters: vi.fn(() => ({
       printers: [],
       addPrinter: vi.fn(),
       updatePrinter: vi.fn(),
       deletePrinter: vi.fn()
     }))
   }));
   ```

4. **Module Mocking for localStorage:**
   ```typescript
   const mockLocalStorage = {
     getItem: vi.fn(),
     setItem: vi.fn(),
     removeItem: vi.fn(),
     clear: vi.fn()
   };
   global.localStorage = mockLocalStorage as any;
   ```

**What to Mock:**
- External API calls (`apiService.*` methods)
- Socket.io connections and events (`socketService.*`)
- localStorage/sessionStorage operations
- Timer functions when testing session auto-lock logic
- Third-party library calls (e.g., motion/react, lucide-react icons)

**What NOT to Mock:**
- Core React hooks (useState, useEffect) — test through component behavior
- CSS utilities (`cn` function) — use real implementation
- Component children and prop behavior (test integration)
- Type imports (never mock types)

## Test Data & Fixtures

**Recommended Fixture Organization:**

Create `src/__fixtures__/` or `src/__mocks__/` directory for shared test data:

```typescript
// src/__fixtures__/tables.fixture.ts
import { Table } from '../types';

export const mockTables: Table[] = [
  {
    id: 't1',
    name: 'Test Table 1',
    status: 'free',
    capacity: 4,
    section: 'Test Section',
    x: 100,
    y: 100
  },
  {
    id: 't2',
    name: 'Test Table 2',
    status: 'occupied',
    capacity: 2,
    section: 'Test Section',
    x: 200,
    y: 100,
    currentOrderTotal: 250
  }
];

// src/__fixtures__/menu.fixture.ts
import { MenuItem } from '../types';

export const mockMenuItems: MenuItem[] = [
  {
    id: 'm1',
    name: 'Test Dish',
    category: 'Mains',
    price: 100,
    description: 'Test description',
    image: 'test.jpg',
    isAvailable: true
  }
];

// src/__fixtures__/staff.fixture.ts
import { Staff } from '../types';

export const mockStaff: Staff[] = [
  {
    id: 's1',
    name: 'Test Manager',
    role: 'manager',
    status: 'active',
    lastActive: 'now',
    avatar: 'avatar.jpg',
    pin: '1234'
  }
];
```

**Fixture Location:**
- Path: `src/__fixtures__/` or `src/__mocks__/` directory
- Import in test files: `import { mockTables } from '../__fixtures__/tables.fixture'`
- Keep fixtures close to types they represent

## Coverage

**Requirements:** 
- Not enforced currently; no coverage thresholds configured

**View Coverage:**
```bash
npm run test:coverage
```

**Coverage Output:**
- Outputs to console with line-by-line coverage
- HTML report generated (location: `coverage/` directory)
- View in browser: open `coverage/index.html`

**Recommended Targets (when enforcing):**
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

## Test Types

**Unit Tests:**
- **Scope:** Individual functions, utilities, components in isolation
- **Approach:** Mock external dependencies, test single responsibility
- **Examples:**
  - Service methods: `apiService.getTables()` returns correct type with mocked fetch
  - Utility functions: `cn()` merges classes correctly
  - Custom hooks: `usePrinters()` loads from localStorage and manages state
  - Components: `Toast` renders with correct message and closes on action

**Integration Tests:**
- **Scope:** Multiple components/services working together
- **Approach:** Use real instances where possible, mock external boundaries (API, sockets)
- **Examples:**
  - `FloorPlanView` with mocked API but real local state management
  - `App` component with mocked socket service but real view composition
  - Order flow: create order → add items → update status
  - Session management: auto-lock triggers after 5 minutes of inactivity

**E2E Tests:**
- **Framework:** Not currently configured; would require Playwright, Cypress, or similar
- **Approach:** Full application flow testing through UI
- **Not used** in this project yet; could be added later for critical user flows

## Common Patterns

**Async Testing:**

Vitest pattern for async operations (using async/await):
```typescript
it('should fetch tables on mount', async () => {
  const mockTables = [{ id: 't1', name: 'Table 1' }];
  vi.mocked(apiService.getTables).mockResolvedValue(mockTables);

  render(<FloorPlanView { ...props } />);

  // Wait for async operation to complete
  await waitFor(() => {
    expect(apiService.getTables).toHaveBeenCalled();
  });

  // Assert rendered result
  expect(screen.getByText('Table 1')).toBeInTheDocument();
});
```

**Testing Promise.all patterns:**
```typescript
it('should fetch all initial data', async () => {
  const mockData = {
    tables: [],
    menuItems: [],
    staff: [],
    inventory: [],
    reservations: [],
    sales: [],
    shifts: []
  };

  vi.mocked(apiService.getTables).mockResolvedValue(mockData.tables);
  vi.mocked(apiService.getMenuItems).mockResolvedValue(mockData.menuItems);
  // ... mock all Promise.all results

  // Component should resolve all promises
  // Assert all setState calls were made
});
```

**Error Testing:**

Testing error paths (common in catch blocks):
```typescript
it('should handle API errors gracefully', async () => {
  const errorMessage = 'Network error';
  vi.mocked(apiService.getTables).mockRejectedValue(
    new Error(errorMessage)
  );

  const { getByRole } = render(<FloorPlanView { ...props } />);

  // Wait for error handling
  await waitFor(() => {
    expect(console.error).toHaveBeenCalledWith(
      'Failed to fetch tables:',
      expect.any(Error)
    );
  });
});
```

**Testing Error instanceof checks:**
```typescript
it('should extract error message correctly', async () => {
  const customError = new Error('Custom message');
  vi.mocked(apiService.updateOrderItemStatus).mockRejectedValue(customError);

  // Component uses: error instanceof Error ? error.message : 'Unknown error'
  // Assert showToast called with 'Custom message'
});
```

**State Update Testing (React):**
```typescript
it('should update order draft state', async () => {
  const { getByRole } = render(<FloorPlanView { ...props } />);

  const addButton = getByRole('button', { name: /add item/i });
  fireEvent.click(addButton);

  // Assert state updated
  expect(screen.getByText(/1 item in draft/i)).toBeInTheDocument();
});
```

**Event Listener Testing (like session auto-lock):**
```typescript
it('should reset session timer on user activity', async () => {
  vi.useFakeTimers();
  
  const { getByRole } = render(<App />);

  // Simulate inactivity
  vi.advanceTimersByTime(5 * 60 * 1000); // 5 minutes

  // Assert session locked (currentStaff = null)
  expect(screen.getByText(/login/i)).toBeInTheDocument();

  vi.useRealTimers();
});
```

**Socket Event Testing:**
```typescript
it('should update tables when socket emits table_updated', async () => {
  let socketCallback: Function;
  
  vi.mocked(socketService.on).mockImplementation((event, cb) => {
    if (event === 'table_updated') socketCallback = cb;
  });

  render(<App />);

  // Trigger socket event
  socketCallback?.();

  // Assert getTables was called
  await waitFor(() => {
    expect(apiService.getTables).toHaveBeenCalled();
  });
});
```

## Testing Dependencies to Add

When establishing tests, these packages should be added:

```json
{
  "devDependencies": {
    "@testing-library/react": "^14.x",
    "@testing-library/jest-dom": "^6.x",
    "@testing-library/user-event": "^14.x",
    "@vitest/ui": "^4.x",
    "jsdom": "^23.x"
  }
}
```

**Configuration needed (`vite.config.ts` update):**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts']
  }
});
```

**Setup file (`src/test/setup.ts`):**
```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.matchMedia for responsive design tests
global.matchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
});
```

---

*Testing analysis: 2026-03-25*

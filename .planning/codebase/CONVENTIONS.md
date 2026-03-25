# Coding Conventions

**Analysis Date:** 2026-03-25

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `DashboardView.tsx`, `SidebarItem.tsx`, `Toast.tsx`)
- Utilities and services: camelCase (e.g., `apiService.ts`, `socketService.ts`, `usePrinters.ts`)
- Type definitions: Single file `types.ts` with all export types and interfaces
- Constants: Single file `constants.ts` containing arrays of static data

**Functions:**
- Event handlers: `handle[Action]` pattern (e.g., `handleLogout`, `handleAddItem`, `handleDeleteTable`)
- API service methods: camelCase with clear operation names (e.g., `getTables`, `addMenuItem`, `updateOrderItemStatus`)
- Custom hooks: `use[Feature]` pattern (e.g., `usePrinters`)
- Helper functions: camelCase with descriptive verbs (e.g., `getTimestamp`, `getDayName`, `getTransferTarget`)
- Broadcast functions: `broadcast` for Socket.io emission
- Socket event callbacks: inline lambdas or named functions, often use array parameter patterns for tuple destructuring

**Variables:**
- State variables: camelCase (e.g., `activeTab`, `currentStaff`, `isSidebarCollapsed`)
- Boolean prefixes: `is`, `has`, `are` (e.g., `isManager`, `isLoading`, `isAddingItem`)
- Record/Map variables: pluralized or with type suffix (e.g., `soldItemsMap`, `currentModifiers`)
- Collection variables: pluralized (e.g., `tables`, `orders`, `staff`, `printers`)
- Temporary/destructured variables: short names acceptable in scoped contexts (e.g., `t`, `m`, `s` in Promise.all destructuring)

**Types:**
- Exported types as union literals (e.g., `export type TableStatus = 'free' | 'occupied' | 'bill-requested' | 'reserved'`)
- Exported interfaces with clear domain names (e.g., `MenuItem`, `OrderItem`, `InventoryItem`, `Staff`)
- Component-scoped interfaces: `Props` suffix (e.g., `MenuSelectorProps`, `TableCardProps`, `DraftSidebarProps`)
- Status enums: specific status type names (e.g., `TableStatus`, `Order['status']`, `Staff['role']`)

## Code Style

**Formatting:**
- No explicit formatter configured in repository
- Line length: varies, no strict limit observed (some lines exceed 120 characters)
- Indentation: 2 spaces (TypeScript/React files)
- Semicolons: Used throughout all files (required in TypeScript)
- Trailing commas: Present in multiline structures

**Linting:**
- TypeScript with `tsc --noEmit` for type checking
- No ESLint configuration detected
- No Prettier configuration detected
- Source files pass TypeScript compilation

**JSDoc/TSDoc:**
- Minimal JSDoc usage observed
- Comments used primarily for section organization (e.g., `// API & Socket Services`, `// Data State`)
- Property documentation in types (e.g., `/** External supplier name (e.g. 'Şef Pasta A.Ş.') */`)
- Inline comments explain specific logic: `// Try DB staff first`, `// Local Demo Mode`

## Import Organization

**Order:**
1. React and third-party libraries (motion, lucide-react, clsx, etc.)
2. Internal services (apiService, socketService)
3. Types and constants from local files
4. Components (layout, shared, view-specific)
5. Custom hooks

**Path Aliases:**
- `@/*` → maps to project root (configured in `tsconfig.json`)
- Rarely used in current codebase; most imports use relative paths like `'./utils'`, `'../../types'`
- Aliased imports preferred for cross-directory access when needed

**Example from `src/App.tsx`:**
```typescript
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './utils';
import { apiService } from './services/apiService';
import { socketService } from './services/socketService';
import { Toast } from './components/shared/Toast';
import { Table, MenuItem, Staff } from './types';
import { TABLES, MENU_ITEMS, STAFF } from './constants';
import { SidebarItem } from './components/layout/SidebarItem';
```

## Error Handling

**Patterns:**
- Try-catch blocks for async operations and risky logic
- Generic catch-all in some cases: `} catch { }` (empty catch for non-critical operations)
- Error message extraction: `error instanceof Error ? error.message : 'Unknown error'`
- API errors: extracted from response JSON: `throw new Error(error.error || 'API Request failed')`
- User-facing errors shown via Toast component with type 'error'
- Console logging in catch blocks for debugging: `console.error('[Area] Description:', error)`

**Example from `src/App.tsx`:**
```typescript
const fetchData = async () => {
  try {
    const [t, m, s, i, r, sl, sh] = await Promise.all([
      apiService.getTables(),
      apiService.getMenuItems(),
      apiService.getStaff(),
      apiService.getInventory(),
      apiService.getReservations(),
      apiService.getSales(),
      apiService.getShifts()
    ]);
    setTables(t);
    // ... state updates
  } catch (error) {
    console.error('Failed to fetch initial data:', error);
  }
};
```

**Example from `src/views/KitchenView.tsx`:**
```typescript
try {
  const msg = await apiService.updateOrderItemStatus(orderId, item.id, newStatus);
  console.log(`[Kitchen] Changing status: Item ${itemId} in Order ${orderId} -> ${newStatus}`);
} catch (error) {
  console.error('[Kitchen] Status change failed:', error);
  const msg = error instanceof Error ? error.message : 'Bilinmeyen hata';
  showToast(msg, 'error');
}
```

**Silent failures in non-critical code:**
- Inventory view: `try { await apiService.updateInventoryStock(...); } catch { }`
- Hook initialization: `} catch { return DEFAULT_PRINTERS; }`

## Logging

**Framework:** `console` object directly

**Patterns:**
- `console.log()` for informational messages
- `console.error()` for error reporting
- Contextual prefixes in brackets: `[App]`, `[Kitchen]`, `[FloorPlan]` for source identification
- Examples:
  - `console.log('[App] Fetching orders...')`
  - `console.log('[Kitchen] Changing status: Item ${itemId} in Order ${orderId} -> ${newStatus}')`
  - `console.error('Failed to fetch initial data:', error)`

**When to log:**
- Connection events (Socket.io: 'Connected to local server', 'Disconnected')
- Data fetch operations and results
- State changes in critical flows
- Error conditions with user impact

## Comments

**When to Comment:**
- Section headers for logical groupings (e.g., `// API & Socket Services`, `// Session Auto-Lock`)
- Complex logic explanations (e.g., `// 5 minutes` for timeout duration)
- Mode descriptions (e.g., `// Local seed call`, `// Demo Mode`)
- Inline explanations for non-obvious conditional logic

**JSDoc/TSDoc:**
- Used selectively for type properties with complex meanings
- Example from `src/types.ts`:
  ```typescript
  export interface InventoryItem {
    id: string;
    name: string;
    /** External supplier name (e.g. 'Şef Pasta A.Ş.') */
    supplier?: string;
    /** Whether this item is sourced from an external vendor */
    isExternal?: boolean;
    /** Expiration/best-before date as ISO date string YYYY-MM-DD */
    expiresAt?: string;
    /** Batch / lot note (e.g. delivery batch info) */
    batchNote?: string;
  }
  ```

## Function Design

**Size:** 
- Components and views range from ~50 to ~500+ lines
- Helper functions typically <20 lines
- Large functions broken into multiple handler functions

**Parameters:**
- Prefer destructured object parameters for components (prop spreading)
- Explicit parameter typing with interfaces (e.g., `MenuSelectorProps`, `TableCardProps`)
- Component parameters often receive setState functions and event handlers
- Service methods take typed domain objects and primitive parameters

**Return Values:**
- Components return JSX (React.ReactElement)
- Service methods return typed Promises: `Promise<T>` or void
- Hooks return object with state and handlers: `{ printers, addPrinter, updatePrinter, deletePrinter }`
- Helper functions return transformed/computed values or undefined

**Example component function signature from `src/components/layout/SidebarItem.tsx`:**
```typescript
export const SidebarItem = ({
  icon: Icon,
  label,
  active,
  onClick,
  collapsed = false
}: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed?: boolean;
}) => (/* JSX */)
```

## Module Design

**Exports:**
- Named exports for components, utilities, and services (e.g., `export const apiService`, `export function usePrinters`)
- Type/interface exports for domain models
- Default export used rarely (App component uses `export default function App()`)
- Service exports as singleton objects (e.g., `apiService`, `socketService`)

**Barrel Files:** 
- Not used; each file typically exports one main entity
- Views organized in subdirectories with index files (e.g., `src/views/FloorPlan/index.tsx` as main export)

**Example service pattern from `src/services/apiService.ts`:**
```typescript
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API Request failed');
  }
  return response.json();
}

export const apiService = {
  seed: () => request('/seed', { method: 'POST' }),
  getTables: () => request<Table[]>('/tables'),
  // ... many more methods organized by domain
};
```

## Styling

**Framework:** Tailwind CSS with `@tailwindcss/vite` plugin

**Patterns:**
- Utility-first approach with inline classes
- Responsive modifiers: `text-2xl`, `px-10`, `h-screen`
- State modifiers: `hover:`, `active:`, `transition-all`
- Color system: Custom theme with `accent`, `text`, `text-secondary`, `bg`, `surface-hover`
- CSS custom properties for theme colors referenced in HTML/JSX
- Motion animations via `motion/react` library (Framer Motion)

**Common utility combinations:**
```typescript
className={cn(
  "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200",
  active ? "bg-surface-hover text-white" : "text-text-secondary hover:text-white"
)}
```

**Utility helper function:**
- `cn()` utility from `src/utils.ts` combines `clsx` and `tailwind-merge` for safe class merging

## Conditional Rendering

**Pattern:**
- Ternary operators for simple conditions
- Logical AND (`&&`) for show/hide single elements
- Switch statements in render functions for complex branching (e.g., `renderView()` in App.tsx)
- AnimatePresence from Framer Motion for component entrance/exit with animations

**Example from `src/App.tsx`:**
```typescript
const renderView = () => {
  switch (activeTab) {
    case 'dashboard':
      return <DashboardView sales={sales} menuItems={menuItems} />;
    case 'floorplan':
      return <FloorPlanView { ...manyProps } />;
    // ... cases
    default:
      return <DashboardView sales={sales} menuItems={menuItems} />;
  }
};
```

---

*Convention analysis: 2026-03-25*

export type TableStatus = 'free' | 'occupied' | 'bill-requested' | 'reserved';

/**
 * User type for staff/employee authentication and tracking.
 * Used throughout the app for staff login, order assignment, and activity logging.
 */
export interface User {
  id: string;
  name: string;
  pin?: string;
  role?: 'admin' | 'waiter' | 'chef' | 'manager';
}

// Printer configuration - customizable per restaurant
export interface PrinterConfig {
  id: string;        // unique slug, e.g. 'kitchen', 'bar', 'kasiyer'
  name: string;      // display name, e.g. 'Mutfak Yazıcısı'
  color: string;     // tailwind color token e.g. 'red' | 'amber' | 'blue'
}

export interface Reservation {
  id: string;
  customerName: string;
  phone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  guestCount: number;
  tableId: string | null;
  status: 'pending' | 'confirmed' | 'seated' | 'cancelled';
  notes?: string;
  createdAt: any;
}

export interface Table {
  id: string;
  name: string;
  status: TableStatus;
  capacity: number;
  currentOrderTotal?: number;
  occupiedTime?: string;
  section: string;
  x: number;
  y: number;
  activeOrderId?: string;
  waiterId?: string;
  waiterName?: string;
}

export interface Order {
  id: string;
  tableId: string;
  items: OrderItem[];
  total: number;
  status: 'active' | 'completed' | 'cancelled';
  note?: string;
  waiterId?: string;
  waiterName?: string;
  discountAmount?: number;
  discountPercent?: number;
  createdAt: any;
}

export interface ModifierOption {
  name: string;
  price: number;
}

export interface ModifierGroup {
  name: string;
  required: boolean;
  multiSelect: boolean;
  options: ModifierOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  image: string;
  isAvailable: boolean;
  modifierGroups?: ModifierGroup[];
  printer?: string; // printer id from PrinterConfig
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  paidQuantity?: number; // Added for tracking partially paid items
  price: number;
  status: 'new' | 'preparing' | 'ready' | 'served' | 'paid';
  selectedModifiers?: {
    groupName: string;
    option: ModifierOption;
  }[];
  note?: string;
  printer?: string; // printer id
  statusTimestamps?: {
    new?: number;
    preparing?: number;
    ready?: number;
    served?: number;
  };
}

export interface Staff {
  id: string;
  name: string;
  role: 'admin' | 'waiter' | 'chef' | 'manager';
  status: 'active' | 'on-break' | 'offline';
  lastActive: string;
  avatar: string;
  pin: string;
  color?: string; // Hex color for scheduling
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  minStock: number;
  price: number;
  /** External supplier name (e.g. 'Şef Pasta A.Ş.') */
  supplier?: string;
  /** Whether this item is sourced from an external vendor */
  isExternal?: boolean;
  /** Expiration/best-before date as ISO date string YYYY-MM-DD */
  expiresAt?: string;
  /** Batch / lot note (e.g. delivery batch info) */
  batchNote?: string;
}

export interface SaleRecord {
  id: string;
  tableId: string;
  tableName: string;
  subtotal: number;
  discountTotal: number;
  total: number;
  paymentMethod: 'card' | 'cash';
  timestamp: string;
  itemsCount: number;
  items?: OrderItem[];
  createdAt?: any;
  timestampObj?: any;
}

export interface ActivityLog {
  id: string;
  staffId: string;
  staffName: string;
  action: string;
  timestamp: any;
}

export interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  dayIndex: number; // 0 for Monday, 6 for Sunday
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  type: 'morning' | 'evening' | 'full';
}

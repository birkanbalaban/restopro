export type TableStatus = 'free' | 'occupied' | 'bill-requested' | 'dirty';

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
  type: 'round' | 'square' | 'booth';
  activeOrderId?: string;
}

export interface Order {
  id: string;
  tableId: string;
  items: OrderItem[];
  total: number;
  status: 'active' | 'completed' | 'cancelled';
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
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  status: 'new' | 'preparing' | 'ready' | 'served';
  selectedModifiers?: {
    groupName: string;
    option: ModifierOption;
  }[];
}

export interface Staff {
  id: string;
  name: string;
  role: 'admin' | 'waiter' | 'chef' | 'manager';
  status: 'active' | 'on-break' | 'offline';
  lastActive: string;
  avatar: string;
  pin: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  minStock: number;
  price: number;
}

export interface SaleRecord {
  id: string;
  tableId: string;
  tableName: string;
  total: number;
  paymentMethod: 'card' | 'cash';
  timestamp: string;
  itemsCount: number;
}

export interface ActivityLog {
  id: string;
  staffId: string;
  staffName: string;
  action: string;
  timestamp: any;
}

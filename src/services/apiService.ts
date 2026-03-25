import { Table, Order, MenuItem, Staff, InventoryItem, SaleRecord, Reservation, Shift, OrderItem } from '../types';

/**
 * API Service - Frontend wrapper for Express backend API
 * 
 * All data operations flow through the local Express server running on port 3005.
 * This ensures a single source of truth (SQLite database) and simplifies state management.
 * 
 * API Base URL: http://localhost:3005/api
 * TODO: Move to environment variable (.env) in Phase 2
 * 
 * Available endpoints (as of Phase 1):
 * - /tables - Table management (GET, POST, DELETE, status updates)
 * - /menu - Menu items (GET, POST, PATCH, DELETE)
 * - /orders - Order management (GET, POST, add items, status updates, transfers)
 * - /sales - Sales records (POST, GET)
 * - /staff - Staff management (GET, POST, PATCH, DELETE)
 * - /shifts - Shift scheduling (GET, POST, DELETE)
 * - /reservations - Reservation management (GET, POST, PATCH, status)
 * - /inventory - Inventory tracking (GET, POST, PATCH, DELETE, stock updates)
 * - /seed - Initialize demo data (POST)
 */

const API_BASE = 'http://localhost:3005/api';

/**
 * Standard error response format for all API errors.
 * Includes code for classification, human-readable message, and details for debugging.
 */
interface ApiError {
    code: 'NETWORK_ERROR' | 'CLIENT_ERROR' | 'SERVER_ERROR' | 'PARSE_ERROR' | 'UNKNOWN_ERROR';
    message: string;
    details?: unknown;
}

/**
 * Makes typed HTTP requests to the API with consistent error handling.
 * 
 * @throws ApiError - Thrown with code, message, and details for all error cases
 * @example
 * try {
 *   const data = await request('/orders');
 * } catch (error) {
 *   const apiError = error as ApiError;
 *   console.error(`[${apiError.code}] ${apiError.message}`);
 * }
 */
async function request<T>(path: string, options?: RequestInit): Promise<T> {
    try {
        const response = await fetch(`${API_BASE}${path}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers
            }
        });

        let data: any;
        try {
            data = await response.json();
        } catch (e) {
            throw {
                code: 'PARSE_ERROR' as const,
                message: 'Failed to parse response body',
                details: e
            };
        }

        if (!response.ok) {
            const code = response.status >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR';
            throw {
                code,
                message: data.error || `API request failed (${response.status})`,
                details: { status: response.status, data }
            };
        }

        return data as T;
    } catch (error) {
        // If already an ApiError, re-throw it
        if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
            throw error;
        }

        // Network or other errors
        if (error instanceof TypeError) {
            throw {
                code: 'NETWORK_ERROR' as const,
                message: 'Network request failed. Check server connection.',
                details: error
            };
        }

        // Unknown error
        throw {
            code: 'UNKNOWN_ERROR' as const,
            message: error instanceof Error ? error.message : 'Unknown error occurred',
            details: error
        };
    }
}

export const apiService = {
    // Common
    seed: () => request('/seed', { method: 'POST' }),

    // Tables
    getTables: () => request<Table[]>('/tables'),
    addTable: (table: Table) => request('/tables', { method: 'POST', body: JSON.stringify(table) }),
    deleteTable: (id: string) => request(`/tables/${id}`, { method: 'DELETE' }),
    updateTableStatus: (tableId: string, status: Table['status'], extraData: Partial<Table> = {}) =>
        request(`/tables/${tableId}/status`, { method: 'POST', body: JSON.stringify({ status, ...extraData }) }),
    updateTablePosition: (tableId: string, x: number, y: number) =>
        request(`/tables/${tableId}/position`, { method: 'POST', body: JSON.stringify({ x, y }) }),
    assignWaiterToTable: (tableId: string, orderId: string | undefined, waiterId: string, waiterName: string) =>
        request(`/tables/${tableId}/waiter`, { method: 'POST', body: JSON.stringify({ orderId, waiterId, waiterName }) }),

    // Menu
    getMenuItems: () => request<MenuItem[]>('/menu'),
    addMenuItem: (item: MenuItem) => request('/menu', { method: 'POST', body: JSON.stringify(item) }),
    updateMenuItem: (id: string, updates: Partial<MenuItem>) => request(`/menu/${id}`, { method: 'PATCH', body: JSON.stringify(updates) }),
    deleteMenuItem: (id: string) => request(`/menu/${id}`, { method: 'DELETE' }),

    // Orders
    getOrders: () => request<Order[]>('/orders'),
    getOrder: (orderId: string) => request<Order>(`/orders/${orderId}`),
    createOrder: (tableId: string, waiter?: { id: string, name: string }) =>
        request<{ orderId: string }>('/orders', { method: 'POST', body: JSON.stringify({ tableId, waiter }) }),
    addOrderItems: (orderId: string, items: any[]) =>
        request(`/orders/${orderId}/items`, { method: 'POST', body: JSON.stringify({ items }) }),
    updateOrderItemStatus: (orderId: string, itemId: string, status: OrderItem['status']) =>
        request(`/orders/${orderId}/items/${itemId}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
    removeOrderItem: (orderId: string, itemId: string) =>
        request(`/orders/${orderId}/items/${itemId}`, { method: 'DELETE' }),
    transferOrderItems: (orderId: string, targetTableId: string, items: OrderItem[]) =>
        request(`/orders/${orderId}/transfer`, { method: 'POST', body: JSON.stringify({ targetTableId, items }) }),

    // Sales
    completeSale: (saleData: any, orderId?: string) =>
        request('/sales', { method: 'POST', body: JSON.stringify({ ...saleData, orderId }) }),
    splitPayment: (orderId: string, splitItems: { itemId: string, quantity: number }[], saleData: any) =>
        request(`/orders/${orderId}/split-payment`, { method: 'POST', body: JSON.stringify({ splitItems, saleData }) }),
    applyDiscountToOrder: (orderId: string, discount: { percent?: number, amount?: number }) =>
        request(`/orders/${orderId}/discount`, { method: 'POST', body: JSON.stringify(discount) }),
    getSales: () => request<SaleRecord[]>('/sales'),

    // Staff
    getStaff: () => request<Staff[]>('/staff'),
    addStaff: (staff: Omit<Staff, 'id'>) => request<Staff>('/staff', { method: 'POST', body: JSON.stringify(staff) }),
    updateStaff: (staffId: string, updates: Partial<Staff>) => request(`/staff/${staffId}`, { method: 'PATCH', body: JSON.stringify(updates) }),
    removeStaff: (staffId: string) => request(`/staff/${staffId}`, { method: 'DELETE' }),

    // Shifts
    getShifts: () => request<Shift[]>('/shifts'),
    addShift: (shift: Omit<Shift, 'id'>) => request<Shift>('/shifts', { method: 'POST', body: JSON.stringify(shift) }),
    removeShift: (shiftId: string) => request(`/shifts/${shiftId}`, { method: 'DELETE' }),

    // Reservations
    getReservations: () => request<Reservation[]>('/reservations'),
    addReservation: (res: Omit<Reservation, 'id'>) => request<{ id: string }>('/reservations', { method: 'POST', body: JSON.stringify(res) }),
    updateReservation: (reservationId: string, updates: Partial<Reservation>) =>
        request(`/reservations/${reservationId}`, { method: 'PATCH', body: JSON.stringify(updates) }),
    updateReservationStatus: (reservationId: string, status: Reservation['status'], tableId?: string | null) =>
        request(`/reservations/${reservationId}/status`, { method: 'POST', body: JSON.stringify({ status, tableId }) }),

    // Inventory
    getInventory: () => request<InventoryItem[]>('/inventory'),
    addInventoryItem: (item: Omit<InventoryItem, 'id'>) => request<{ id: string }>('/inventory', { method: 'POST', body: JSON.stringify(item) }),
    updateInventoryItem: (itemId: string, updates: Partial<InventoryItem>) =>
        request(`/inventory/${itemId}`, { method: 'PATCH', body: JSON.stringify(updates) }),
    deleteInventoryItem: (itemId: string) => request(`/inventory/${itemId}`, { method: 'DELETE' }),
    updateInventoryStock: (itemId: string, stock: number) =>
        request(`/inventory/${itemId}/stock`, { method: 'POST', body: JSON.stringify({ stock }) })
};

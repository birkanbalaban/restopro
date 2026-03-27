import {
    collection,
    getDocs,
    getDoc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    onSnapshot,
    Timestamp,
    serverTimestamp,
    orderBy,
    limit,
    collectionGroup
} from 'firebase/firestore';
import { db } from '../firebase';
import { Table, MenuItem, Order, Staff, InventoryItem, SaleRecord, Reservation, Shift, OrderItem } from '../types';

/**
 * Firebase Transactional & Real-time Services for RestoPro
 */

// --- Collections ---
const tablesCol = collection(db, 'tables');
const menuCol = collection(db, 'menu');
const ordersCol = collection(db, 'orders');
const staffCol = collection(db, 'staff');
const inventoryCol = collection(db, 'inventory');
const salesCol = collection(db, 'sales');
const reservationsCol = collection(db, 'reservations');
const shiftsCol = collection(db, 'shifts');

export const firebaseService = {
    // --- Tables ---
    getTables: async (): Promise<Table[]> => {
        const snapshot = await getDocs(tablesCol);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Table));
    },

    subscribeTables: (callback: (tables: Table[]) => void, onError?: (err: any) => void) => {
        return onSnapshot(tablesCol, (snapshot) => {
            const tables = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Table));
            callback(tables);
        }, onError);
    },

    updateTableStatus: async (tableId: string, status: Table['status'], extraData: Partial<Table> = {}) => {
        const tableRef = doc(db, 'tables', tableId);
        return updateDoc(tableRef, { status, ...extraData });
    },

    addTable: async (table: Omit<Table, 'id'>) => {
        return addDoc(tablesCol, table);
    },

    deleteTable: async (tableId: string) => {
        const tableRef = doc(db, 'tables', tableId);
        return deleteDoc(tableRef);
    },

    updateTablePosition: async (tableId: string, x: number, y: number) => {
        const tableRef = doc(db, 'tables', tableId);
        return updateDoc(tableRef, { x, y });
    },

    // --- Menu ---
    getMenuItems: async (): Promise<MenuItem[]> => {
        const snapshot = await getDocs(menuCol);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
    },

    subscribeMenu: (callback: (items: MenuItem[]) => void, onError?: (err: any) => void) => {
        return onSnapshot(menuCol, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem));
            callback(items);
        }, onError);
    },

    addMenuItem: async (item: Omit<MenuItem, 'id'>) => {
        return addDoc(menuCol, item);
    },

    updateMenuItem: async (itemId: string, updates: Partial<MenuItem>) => {
        const itemRef = doc(db, 'menu', itemId);
        return updateDoc(itemRef, updates);
    },

    deleteMenuItem: async (itemId: string) => {
        const itemRef = doc(db, 'menu', itemId);
        return deleteDoc(itemRef);
    },

    // --- Orders ---
    getOrders: async (): Promise<Order[]> => {
        const snapshot = await getDocs(ordersCol);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toMillis?.() || data.createdAt
            } as Order;
        });
    },

    subscribeOrders: (callback: (orders: Order[]) => void, onError?: (err: any) => void) => {
        // We use a simple query first to ensure it works without complex indexing if possible
        const q = query(ordersCol, where('status', '==', 'active'));
        return onSnapshot(q, (snapshot) => {
            const orders = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toMillis?.() || data.createdAt
                } as Order;
            });
            // Manual sort to avoid needing a composite index while developing
            orders.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            callback(orders);
        }, onError);
    },

    createOrder: async (order: Omit<Order, 'id'>) => {
        const docRef = await addDoc(ordersCol, {
            ...order,
            createdAt: serverTimestamp()
        });
        return docRef.id;
    },

    updateOrder: async (orderId: string, updates: Partial<Order>) => {
        const orderRef = doc(db, 'orders', orderId);
        return updateDoc(orderRef, updates);
    },

    addOrderItems: async (orderId: string, newItems: OrderItem[]) => {
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await getDoc(orderRef);
        if (!orderDoc.exists()) throw new Error('Order not found');

        const currentOrder = orderDoc.data() as Order;
        const updatedItems = [...currentOrder.items, ...newItems];
        const newTotal = updatedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        return updateDoc(orderRef, {
            items: updatedItems,
            total: newTotal
        });
    },

    updateOrderItemStatus: async (orderId: string, itemId: string, status: OrderItem['status']) => {
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await getDoc(orderRef);
        if (!orderDoc.exists()) throw new Error('Order not found');

        const orderData = orderDoc.data() as Order;
        const updatedItems = orderData.items.map(item =>
            item.id === itemId ? {
                ...item,
                status,
                statusTimestamps: {
                    ...item.statusTimestamps,
                    [status]: Date.now()
                }
            } : item
        );

        return updateDoc(orderRef, { items: updatedItems });
    },

    removeOrderItem: async (orderId: string, itemId: string) => {
        const orderRef = doc(db, 'orders', orderId);
        const orderDoc = await getDoc(orderRef);
        if (!orderDoc.exists()) throw new Error('Order not found');

        const orderData = orderDoc.data() as Order;
        const updatedItems = orderData.items.filter(item => item.id !== itemId);
        const newTotal = updatedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

        return updateDoc(orderRef, {
            items: updatedItems,
            total: newTotal
        });
    },

    // --- Sales ---
    completeSale: async (saleData: Omit<SaleRecord, 'id'>) => {
        const docRef = await addDoc(salesCol, {
            ...saleData,
            timestamp: new Date().toISOString()
        });
        return docRef.id;
    },

    getSales: async (): Promise<SaleRecord[]> => {
        const q = query(salesCol, orderBy('timestamp', 'desc'), limit(100));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SaleRecord));
    },

    // --- Staff ---
    getStaff: async (): Promise<Staff[]> => {
        const snapshot = await getDocs(staffCol);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));
    },

    subscribeStaff: (callback: (staff: Staff[]) => void, onError?: (err: any) => void) => {
        return onSnapshot(staffCol, (snapshot) => {
            const staff = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Staff));
            callback(staff);
        }, onError);
    },

    addStaff: async (staff: Omit<Staff, 'id'>) => {
        const docRef = await addDoc(staffCol, staff);
        return { id: docRef.id, ...staff } as Staff;
    },

    updateStaff: async (staffId: string, updates: Partial<Staff>) => {
        const staffRef = doc(db, 'staff', staffId);
        return updateDoc(staffRef, updates);
    },

    deleteStaff: async (staffId: string) => {
        const staffRef = doc(db, 'staff', staffId);
        return deleteDoc(staffRef);
    },

    // --- Inventory ---
    getInventory: async (): Promise<InventoryItem[]> => {
        const snapshot = await getDocs(inventoryCol);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
    },

    subscribeInventory: (callback: (items: InventoryItem[]) => void, onError?: (err: any) => void) => {
        const q = query(inventoryCol, orderBy('name'));
        return onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem));
            callback(items);
        }, onError);
    },

    updateInventoryItem: async (itemId: string, updates: Partial<InventoryItem>) => {
        const itemRef = doc(db, 'inventory', itemId);
        return updateDoc(itemRef, updates);
    },

    addInventoryItem: async (item: Omit<InventoryItem, 'id'>) => {
        return addDoc(inventoryCol, item);
    },

    deleteInventoryItem: async (itemId: string) => {
        const itemRef = doc(db, 'inventory', itemId);
        return deleteDoc(itemRef);
    },

    // --- Reservations ---
    getReservations: async (): Promise<Reservation[]> => {
        const snapshot = await getDocs(reservationsCol);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation));
    },

    subscribeReservations: (callback: (res: Reservation[]) => void, onError?: (err: any) => void) => {
        return onSnapshot(reservationsCol, (snapshot) => {
            const res = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reservation));
            callback(res);
        }, onError);
    },

    addReservation: async (res: Omit<Reservation, 'id'>) => {
        const docRef = await addDoc(reservationsCol, {
            ...res,
            createdAt: serverTimestamp()
        });
        return { id: docRef.id, ...res } as Reservation;
    },

    updateReservation: async (id: string, updates: Partial<Reservation>) => {
        const resRef = doc(db, 'reservations', id);
        return updateDoc(resRef, updates);
    },

    deleteReservation: async (id: string) => {
        const resRef = doc(db, 'reservations', id);
        return deleteDoc(resRef);
    },

    // --- Shifts ---
    getShifts: async (): Promise<Shift[]> => {
        const snapshot = await getDocs(shiftsCol);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shift));
    },

    subscribeShifts: (callback: (shifts: Shift[]) => void, onError?: (err: any) => void) => {
        return onSnapshot(shiftsCol, (snapshot) => {
            const shifts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shift));
            callback(shifts);
        }, onError);
    },

    addShift: async (shift: Omit<Shift, 'id'>) => {
        const docRef = await addDoc(shiftsCol, shift);
        return { id: docRef.id, ...shift } as Shift;
    },

    deleteShift: async (id: string) => {
        const shiftRef = doc(db, 'shifts', id);
        return deleteDoc(shiftRef);
    },

    updateShift: async (id: string, updates: Partial<Shift>) => {
        const shiftRef = doc(db, 'shifts', id);
        return updateDoc(shiftRef, updates);
    },

    // --- Seed Demo Data ---
    seed: async (tables: Table[], menu: MenuItem[], staff: Staff[], inventory: InventoryItem[]) => {
        // Sequential batches for simplicity
        for (const t of tables) await setDoc(doc(tablesCol, t.id), t);
        for (const m of menu) await setDoc(doc(menuCol, m.id), m);
        for (const s of staff) await setDoc(doc(staffCol, s.id), s);
        for (const i of inventory) await setDoc(doc(inventoryCol, i.id), i);
    }
};

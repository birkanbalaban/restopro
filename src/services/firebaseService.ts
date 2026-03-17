import { 
  collection, 
  onSnapshot, 
  query, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  setDoc,
  getDocs,
  where,
  orderBy,
  limit,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { Table, MenuItem, Staff, InventoryItem, SaleRecord, Order, OrderItem, ActivityLog } from '../types';

// Generic listener helper
export const subscribeToCollection = <T>(
  collectionName: string, 
  callback: (data: T[]) => void,
  queryConstraints: any[] = []
) => {
  const q = query(collection(db, collectionName), ...queryConstraints);
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    callback(data);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, collectionName);
  });
};

// Specific actions
export const updateTableStatus = async (tableId: string, status: Table['status'], extraData: Partial<Table> = {}) => {
  try {
    const tableRef = doc(db, 'tables', tableId);
    await updateDoc(tableRef, { status, ...extraData });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tables/${tableId}`);
  }
};

export const createOrder = async (tableId: string) => {
  try {
    const orderRef = await addDoc(collection(db, 'orders'), {
      tableId,
      items: [],
      total: 0,
      status: 'active',
      createdAt: serverTimestamp()
    });
    
    await updateTableStatus(tableId, 'occupied', { 
      activeOrderId: orderRef.id,
      currentOrderTotal: 0,
      occupiedTime: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    });
    
    return orderRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'orders');
  }
};

export const addOrderItem = async (
  orderId: string, 
  item: MenuItem, 
  selectedModifiers?: { groupName: string, option: { name: string, price: number } }[]
) => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) return;
    
    const orderData = orderSnap.data() as Order;
    
    // Calculate final price
    let finalPrice = item.price;
    if (selectedModifiers) {
      selectedModifiers.forEach(m => finalPrice += m.option.price);
    }

    // Check if an identical item (same ID and same modifiers) exists
    const existingItemIndex = orderData.items.findIndex(i => {
      if (i.menuItemId !== item.id) return false;
      
      const modsA = i.selectedModifiers || [];
      const modsB = selectedModifiers || [];
      
      if (modsA.length !== modsB.length) return false;
      
      // Sort and compare modifiers
      const sortedA = [...modsA].sort((a, b) => a.option.name.localeCompare(b.option.name));
      const sortedB = [...modsB].sort((a, b) => a.option.name.localeCompare(b.option.name));
      
      return sortedA.every((mod, index) => mod.option.name === sortedB[index].option.name);
    });
    
    let updatedItems = [...orderData.items];
    
    if (existingItemIndex > -1) {
      updatedItems[existingItemIndex].quantity += 1;
    } else {
      const newItem: OrderItem = {
        id: crypto.randomUUID(),
        menuItemId: item.id,
        name: item.name,
        quantity: 1,
        price: finalPrice,
        status: 'new',
        ...(selectedModifiers ? { selectedModifiers } : {})
      };
      updatedItems.push(newItem);
    }
    
    const newTotal = updatedItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    
    await updateDoc(orderRef, {
      items: updatedItems,
      total: newTotal
    });
    
    // Also update table total
    const tableRef = doc(db, 'tables', orderData.tableId);
    await updateDoc(tableRef, { currentOrderTotal: newTotal });
    
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
  }
};

export const completeSale = async (saleData: Omit<SaleRecord, 'id' | 'timestamp'>, orderId?: string) => {
  try {
    // 1. Create sale record
    await addDoc(collection(db, 'sales'), {
      ...saleData,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      createdAt: serverTimestamp()
    });

    // 2. Mark order as completed
    if (orderId) {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: 'completed' });
    }

    // 3. Reset table
    await updateTableStatus(saleData.tableId, 'dirty', {
      currentOrderTotal: 0,
      occupiedTime: '',
      activeOrderId: ''
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'sales');
  }
};

export const updateInventoryItem = async (itemId: string, updates: Partial<InventoryItem>) => {
  try {
    const itemRef = doc(db, 'inventory', itemId);
    await updateDoc(itemRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `inventory/${itemId}`);
  }
};

export const addStaffMember = async (staffData: Omit<Staff, 'id'>) => {
  try {
    const staffRef = await addDoc(collection(db, 'staff'), {
      ...staffData,
      lastActive: 'Yeni'
    });
    return staffRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'staff');
  }
};

export const logActivity = async (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
  try {
    await addDoc(collection(db, 'activity_logs'), {
      ...log,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'activity_logs');
  }
};

export const updateStaffStatus = async (staffId: string, status: Staff['status'], staffName: string) => {
  try {
    const staffRef = doc(db, 'staff', staffId);
    await updateDoc(staffRef, { status, lastActive: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) });
    
    await logActivity({
      staffId,
      staffName,
      action: status === 'active' ? 'Moladan döndü' : status === 'on-break' ? 'Molaya çıktı' : 'Çevrimdışı oldu'
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `staff/${staffId}`);
  }
};

export const updateTablePosition = async (tableId: string, x: number, y: number) => {
  try {
    const tableRef = doc(db, 'tables', tableId);
    await updateDoc(tableRef, { x, y });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `tables/${tableId}`);
  }
};

export const transferOrderItems = async (sourceOrderId: string, targetTableId: string, itemsToTransfer: OrderItem[]) => {
  try {
    const sourceOrderRef = doc(db, 'orders', sourceOrderId);
    const sourceOrderSnap = await getDoc(sourceOrderRef);
    if (!sourceOrderSnap.exists()) return;
    const sourceOrderData = sourceOrderSnap.data() as Order;

    // 1. Find or create target order
    const targetTableRef = doc(db, 'tables', targetTableId);
    const targetTableSnap = await getDoc(targetTableRef);
    if (!targetTableSnap.exists()) return;
    const targetTableData = targetTableSnap.data() as Table;

    let targetOrderId = targetTableData.activeOrderId;
    if (!targetOrderId) {
      targetOrderId = await createOrder(targetTableId);
    }

    const targetOrderRef = doc(db, 'orders', targetOrderId!);
    const targetOrderSnap = await getDoc(targetOrderRef);
    const targetOrderData = targetOrderSnap.data() as Order;

    // 2. Update source order (remove items)
    const remainingItems = sourceOrderData.items.filter(si => !itemsToTransfer.some(ti => ti.id === si.id));
    const sourceNewTotal = remainingItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    await updateDoc(sourceOrderRef, { items: remainingItems, total: sourceNewTotal });
    await updateDoc(doc(db, 'tables', sourceOrderData.tableId), { currentOrderTotal: sourceNewTotal });

    // 3. Update target order (add items)
    let updatedTargetItems = [...targetOrderData.items];
    itemsToTransfer.forEach(ti => {
      const existingIdx = updatedTargetItems.findIndex(i => i.menuItemId === ti.menuItemId);
      if (existingIdx > -1) {
        updatedTargetItems[existingIdx].quantity += ti.quantity;
      } else {
        updatedTargetItems.push(ti);
      }
    });
    const targetNewTotal = updatedTargetItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    await updateDoc(targetOrderRef, { items: updatedTargetItems, total: targetNewTotal });
    await updateDoc(targetTableRef, { currentOrderTotal: targetNewTotal });

  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `orders/transfer`);
  }
};

export const addMenuItem = async (itemData: Omit<MenuItem, 'id'>) => {
  try {
    const menuRef = await addDoc(collection(db, 'menu'), {
      ...itemData,
      isAvailable: true
    });
    return menuRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'menu');
  }
};

export const deleteMenuItem = async (itemId: string) => {
  try {
    await deleteDoc(doc(db, 'menu', itemId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `menu/${itemId}`);
  }
};

export const deleteStaffMember = async (staffId: string) => {
  try {
    await deleteDoc(doc(db, 'staff', staffId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `staff/${staffId}`);
  }
};
export const seedDatabase = async (
  tables: Table[], 
  menu: MenuItem[], 
  staff: Staff[], 
  inventory: InventoryItem[]
) => {
  try {
    // Check tables
    const tablesSnap = await getDocs(collection(db, 'tables'));
    if (tablesSnap.empty) {
      for (const t of tables) await setDoc(doc(db, 'tables', t.id), t);
      console.log('Tables seeded');
    }

    // Check menu
    const menuSnap = await getDocs(collection(db, 'menu'));
    if (menuSnap.empty) {
      for (const m of menu) await setDoc(doc(db, 'menu', m.id), m);
      console.log('Menu seeded');
    }

    // Check staff
    const staffSnap = await getDocs(collection(db, 'staff'));
    if (staffSnap.empty) {
      for (const s of staff) await setDoc(doc(db, 'staff', s.id), s);
      console.log('Staff seeded');
    }

    // Check inventory
    const invSnap = await getDocs(collection(db, 'inventory'));
    if (invSnap.empty) {
      for (const i of inventory) await setDoc(doc(db, 'inventory', i.id), i);
      console.log('Inventory seeded');
    }
  } catch (error) {
    console.error('Seeding error:', error);
  }
};

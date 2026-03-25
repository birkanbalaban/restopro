import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import crypto from 'crypto';
import db, { initDB, seedDB } from './db.js';
// We import directly from the src constants for initial seed
import { TABLES, MENU_ITEMS, STAFF, INVENTORY, RESERVATIONS } from '../../src/constants.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'DELETE']
    }
});

app.use(cors());
app.use(express.json());

// Initialize and Seed
initDB();
seedDB({
    tables: TABLES,
    menuItems: MENU_ITEMS,
    staff: STAFF,
    inventory: INVENTORY,
    reservations: RESERVATIONS
});

// --- Helper: Broadcast to all clients ---
const broadcast = (event: string, data?: any) => {
    io.emit(event, data);
};

// --- API Routes ---

// Tables
app.get('/api/tables', (req, res) => {
    const tables = db.prepare('SELECT * FROM tables').all();
    res.json(tables);
});

// Menu
app.get('/api/menu', (req, res) => {
    const items = db.prepare('SELECT * FROM menu_items').all() as any[];
    res.json(items.map(item => ({
        ...item,
        isAvailable: item.isAvailable === 1,
        modifierGroups: JSON.parse(item.modifierGroups || '[]')
    })));
});

app.post('/api/menu', (req, res) => {
    const { name, price, category, image, description, isAvailable, printer, modifierGroups } = req.body;
    const id = crypto.randomUUID();
    db.prepare(`
        INSERT INTO menu_items (id, name, price, category, image, description, isAvailable, printer, modifierGroups)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, price, category, image, description, isAvailable ? 1 : 0, printer, JSON.stringify(modifierGroups || []));
    broadcast('menu_updated');
    res.json({ id });
});

app.patch('/api/menu/:id', (req, res) => {
    const updates = req.body;
    if (updates.isAvailable !== undefined) updates.isAvailable = updates.isAvailable ? 1 : 0;
    if (updates.modifierGroups !== undefined) updates.modifierGroups = JSON.stringify(updates.modifierGroups);

    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = Object.values(updates);
    db.prepare(`UPDATE menu_items SET ${fields} WHERE id = ?`).run(...values, req.params.id);
    broadcast('menu_updated');
    res.json({ success: true });
});

app.delete('/api/menu/:id', (req, res) => {
    db.prepare('DELETE FROM menu_items WHERE id = ?').run(req.params.id);
    broadcast('menu_updated');
    res.json({ success: true });
});

app.post('/api/seed', (req, res) => {
    try {
        seedDB({
            tables: TABLES,
            menuItems: MENU_ITEMS,
            staff: STAFF,
            inventory: INVENTORY,
            reservations: RESERVATIONS
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

app.post('/api/tables/:id/status', (req, res) => {
    const { id } = req.params;
    const { status, activeOrderId, currentOrderTotal, occupiedTime, waiterId, waiterName } = req.body;

    db.prepare(`
    UPDATE tables 
    SET status = ?, 
        activeOrderId = COALESCE(?, activeOrderId), 
        currentOrderTotal = COALESCE(?, currentOrderTotal), 
        occupiedTime = COALESCE(?, occupiedTime), 
        waiterId = COALESCE(?, waiterId), 
        waiterName = COALESCE(?, waiterName) 
    WHERE id = ?
  `).run(status, activeOrderId || null, currentOrderTotal || null, occupiedTime || null, waiterId || null, waiterName || null, id);

    broadcast('table_updated', id);
    res.json({ success: true });
});

// Orders
app.get('/api/orders', (req, res) => {
    try {
        const orders = db.prepare("SELECT * FROM orders WHERE status = 'active'").all() as any[];
        const enrichedOrders = orders.map(order => {
            const items = db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(order.id) as any[];
            const parsedItems = items.map(item => ({
                ...item,
                selectedModifiers: JSON.parse(item.selectedModifiers || '[]'),
                statusTimestamps: JSON.parse(item.statusTimestamps || '{}')
            }));
            return { ...order, items: parsedItems };
        });
        res.json(enrichedOrders);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

app.get('/api/orders/:id', (req, res) => {
    try {
        const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id) as any;
        if (order) {
            const items = db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(req.params.id) as any[];
            const parsedItems = items.map(item => ({
                ...item,
                selectedModifiers: JSON.parse(item.selectedModifiers || '[]'),
                statusTimestamps: JSON.parse(item.statusTimestamps || '{}')
            }));
            res.json({ ...order, items: parsedItems });
        } else {
            res.status(404).json({ error: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

app.post('/api/orders', (req, res) => {
    const { tableId, waiter } = req.body;
    const orderId = crypto.randomUUID();
    const now = new Date().toISOString();

    try {
        db.transaction(() => {
            db.prepare('INSERT INTO orders (id, tableId, status, total, waiterId, waiterName, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)')
                .run(orderId, tableId, 'active', 0, waiter?.id || null, waiter?.name || null, now);

            db.prepare('UPDATE tables SET status = ?, activeOrderId = ?, waiterId = ?, waiterName = ?, currentOrderTotal = 0 WHERE id = ?')
                .run('occupied', orderId, waiter?.id || null, waiter?.name || null, tableId);
        })();

        broadcast('table_updated', tableId);
        broadcast('orders_updated');
        res.json({ orderId });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

app.post('/api/orders/:id/items', (req, res) => {
    const { id } = req.params;
    const { items } = req.body; // Array of items to add/update

    try {
        db.transaction(() => {
            const insertItem = db.prepare('INSERT OR REPLACE INTO order_items (id, orderId, menuItemId, name, quantity, price, status, note, printer, selectedModifiers, statusTimestamps) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

            for (const item of items) {
                // If the item already has an ID, it's an update. If it doesn't, it's a new item.
                // For simplicity in this implementation, we assume they are new or handled explicitly.
                // The frontend will send full snapshots for now.
                const itemId = item.id || crypto.randomUUID();
                insertItem.run(
                    itemId, id, item.menuItemId, item.name, item.quantity, item.price, item.status || 'new',
                    item.note || null, item.printer || null, JSON.stringify(item.selectedModifiers || []),
                    JSON.stringify({ new: Date.now() })
                );
            }

            // Recalculate order total
            const allItems = db.prepare('SELECT price, quantity FROM order_items WHERE orderId = ?').all() as any[];
            const newTotal = allItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);

            db.prepare('UPDATE orders SET total = ? WHERE id = ?').run(newTotal, id);

            const order = db.prepare('SELECT tableId FROM orders WHERE id = ?').get(id) as any;
            db.prepare('UPDATE tables SET currentOrderTotal = ? WHERE id = ?').run(newTotal, order.tableId);

            broadcast('table_updated', order.tableId);
        })();

        broadcast('orders_updated');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

app.post('/api/orders/:id/items/:itemId/status', (req, res) => {
    const { id, itemId } = req.params;
    const { status } = req.body;
    console.log(`[Kitchen] Item ${itemId} in order ${id} status update to: ${status}`);
    try {
        const item = db.prepare('SELECT statusTimestamps FROM order_items WHERE id = ?').get(itemId) as any;
        if (!item) {
            console.error(`[Kitchen] Item ${itemId} not found`);
            return res.status(404).json({ error: 'Item not found' });
        }
        const timestampsStr = item.statusTimestamps;
        let timestamps: Record<string, number> = {};
        try {
            timestamps = JSON.parse(timestampsStr || '{}');
        } catch (e) {
            console.error(`[Kitchen] Failed to parse timestamps for item ${itemId}:`, timestampsStr);
            timestamps = {};
        }

        timestamps[status] = Date.now();

        console.log(`[Kitchen] Updating item ${itemId} to ${status}`);
        db.prepare('UPDATE order_items SET status = ?, statusTimestamps = ? WHERE id = ?')
            .run(status, JSON.stringify(timestamps), itemId);

        console.log(`[Kitchen] Item ${itemId} updated successfully`);
        broadcast('orders_updated');
        res.json({ success: true });
    } catch (error) {
        console.error(`[Kitchen] Error updating status for item ${itemId}:`, error);
        res.status(500).json({ error: (error as Error).message });
    }
});

app.delete('/api/orders/:id/items/:itemId', (req, res) => {
    const { id, itemId } = req.params;
    try {
        db.prepare('DELETE FROM order_items WHERE id = ?').run(itemId);

        // Recalculate order total
        const allItems = db.prepare('SELECT price, quantity FROM order_items WHERE orderId = ?').all() as any[];
        const newTotal = allItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
        db.prepare('UPDATE orders SET total = ? WHERE id = ?').run(newTotal, id);

        const order = db.prepare('SELECT tableId FROM orders WHERE id = ?').get(id) as any;
        db.prepare('UPDATE tables SET currentOrderTotal = ? WHERE id = ?').run(newTotal, order.tableId);

        broadcast('table_updated', order.tableId);
        broadcast('orders_updated');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

app.post('/api/orders/:id/discount', (req, res) => {
    const { id } = req.params;
    const { percent, amount } = req.body;
    try {
        db.prepare('UPDATE orders SET discountPercent = ?, discountAmount = ? WHERE id = ?')
            .run(percent || 0, amount || 0, id);
        broadcast('orders_updated');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// Sales
app.post('/api/sales', (req, res) => {
    const { orderId, tableId, tableName, total, subtotal, discountTotal, paymentMethod, itemsCount, items } = req.body;
    const saleId = crypto.randomUUID();
    const now = new Date().toISOString();
    const timeStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    try {
        db.transaction(() => {
            // 1. Create sale record
            db.prepare('INSERT INTO sales (id, tableId, tableName, subtotal, discountTotal, total, paymentMethod, timestamp, itemsCount, itemsJson) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
                .run(saleId, tableId, tableName, subtotal, discountTotal, total, paymentMethod, timeStr, itemsCount, JSON.stringify(items || []));

            // 2. Mark order completed
            if (orderId) {
                db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('completed', orderId);
                db.prepare("UPDATE order_items SET status = 'paid' WHERE orderId = ?").run(orderId);
            }

            // 3. Clear table
            db.prepare('UPDATE tables SET status = ?, activeOrderId = NULL, currentOrderTotal = 0, occupiedTime = NULL, waiterId = NULL, waiterName = NULL WHERE id = ?')
                .run('free', tableId);
        })();

        broadcast('table_updated', tableId);
        broadcast('sales_updated');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

app.get('/api/sales', (req, res) => {
    const sales = db.prepare('SELECT * FROM sales ORDER BY timestamp DESC').all() as any[];
    res.json(sales.map(s => ({ ...s, items: JSON.parse(s.itemsJson) })));
});

// Staff
app.get('/api/staff', (req, res) => {
    const staff = db.prepare('SELECT * FROM staff').all();
    res.json(staff);
});

app.post('/api/staff', (req, res) => {
    const { name, role, pin, avatar } = req.body;
    const id = crypto.randomUUID();
    db.prepare('INSERT INTO staff (id, name, role, pin, avatar, status) VALUES (?, ?, ?, ?, ?, ?)')
        .run(id, name, role, pin, avatar, 'offline');
    broadcast('staff_updated');
    res.json({ id, name, role, pin, avatar });
});

app.patch('/api/staff/:id', (req, res) => {
    const updates = req.body;
    const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
    const values = Object.values(updates);
    db.prepare(`UPDATE staff SET ${fields} WHERE id = ?`).run(...values, req.params.id);
    broadcast('staff_updated');
    res.json({ success: true });
});

app.delete('/api/staff/:id', (req, res) => {
    db.prepare('DELETE FROM staff WHERE id = ?').run(req.params.id);
    broadcast('staff_updated');
    res.json({ success: true });
});

// Table Extensions (Position & Waiter)
app.post('/api/tables/:id/position', (req, res) => {
    const { x, y } = req.body;
    db.prepare('UPDATE tables SET x = ?, y = ? WHERE id = ?').run(x, y, req.params.id);
    broadcast('table_updated', req.params.id);
    res.json({ success: true });
});

app.post('/api/tables/:id/waiter', (req, res) => {
    const { waiterId, waiterName } = req.body;
    db.prepare('UPDATE tables SET waiterId = ?, waiterName = ?, status = "occupied" WHERE id = ?')
        .run(waiterId, waiterName, req.params.id);
    broadcast('table_updated', req.params.id);
    res.json({ success: true });
});

// Shifts
app.get('/api/shifts', (req, res) => {
    const shifts = db.prepare('SELECT * FROM shifts').all();
    res.json(shifts);
});

app.post('/api/shifts', (req, res) => {
    const { staffId, staffName, dayIndex, startTime, endTime, type } = req.body;
    const id = crypto.randomUUID();
    db.prepare('INSERT INTO shifts (id, staffId, staffName, dayIndex, startTime, endTime, type) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(id, staffId, staffName, dayIndex, startTime, endTime, type);
    broadcast('shifts_updated');
    res.json({ id, staffId, staffName, dayIndex, startTime, endTime, type });
});

app.delete('/api/shifts/:id', (req, res) => {
    db.prepare('DELETE FROM shifts WHERE id = ?').run(req.params.id);
    broadcast('shifts_updated');
    res.json({ success: true });
});

// Reservations
app.get('/api/reservations', (req, res) => {
    try {
        const reservations = db.prepare('SELECT * FROM reservations').all();
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

app.post('/api/reservations', (req, res) => {
    try {
        const { customerName, phone, guestCount, date, time, notes, tableId } = req.body;
        const id = crypto.randomUUID();
        db.prepare(`
            INSERT INTO reservations (id, customerName, phone, guestCount, date, time, notes, status, tableId)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', ?)
        `).run(id, customerName, phone, guestCount, date, time, notes, tableId);
        broadcast('reservations_updated');
        res.json({ id });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

app.patch('/api/reservations/:id', (req, res) => {
    try {
        const updates = req.body;
        const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(updates);
        db.prepare(`UPDATE reservations SET ${fields} WHERE id = ?`).run(...values, req.params.id);
        broadcast('reservations_updated');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

app.post('/api/reservations/:id/status', (req, res) => {
    try {
        const { status, tableId } = req.body;
        db.prepare('UPDATE reservations SET status = ?, tableId = ? WHERE id = ?').run(status, tableId, req.params.id);

        if (status === 'seated' && tableId) {
            db.prepare('UPDATE tables SET status = "occupied" WHERE id = ?').run(tableId);
            broadcast('table_updated', tableId);
        }

        broadcast('reservations_updated');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// Inventory
app.get('/api/inventory', (req, res) => {
    try {
        const inventory = db.prepare('SELECT * FROM inventory').all();
        res.json(inventory);
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

app.post('/api/inventory', (req, res) => {
    try {
        const { name, category, price, stock, minStock, unit, supplier, isExternal, expiresAt, batchNote } = req.body;
        const id = crypto.randomUUID();
        db.prepare(`
            INSERT INTO inventory (id, name, category, price, stock, minStock, unit, supplier, isExternal, expiresAt, batchNote)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, name, category, price, stock, minStock, unit, supplier, isExternal ? 1 : 0, expiresAt, batchNote);
        broadcast('inventory_updated');
        res.json({ id });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

app.patch('/api/inventory/:id', (req, res) => {
    try {
        const updates = req.body;
        if (updates.isExternal !== undefined) updates.isExternal = updates.isExternal ? 1 : 0;
        const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
        const values = Object.values(updates);
        db.prepare(`UPDATE inventory SET ${fields} WHERE id = ?`).run(...values, req.params.id);
        broadcast('inventory_updated');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

app.delete('/api/inventory/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM inventory WHERE id = ?').run(req.params.id);
        broadcast('inventory_updated');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

app.post('/api/inventory/:id/stock', (req, res) => {
    try {
        const { id } = req.params;
        const { stock } = req.body;
        db.prepare('UPDATE inventory SET stock = ? WHERE id = ?').run(stock, id);
        broadcast('inventory_updated');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

// --- Socket.io ---
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
});

const PORT = process.env.PORT || 3005;
httpServer.listen(PORT, () => {
    console.log(`RestoPro Local Server running on port ${PORT}`);
});

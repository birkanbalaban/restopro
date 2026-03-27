import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Users, UtensilsCrossed, Package, Send, Trash2, Printer, CreditCard, Banknote, Percent, Move, CheckCircle2, AlertCircle, Clock, StickyNote, Settings, ArrowLeft, Loader2, LogOut } from 'lucide-react';
import { cn } from '../../utils';
import { Table, MenuItem, Order, Staff, SaleRecord, OrderItem } from '../../types';
import { firebaseService } from '../../services/firebaseService';

import { TableCard } from './TableCard';
import { MenuSelector } from './MenuSelector';
import { DraftSidebar } from './DraftSidebar';

export function FloorPlanView({
    tables,
    menuItems,
    orders,
    showToast,
    isManager,
    user,
    setTables,
    setOrders,
    setSales,
    currentStaff,
    staff,
    setActiveTab,
    onLogout
}: {
    tables: Table[],
    menuItems: MenuItem[],
    orders: Order[],
    showToast: (m: string, t?: 'success' | 'error') => void,
    isManager: boolean,
    user: any,
    setTables: React.Dispatch<React.SetStateAction<Table[]>>,
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>,
    setSales: React.Dispatch<React.SetStateAction<SaleRecord[]>>,
    currentStaff: Staff | null,
    staff: Staff[],
    setActiveTab?: (tab: string) => void,
    onLogout?: () => void
}) {
    const [activeSection, setActiveSection] = useState('Ana Salon');
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);
    const [isAddingItem, setIsAddingItem] = useState(false);
    const [orderDraft, setOrderDraft] = useState<OrderItem[]>([]);
    const [activeMenuCategory, setActiveMenuCategory] = useState('Tümü');
    const [isAddingTableModalOpen, setIsAddingTableModalOpen] = useState(false);
    const [newTableData, setNewTableData] = useState({ name: '', capacity: 4 });
    const [isTransferring, setIsTransferring] = useState(false);
    const [transferTarget, setTransferTarget] = useState<string | null>(null);
    const [waiterFilter, setWaiterFilter] = useState<string>('all');
    const [isPaymentMode, setIsPaymentMode] = useState(false);
    const [isPrintingReceipt, setIsPrintingReceipt] = useState(false);
    const [isSplitPaymentMode, setIsSplitPaymentMode] = useState(false);
    const [selectedSplitItems, setSelectedSplitItems] = useState<{ itemId: string, quantity: number }[]>([]);
    const [selectedTransferItems, setSelectedTransferItems] = useState<string[]>([]);
    const [isChangingWaiter, setIsChangingWaiter] = useState(false);
    const [selectedItemForMod, setSelectedItemForMod] = useState<MenuItem | null>(null);
    const [currentModifiers, setCurrentModifiers] = useState<Record<string, any[]>>({});
    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
    const [generalNote, setGeneralNote] = useState('');
    const [isPrintingKitchen, setIsPrintingKitchen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [kitchenTicketItems, setKitchenTicketItems] = useState<OrderItem[]>([]);

    const activeOrder = selectedTable ? orders.find(o => o.id === selectedTable.activeOrderId) : null;
    const splitTotal = activeOrder ? selectedSplitItems.reduce((acc, split) => {
        const item = activeOrder.items.find(i => i.id === split.itemId);
        return acc + (item ? item.price * split.quantity : 0);
    }, 0) : 0;



    const handleDeleteTable = async (id: string, name: string) => {
        if (!isManager) return;
        if (confirm(`${name} masasını silmek istediğinize emin misiniz?`)) {
            await firebaseService.deleteTable(id);
            showToast(`${name} başarıyla silindi.`);
        }
    };

    const handleItemClick = (item: MenuItem) => {
        if (item.modifierGroups && item.modifierGroups.length > 0) {
            setSelectedItemForMod(item);
            setCurrentModifiers({});
        } else {
            handleAddItem(item);
        }
    };

    const handleAddItem = (item: MenuItem, modifiers: { groupName: string, option: any }[] = [], note = '') => {
        const draftId = `draft-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const newDraftItem: OrderItem = {
            id: draftId,
            menuItemId: item.id,
            name: item.name,
            quantity: 1,
            price: item.price + modifiers.reduce((acc, m) => acc + m.option.price, 0),
            status: 'new',
            selectedModifiers: modifiers,
            note,
            printer: item.printer
        };
        setOrderDraft(prev => [...prev, newDraftItem]);
        setSelectedItemForMod(null);
        setCurrentModifiers({});
        showToast(`${item.name} taslağa eklendi.`, 'success');
    };

    const updateDraftQuantity = (id: string, delta: number) => {
        setOrderDraft(prev => prev.map(item =>
            item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
        ));
    };

    const updateDraftNote = (id: string, note: string) => {
        setOrderDraft(prev => prev.map(item =>
            item.id === id ? { ...item, note } : item
        ));
    };

    const handleRemoveDraftItem = (id: string) => {
        setOrderDraft(prev => prev.filter(item => item.id !== id));
    };

    const handleCompletePayment = async (method: 'card' | 'cash') => {
        if (!selectedTable || !activeOrder) return;

        const discountAmount = (activeOrder.discountAmount || 0) + (activeOrder.total * (activeOrder.discountPercent || 0) / 100);
        const finalTotal = activeOrder.total - discountAmount;

        const saleData: any = {
            tableId: selectedTable.id,
            tableName: selectedTable.name,
            subtotal: activeOrder.total,
            discountTotal: discountAmount,
            total: finalTotal,
            paymentMethod: method,
            itemsCount: activeOrder.items.length,
            items: activeOrder.items
        };

        await firebaseService.completeSale(saleData);
        await firebaseService.updateOrder(activeOrder.id, {
            status: 'completed',
            items: activeOrder.items.map(i => ({ ...i, status: 'paid' as const, paidQuantity: i.quantity }))
        });
        await firebaseService.updateTableStatus(selectedTable.id, 'free', { activeOrderId: undefined, currentOrderTotal: 0 });

        showToast(`Ödeme alındı (₺${finalTotal.toFixed(2)} - ${method === 'card' ? 'Kart' : 'Nakit'})`, 'success');
        setIsPaymentSuccess(true);
    };

    const handleSplitPayment = async (method: 'card' | 'cash') => {
        if (!selectedTable || !activeOrder || selectedSplitItems.length === 0) return;

        if (!user) {
            setOrders(prev => prev.map(o => {
                if (o.id === activeOrder.id) {
                    const updatedItems = o.items.map(item => {
                        const split = selectedSplitItems.find(s => s.itemId === item.id);
                        if (split) {
                            const currentPaid = item.paidQuantity || 0;
                            const newPaid = currentPaid + split.quantity;
                            const isFullyPaidItem = newPaid >= item.quantity;
                            return {
                                ...item,
                                paidQuantity: newPaid,
                                status: isFullyPaidItem ? 'paid' : item.status
                            } as OrderItem;
                        }
                        return item;
                    });
                    const allPaid = updatedItems.every(i => i.status === 'paid' || (i.paidQuantity || 0) >= i.quantity);
                    const newBalance = updatedItems.reduce((acc, i) => acc + (i.price * (i.quantity - (i.paidQuantity || 0))), 0);
                    return { ...o, items: updatedItems, total: newBalance, status: allPaid ? 'completed' : 'active' };
                }
                return o;
            }));

            // Sync Table state
            const allItemsPaidInTable = activeOrder.items.every(item => {
                const split = selectedSplitItems.find(s => s.itemId === item.id);
                const currentPaid = (item.paidQuantity || 0) + (split ? split.quantity : 0);
                return currentPaid >= item.quantity;
            });

            if (allItemsPaidInTable) {
                setTables(prev => prev.map(t => t.id === selectedTable.id ? {
                    ...t,
                    status: 'free',
                    activeOrderId: undefined,
                    currentOrderTotal: 0
                } : t));
                setSelectedTable(null);
            } else {
                const remainingTotal = activeOrder.items.reduce((acc, i) => {
                    const split = selectedSplitItems.find(s => s.itemId === i.id);
                    const currentPaid = (i.paidQuantity || 0) + (split ? split.quantity : 0);
                    return acc + (i.price * (i.quantity - currentPaid));
                }, 0);
                setTables(prev => prev.map(t => t.id === selectedTable.id ? { ...t, currentOrderTotal: remainingTotal } : t));
            }
        } else {
            const saleData: any = {
                tableId: selectedTable.id,
                tableName: selectedTable.name,
                subtotal: splitTotal,
                discountTotal: 0,
                total: splitTotal,
                paymentMethod: method,
                itemsCount: selectedSplitItems.length,
                items: activeOrder.items.filter(i => selectedSplitItems.some(s => s.itemId === i.id))
            };
            // Firebase split payment: 
            // 1. Update order (remove or decrease quantities of split items)
            const remainingItems = activeOrder.items.map(item => {
                const split = selectedSplitItems.find(s => s.itemId === item.id);
                if (split) {
                    return { ...item, quantity: item.quantity - split.quantity };
                }
                return item;
            }).filter(i => i.quantity > 0);

            const newTotal = remainingItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            await firebaseService.updateOrder(activeOrder.id, {
                items: remainingItems,
                total: newTotal
            });

            // 2. Log sale
            await firebaseService.completeSale(saleData);
        }

        showToast(`Parçalı ödeme alındı (₺${splitTotal.toFixed(2)})`, 'success');
        setSelectedSplitItems([]);
        if (activeOrder.items.length === selectedSplitItems.length) {
            setSelectedTable(null);
            setIsSplitPaymentMode(false);
        }
    };

    const handleConfirmOrder = async () => {
        if (!selectedTable || orderDraft.length === 0) return;

        try {
            // Get freshest table data to ensure we have the correct activeOrderId
            const latestTable = tables.find(t => t.id === selectedTable.id) || selectedTable;
            let targetOrderId = latestTable.activeOrderId;

            const itemsWithTimestamps = orderDraft.map(di => ({
                ...di,
                status: 'new' as const,
                statusTimestamps: { new: Date.now() }
            }));

            if (!targetOrderId) {
                // Create a completely new order
                const newOrderId = await firebaseService.createOrder({
                    tableId: latestTable.id,
                    tableName: latestTable.name,
                    waiterId: currentStaff?.id || 'staff',
                    waiterName: currentStaff?.name || 'Staff',
                    items: itemsWithTimestamps,
                    status: 'active',
                    total: itemsWithTimestamps.reduce((acc, i) => acc + (i.price * i.quantity), 0),
                    createdAt: Date.now(),
                    note: generalNote
                } as any);

                await firebaseService.updateTableStatus(latestTable.id, 'occupied', {
                    activeOrderId: newOrderId,
                    occupiedTime: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
                });
                showToast(`${latestTable.name} için yeni sipariş oluşturuldu.`, 'success');
            } else {
                // Add to existing order
                await firebaseService.addOrderItems(targetOrderId, itemsWithTimestamps);
                showToast(`Ürünler ${latestTable.name} siparişine eklendi.`, 'success');
            }

            setOrderDraft([]);
            setGeneralNote('');
            setIsAddingItem(false);
        } catch (error: any) {
            console.error("Order confirmation error:", error);
            showToast(`Sipariş onaylanamadı: ${error.message}`, 'error');
        }
    };

    const handleTransfer = async () => {
        if (!activeOrder || !transferTarget) return;

        const itemsToMove = selectedTransferItems.length > 0
            ? activeOrder.items.filter(i => selectedTransferItems.includes(i.id))
            : activeOrder.items;

        await firebaseService.updateOrder(activeOrder.id, { tableId: transferTarget });
        const isFullTransfer = itemsToMove.length === activeOrder.items.length;
        if (isFullTransfer) {
            await firebaseService.updateTableStatus(selectedTable!.id, 'free', { activeOrderId: undefined });
        }
        await firebaseService.updateTableStatus(transferTarget, 'occupied', { activeOrderId: activeOrder.id });

        showToast(`${itemsToMove.length} kalem ürün ${tables.find(t => t.id === transferTarget)?.name} masasına taşındı.`, 'success');
        setIsTransferring(false);
        setTransferTarget(null);
        setSelectedTransferItems([]);
        setSelectedTable(null);
    };

    const handleQuickAddTable = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isManager) return;

        const trimmedName = newTableData.name.trim();
        if (!trimmedName) {
            showToast('Masa adı boş olamaz.', 'error');
            return;
        }

        // Check for duplicate names in the current list
        const isDuplicate = tables.some(t => t.name.toLowerCase() === trimmedName.toLowerCase());
        if (isDuplicate) {
            showToast(`"${trimmedName}" isminde bir masa zaten mevcut.`, 'error');
            return;
        }

        const tableToCreate = {
            name: trimmedName,
            capacity: newTableData.capacity,
            section: activeSection,
            x: 100,
            y: 100,
            status: 'free' as const,
            currentOrderTotal: 0
        };

        setIsSubmitting(true);
        try {
            // Add a timeout for the firebase operation to prevent hanging if keys are invalid
            const addTablePromise = firebaseService.addTable(tableToCreate);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Bağlantı zaman aşımına uğradı. Firebase ayarlarınızı kontrol edin.")), 8000));

            await Promise.race([addTablePromise, timeoutPromise]);
            showToast(`${trimmedName} başarıyla eklendi.`, 'success');
        } catch (error: any) {
            console.error("Error adding table:", error);
            showToast(`Masa eklenemedi: ${error.message}`, 'error');
        } finally {
            setIsSubmitting(false);
            console.log("handleQuickAddTable: Ensuring modal close and state reset.");
            setIsAddingTableModalOpen(false);
            setNewTableData({ name: '', capacity: 4 });
            if (setActiveTab) setActiveTab('floorplan');
        }
    };

    const handleChangeWaiter = async (staffId: string, staffName: string) => {
        if (!selectedTable) return;
        await firebaseService.updateTableStatus(selectedTable.id, selectedTable.status, {
            waiterId: staffId,
            waiterName: staffName
        });
        showToast(`${selectedTable.name} masası ${staffName} personeline atandı.`, 'success');
        setIsChangingWaiter(false);
        setSelectedTable(prev => prev ? { ...prev, waiterId: staffId, waiterName: staffName } : null);
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Header & Controls */}
            <div className="flex flex-wrap items-center justify-between pb-4 gap-6">
                <div className="flex flex-col gap-6 w-full lg:w-auto">
                    {/* Section Selector */}
                    <div className="flex bg-[#252528] p-1.5 rounded-2xl border border-border/50 self-start">
                        {['Ana Salon', 'Teras', 'VIP'].map((section) => (
                            <button
                                key={section}
                                onClick={() => setActiveSection(section)}
                                className={cn(
                                    "px-8 py-3 rounded-xl text-sm font-bold transition-all",
                                    activeSection === section ? "bg-accent text-white shadow-lg" : "text-text-secondary hover:text-white"
                                )}
                            >
                                {section}
                            </button>
                        ))}
                    </div>

                    {/* Waiter Filter */}
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 no-scrollbar">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-secondary pr-4 border-r border-border/30">
                            <Users size={14} className="text-accent" /> Garson:
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setWaiterFilter('all')}
                                className={cn(
                                    "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                    waiterFilter === 'all' ? "bg-accent/20 text-accent border border-accent/30" : "bg-[#252528] text-text-secondary border border-border/50 hover:border-accent/40"
                                )}
                            >
                                Tümü
                            </button>
                            {staff.filter(s => s.role === 'waiter' || s.role === 'admin').map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setWaiterFilter(s.id)}
                                    className={cn(
                                        "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                        waiterFilter === s.id ? "bg-accent/20 text-accent border border-accent/30" : "bg-[#252528] text-text-secondary border border-border/50 hover:border-accent/40"
                                    )}
                                >
                                    {s.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4">
                    {isManager && (
                        <button
                            onClick={() => {
                                const nextNum = tables.length + 1;
                                setNewTableData({ name: `Masa ${nextNum} `, capacity: 4 });
                                setIsAddingTableModalOpen(true);
                            }}
                            className="bg-accent hover:bg-accent-hover text-white px-8 py-3 rounded-xl text-sm font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-accent/20 active:scale-95"
                        >
                            <Plus size={18} /> Masa Ekle
                        </button>
                    )}
                </div>
            </div>



            {/* Kitchen Ticket (Hidden on Screen, Visible on Print) */}
            {isPrintingKitchen && (
                <div id="printable-receipt" className="print-only">
                    <div className="text-center font-bold text-lg mb-4 border-b-4 border-black pb-2 uppercase tracking-tighter">
                        KDS - {kitchenTicketItems[0]?.printer === 'bar' ? 'BAR' : 'MUTFAK'} FİŞİ
                    </div>
                    <div className="flex justify-between text-xs mb-4 font-bold">
                        <span>MASA: {selectedTable?.name}</span>
                        <span>{new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="border-b border-black mb-2" />
                    <div className="space-y-4">
                        {kitchenTicketItems.map((item, idx) => (
                            <div key={idx} className="space-y-1">
                                <div className="flex justify-between text-2xl font-black">
                                    <span>{item.quantity} ADET</span>
                                    <span>{item.name}</span>
                                </div>
                                {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                    <p className="text-sm font-bold bg-black/5 p-1">MOD: {item.selectedModifiers.map(m => m.option.name).join(', ')}</p>
                                )}
                                {item.note && (
                                    <p className="text-sm font-black text-rose-600 underline">NOT: {item.note}</p>
                                )}
                            </div>
                        ))}
                    </div>
                    {generalNote && (
                        <div className="mt-6 pt-4 border-t-2 border-dashed border-black">
                            <p className="font-black text-lg">GENEL NOT: {generalNote}</p>
                        </div>
                    )}
                    <div className="mt-8 border-t border-black pt-2 text-center text-[10px]">
                        RESTOPRO MUTFAK SİSTEMİ
                    </div>
                </div>
            )}

            {/* Tables Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {[...tables]
                    .filter(t => t.section === activeSection && (waiterFilter === 'all' || t.waiterId === waiterFilter))
                    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))
                    .map((table) => {
                        const activeOrderForTable = orders.find(o => o.id === table.activeOrderId);
                        return (
                            <TableCard
                                key={table.id}
                                table={table}
                                activeOrder={activeOrderForTable}
                                isManager={isManager}
                                user={user}
                                currentStaff={currentStaff}
                                onDelete={handleDeleteTable}
                                onClick={(t) => {
                                    if (t.status === 'free') {
                                        firebaseService.createOrder({
                                            tableId: t.id,
                                            items: [],
                                            total: 0,
                                            status: 'active',
                                            createdAt: new Date().toISOString()
                                        }).then(orderId => {
                                            const occupiedTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                                            firebaseService.updateTableStatus(t.id, 'occupied', {
                                                activeOrderId: orderId,
                                                occupiedTime
                                            });
                                            showToast(`${t.name} hizmete açıldı.`, 'success');
                                            // Auto select and open menu
                                            setSelectedTable({ ...t, status: 'occupied', activeOrderId: orderId, occupiedTime });
                                            setIsAddingItem(true);
                                        });
                                    } else {
                                        setSelectedTable(t);
                                    }
                                }}
                                onTableAction={(t, action) => {
                                    // ... handled by onClick for now to match current behavior
                                }}
                            />
                        );
                    })}
            </div>

            {/* Add Table Modal */}
            <AnimatePresence>
                {isAddingTableModalOpen && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddingTableModalOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-md glass rounded-3xl p-10 shadow-2xl z-10"
                        >
                            <h3 className="text-2xl font-black mb-8">Yeni Masa Ekle</h3>
                            <form onSubmit={handleQuickAddTable} className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Masa Adı</label>
                                    <input
                                        required
                                        autoFocus
                                        type="text"
                                        value={newTableData.name}
                                        onChange={(e) => setNewTableData({ ...newTableData, name: e.target.value })}
                                        className="w-full bg-surface border border-border rounded-2xl px-5 py-4 focus:outline-none focus:border-accent text-lg"
                                        placeholder="Örn: VIP 1"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-xs font-black text-text-secondary uppercase tracking-widest">Kapasite</label>
                                    <input
                                        required
                                        type="number"
                                        min="1"
                                        value={newTableData.capacity}
                                        onChange={(e) => setNewTableData({ ...newTableData, capacity: Number(e.target.value) })}
                                        className="w-full bg-surface border border-border rounded-2xl px-5 py-4 focus:outline-none focus:border-accent text-lg"
                                    />
                                </div>
                                <div className="pt-6 flex gap-4">
                                    <button type="button" onClick={() => setIsAddingTableModalOpen(false)} className="flex-1 glass py-4 rounded-2xl font-black uppercase text-xs">İptal</button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 bg-accent hover:bg-accent-hover text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg shadow-accent/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Oluşturuluyor...
                                            </>
                                        ) : 'Masayı Oluştur'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Order Detail Modal */}
            <AnimatePresence>
                {selectedTable && (
                    <div className={cn("fixed inset-0 z-[100] flex items-center justify-center transition-all", isAddingItem ? "p-0" : "p-4 sm:p-6")}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => {
                                setSelectedTable(null);
                                setIsAddingItem(false);
                                setIsTransferring(false);
                                setIsPaymentMode(false);
                                setIsSplitPaymentMode(false);
                                setIsPrintingReceipt(false);
                                setIsPaymentSuccess(false);
                            }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className={cn(
                                "relative w-full glass shadow-2xl flex flex-col transition-all duration-500 ease-in-out",
                                isAddingItem ? "w-full h-full rounded-none" : "max-w-2xl max-h-[95vh] rounded-3xl overflow-hidden"
                            )}
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-border flex justify-between items-center bg-surface/50 relative">
                                <div className="flex items-center gap-4">
                                    {!isAddingItem && (
                                        <button onClick={() => { setSelectedTable(null); setIsAddingItem(false); setIsTransferring(false); setIsPaymentMode(false); setIsSplitPaymentMode(false); setIsPrintingReceipt(false); }} className="p-2 hover:bg-surface rounded-xl transition-colors text-text-secondary hover:text-white group">
                                            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                                        </button>
                                    )}
                                    <div>
                                        <div className="flex items-center gap-4">
                                            <h3 className="text-xl font-bold">{selectedTable.name}</h3>
                                            {!isAddingItem && !isTransferring && (
                                                <button
                                                    onClick={() => { setIsSplitPaymentMode(!isSplitPaymentMode); setSelectedSplitItems([]); }}
                                                    className={cn("px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", isSplitPaymentMode ? "bg-orange-500 text-white" : "glass text-text-secondary border border-border")}
                                                >
                                                    {isSplitPaymentMode ? 'Bölmeyi İptal Et' : 'Hesabı Böl'}
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-text-secondary text-xs font-medium mt-1">Açılış: {selectedTable.occupiedTime}</p>
                                    </div>
                                </div>

                                {/* Close Button */}
                                <button onClick={() => { setSelectedTable(null); setIsAddingItem(false); setIsTransferring(false); setIsPaymentMode(false); setIsSplitPaymentMode(false); setIsPrintingReceipt(false); }} className="p-2 hover:bg-surface rounded-xl transition-colors">
                                    <Plus size={24} className="rotate-45" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className={cn("flex-1 overflow-y-auto space-y-6", isAddingItem ? "p-0" : "p-6")}>
                                {isAddingItem ? (
                                    <div className="flex gap-0 h-full">
                                        <div className="flex-[1.8] flex flex-col p-6 overflow-hidden">
                                            {selectedItemForMod ? (
                                                <div className="flex flex-col h-full animate-in slide-in-from-left duration-300">
                                                    <div className="flex justify-between items-center mb-6">
                                                        <div className="flex items-center gap-3">
                                                            <img src={selectedItemForMod.image} alt="" className="w-12 h-12 rounded-xl object-cover" />
                                                            <h4 className="font-bold text-lg">{selectedItemForMod.name} (₺{selectedItemForMod.price})</h4>
                                                        </div>
                                                        <button onClick={() => setSelectedItemForMod(null)} className="glass px-4 py-2 rounded-xl text-sm font-bold">Vazgeç</button>
                                                    </div>
                                                    <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar">
                                                        {selectedItemForMod.modifierGroups?.map(group => (
                                                            <div key={group.name} className="space-y-4">
                                                                <div className="flex justify-between items-center bg-surface/30 p-3 rounded-xl">
                                                                    <h5 className="font-black text-xs uppercase opacity-70">{group.name}</h5>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-3">
                                                                    {group.options.map(opt => {
                                                                        const isSelected = currentModifiers[group.name]?.some(m => m.name === opt.name);
                                                                        return (
                                                                            <button
                                                                                key={opt.name}
                                                                                onClick={() => {
                                                                                    setCurrentModifiers(prev => {
                                                                                        const groupMods = prev[group.name] || [];
                                                                                        if (group.multiSelect) {
                                                                                            return isSelected ? { ...prev, [group.name]: groupMods.filter(m => m.name !== opt.name) } : { ...prev, [group.name]: [...groupMods, opt] };
                                                                                        }
                                                                                        return { ...prev, [group.name]: [opt] };
                                                                                    });
                                                                                }}
                                                                                className={cn("flex justify-between p-4 rounded-2xl border-2 transition-all", isSelected ? "bg-accent/10 border-accent" : "bg-surface/20 border-white/5")}
                                                                            >
                                                                                <span className="font-bold">{opt.name}</span>
                                                                                {opt.price > 0 && <span className="text-accent text-xs">+₺{opt.price}</span>}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button onClick={() => {
                                                        const flatMods = Object.entries(currentModifiers).flatMap(([groupName, options]) => (options as any[]).map(o => ({ groupName, option: o })));
                                                        handleAddItem(selectedItemForMod, flatMods);
                                                    }} className="w-full bg-accent text-white py-5 rounded-3xl font-black mt-6">Taslağa Ekle</button>
                                                </div>
                                            ) : (
                                                <MenuSelector
                                                    menuItems={menuItems}
                                                    orderDraft={orderDraft}
                                                    activeMenuCategory={activeMenuCategory}
                                                    setActiveMenuCategory={setActiveMenuCategory}
                                                    onItemClick={handleItemClick}
                                                    onClose={() => setIsAddingItem(false)}
                                                />
                                            )}
                                        </div>
                                        <DraftSidebar
                                            orderDraft={orderDraft}
                                            setOrderDraft={setOrderDraft}
                                            editingNoteId={editingNoteId}
                                            setEditingNoteId={setEditingNoteId}
                                            updateDraftNote={updateDraftNote}
                                            updateDraftQuantity={updateDraftQuantity}
                                            handleRemoveDraftItem={handleRemoveDraftItem}
                                            generalNote={generalNote}
                                            setGeneralNote={setGeneralNote}
                                            handleConfirmOrder={handleConfirmOrder}
                                        />
                                    </div>
                                ) : isTransferring ? (
                                    <div className="flex flex-col h-full space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                                        <div className="flex justify-between items-center shrink-0">
                                            <h4 className="font-black text-xl flex items-center gap-3"><Move className="text-purple-500" /> Transfer İşlemi</h4>
                                            <button onClick={() => { setIsTransferring(false); setSelectedTransferItems([]); }} className="text-rose-500 text-sm font-black uppercase tracking-widest px-4 py-2 hover:bg-rose-500/10 rounded-xl transition-all">İptal</button>
                                        </div>

                                        {/* Item Selection */}
                                        <div className="space-y-4 shrink-0">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary opacity-50">1. Taşınacak Ürünleri Seçin (Boş bırakılırsa tüm masa taşınır)</p>
                                            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar p-2 bg-surface/30 rounded-2xl border border-white/5">
                                                {activeOrder?.items.map(item => (
                                                    <div
                                                        key={item.id}
                                                        onClick={() => setSelectedTransferItems(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id])}
                                                        className={cn(
                                                            "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                                                            selectedTransferItems.includes(item.id) ? "bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/5 scale-[0.99]" : "bg-background border-white/5 hover:border-purple-500/40"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn("w-5 h-5 rounded-md flex items-center justify-center border transition-all", selectedTransferItems.includes(item.id) ? "bg-purple-500 border-purple-500 text-white" : "border-border")}>
                                                                {selectedTransferItems.includes(item.id) && <CheckCircle2 size={12} />}
                                                            </div>
                                                            <span className="font-bold text-sm tracking-tight">{item.quantity}x {item.name}</span>
                                                        </div>
                                                        <span className="text-text-secondary text-xs">₺{item.price * item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Table Selection */}
                                        <div className="space-y-4 shrink-0">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary opacity-50">2. Hedef Masayı Seçin</p>
                                            <div className="grid grid-cols-3 gap-3">
                                                {tables.filter(t => t.id !== selectedTable?.id && t.status === 'free').map(t => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => setTransferTarget(t.id)}
                                                        className={cn(
                                                            "glass p-4 rounded-2xl text-center transition-all border border-transparent flex flex-col items-center gap-1 group",
                                                            transferTarget === t.id ? "bg-purple-500 text-white shadow-xl shadow-purple-500/20 scale-105" : "hover:border-purple-500/40"
                                                        )}
                                                    >
                                                        <p className="font-black text-sm">{t.name}</p>
                                                        <p className={cn("text-[9px] font-bold uppercase tracking-widest opacity-60", transferTarget === t.id ? "text-white" : "text-text-secondary")}>{t.section}</p>
                                                    </button>
                                                ))}
                                                {tables.filter(t => t.id !== selectedTable?.id && t.status === 'free').length === 0 && (
                                                    <div className="col-span-3 py-10 text-center glass rounded-2xl border-dashed border-white/10 opacity-30">
                                                        <p className="text-xs">Uygun masa bulunamadı.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            disabled={!transferTarget}
                                            onClick={handleTransfer}
                                            className="w-full bg-purple-500 text-white py-6 rounded-3xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-purple-500/20 hover:bg-purple-600 transition-all disabled:opacity-20 active:scale-95 mt-auto border border-purple-400"
                                        >
                                            Transferi Tamamla
                                        </button>
                                    </div>
                                ) : isPrintingReceipt ? (
                                    <div className="flex flex-col h-[calc(100vh-250px)] animate-in slide-in-from-right duration-300">
                                        <div className="flex justify-between items-center mb-6">
                                            <h4 className="font-bold text-2xl">Adisyon Bastır</h4>
                                            <button onClick={() => setIsPrintingReceipt(false)} className="text-text-secondary text-sm font-bold bg-surface px-4 py-2 rounded-xl hover:bg-white/10 transition-colors">Kapat</button>
                                        </div>

                                        <div id="printable-receipt" className="flex-1 flex flex-col bg-white text-black p-4 font-mono relative overflow-y-auto shadow-2xl custom-scrollbar border border-black/5">
                                            <div className="text-center space-y-1 mb-6">
                                                <h2 className="text-xl font-black tracking-[0.2em]">RESTOPRO</h2>
                                                <p className="text-[10px] opacity-70">PROFESSIONAL POS SYSTEM</p>
                                                <div className="border-b border-dashed border-black/20 my-4" />
                                            </div>

                                            <div className="flex justify-between text-[11px] font-bold mb-4">
                                                <div className="space-y-1">
                                                    <p>TARİH: {new Date().toLocaleDateString('tr-TR')}</p>
                                                    <p>SAAT: {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                                <div className="text-right space-y-1">
                                                    <p>MASA: {selectedTable.name}</p>
                                                    <p>GARSON: {currentStaff?.name || 'Admin'}</p>
                                                </div>
                                            </div>

                                            <div className="border-b border-black mb-4" />

                                            <div className="w-full space-y-3 mb-8 text-[12px] font-bold">
                                                {activeOrder?.items.map(i => (
                                                    <div key={i.id} className="space-y-1">
                                                        <div className="flex justify-between">
                                                            <span className="flex-1">{i.name}</span>
                                                            <span className="ml-4 shrink-0">₺{(i.price * i.quantity).toFixed(2)}</span>
                                                        </div>
                                                        <div className="flex justify-between text-[10px] opacity-60">
                                                            <span>{i.quantity} ADET x ₺{i.price}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-auto space-y-2 pt-4 border-t-2 border-dashed border-black">
                                                <div className="flex justify-between text-sm font-bold">
                                                    <span>ARA TOPLAM</span>
                                                    <span>₺{activeOrder?.total.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between text-lg font-black pt-2">
                                                    <span>TOPLAM</span>
                                                    <span>₺{activeOrder ? (activeOrder.total - ((activeOrder.discountAmount || 0) + (activeOrder.total * (activeOrder.discountPercent || 0) / 100))).toFixed(2) : 0}</span>
                                                </div>
                                            </div>

                                            <div className="text-center mt-10 space-y-1">
                                                <p className="text-[11px] font-bold">TEŞEKKÜRLER!</p>
                                                <p className="text-[9px] opacity-50 italic">Yine Bekleriz</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mt-6">
                                            <button onClick={() => setIsPrintingReceipt(false)} className="bg-surface text-text-secondary py-5 rounded-2xl font-black uppercase text-xs hover:bg-white/5 transition-all">İptal</button>
                                            <button onClick={() => {
                                                window.print();
                                                firebaseService.updateTableStatus(selectedTable.id, 'bill-requested');
                                                showToast('Adisyon yazdırılıyor...', 'success');
                                                setIsPrintingReceipt(false);
                                            }} className="bg-orange-500 text-white py-5 rounded-2xl font-black uppercase text-xs shadow-xl shadow-orange-500/20 active:scale-95 transition-all">YAZDIR VE HESAP İSTE</button>
                                        </div>
                                    </div>
                                ) : isPaymentSuccess ? (
                                    <div className="flex flex-col items-center justify-center h-full py-12 text-center animate-in zoom-in duration-500">
                                        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-8 relative">
                                            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
                                            <CheckCircle2 size={48} className="text-emerald-500 relative z-10" />
                                        </div>
                                        <h3 className="text-3xl font-black mb-4 uppercase tracking-tight">Ödeme Tamamlandı</h3>
                                        <p className="text-text-secondary text-sm mb-12 max-w-[280px]">İşlem başarıyla kaydedildi ve masa kullanıma açıldı.</p>
                                        <div className="flex flex-col gap-4 w-full px-12">
                                            <button onClick={() => { setSelectedTable(null); setIsPaymentSuccess(false); setIsPaymentMode(false); }} className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all">Masalara Geri Dön</button>
                                            <button onClick={() => { if (onLogout) onLogout(); setSelectedTable(null); setIsPaymentSuccess(false); }} className="w-full py-5 glass border border-white/10 rounded-2xl font-black uppercase text-xs text-text-secondary hover:text-rose-500 hover:border-rose-500/30 transition-all flex items-center justify-center gap-2"><LogOut size={16} /> Genel Çıkış Yap</button>
                                        </div>
                                    </div>
                                ) : isPaymentMode ? (
                                    <div className="flex flex-col h-[calc(100vh-250px)] max-h-[600px] animate-in slide-in-from-right duration-300">
                                        <div className="flex justify-between items-center mb-6">
                                            <h4 className="font-bold text-2xl shrink-0">Ödeme Al</h4>
                                            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar mask-edges pr-2">
                                                <button onClick={() => { setIsSplitPaymentMode(!isSplitPaymentMode); setSelectedSplitItems([]); }} className={cn("text-xs font-bold px-4 py-2 rounded-xl transition-all whitespace-nowrap", isSplitPaymentMode ? "bg-accent text-white shadow-lg" : "bg-surface text-text-secondary hover:bg-white/10")}>Parçalı Ödeme</button>
                                                <button onClick={() => { setIsPaymentMode(false); setIsSplitPaymentMode(false); }} className="text-text-secondary text-sm font-bold bg-surface px-4 py-2 rounded-xl hover:bg-white/10 transition-colors">Vazgeç</button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-4xl font-black bg-accent/10 border border-accent/20 p-8 rounded-3xl shadow-xl shadow-accent/5 mb-6">
                                            <span>TOPLAM</span>
                                            <span className="text-accent">₺{activeOrder ? (activeOrder.total - ((activeOrder.discountAmount || 0) + (activeOrder.total * (activeOrder.discountPercent || 0) / 100))).toFixed(2) : 0}</span>
                                        </div>
                                        {isManager && !isSplitPaymentMode && (
                                            <div className="p-6 bg-rose-500/10 rounded-3xl border border-rose-500/20 flex flex-col gap-4 mb-6 relative overflow-hidden group">
                                                <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent pointer-events-none" />
                                                <div className="flex items-center gap-4 relative z-10">
                                                    <div className="p-3 bg-rose-500/20 rounded-2xl border border-rose-500/30">
                                                        <Percent className="text-rose-500" size={24} />
                                                    </div>
                                                    <div>
                                                        <h5 className="font-bold text-rose-500 text-lg">İndirim Uygula (Yönetici)</h5>
                                                        <p className="text-xs text-rose-400 font-medium">Siparişe özel indirim tanımlayın.</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => { const p = prompt('% İndirim?'); if (p && activeOrder) firebaseService.updateOrder(activeOrder.id, { discountPercent: Number(p) }); }} className="bg-rose-500 text-white w-full py-4 rounded-xl text-sm font-black shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-colors relative z-10 border border-rose-400">Yüzdelik İndirim Uygula</button>
                                            </div>
                                        )}
                                        {isSplitPaymentMode && (
                                            <div className="flex-1 min-h-[150px] overflow-y-auto space-y-2 pr-2 custom-scrollbar mb-6 bg-surface/30 p-2 rounded-3xl border border-border/30">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary/50 mb-2 px-2 mt-2">Ödenecek Ürünleri Seçin</p>
                                                {activeOrder?.items.filter(i => (i.quantity - (i.paidQuantity || 0)) > 0).map((item) => {
                                                    const isSelected = selectedSplitItems.some(s => s.itemId === item.id);
                                                    const splitInfo = selectedSplitItems.find(s => s.itemId === item.id);
                                                    const remainingToPay = item.quantity - (item.paidQuantity || 0);
                                                    return (
                                                        <div key={item.id} onClick={() => {
                                                            if (isSelected) {
                                                                setSelectedSplitItems(prev => prev.filter(s => s.itemId !== item.id));
                                                            } else {
                                                                if (remainingToPay > 1) {
                                                                    const q = prompt(`${item.name} - Kaç adet ödenecek ? (Kalan: ${remainingToPay})`, remainingToPay.toString());
                                                                    const num = parseInt(q || "0");
                                                                    if (num > 0 && num <= remainingToPay) setSelectedSplitItems(prev => [...prev, { itemId: item.id, quantity: num }]);
                                                                } else {
                                                                    setSelectedSplitItems(prev => [...prev, { itemId: item.id, quantity: 1 }]);
                                                                }
                                                            }
                                                        }} className={cn("flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer", isSelected ? "bg-accent/20 border-accent" : "bg-background border-white/5 hover:border-accent/40")}>
                                                            <div className="flex items-center gap-3">
                                                                <div className={cn("w-6 h-6 rounded-md flex items-center justify-center border", isSelected ? "bg-accent border-accent text-white" : "border-border")}>{isSelected && <CheckCircle2 size={14} />}</div>
                                                                <div>
                                                                    <h4 className="font-bold text-sm tracking-tight">{splitInfo ? `${splitInfo.quantity} /${item.quantity}` : `${remainingToPay}x`} {item.name}</h4>
                                                                    {(item.paidQuantity || 0) > 0 && <p className="text-[9px] text-orange-500 font-bold uppercase">{item.paidQuantity} adedi ödendi</p>}
                                                                </div>
                                                            </div>
                                                            <p className="font-bold text-accent">₺{(item.price * (splitInfo ? splitInfo.quantity : remainingToPay)).toFixed(2)}</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                        <div className="mt-auto pt-6 border-t border-border space-y-3">
                                            <div className="grid grid-cols-2 gap-4">
                                                {isSplitPaymentMode ? (
                                                    <>
                                                        <button onClick={() => handleSplitPayment('card')} disabled={selectedSplitItems.length === 0} className="bg-accent/20 text-accent hover:bg-accent/30 py-6 rounded-2xl font-black uppercase text-sm disabled:opacity-50 border border-accent/30 shadow-xl shadow-accent/5 transition-all">Kart Böl (₺{splitTotal.toFixed(2)})</button>
                                                        <button onClick={() => handleSplitPayment('cash')} disabled={selectedSplitItems.length === 0} className="bg-accent text-white hover:bg-accent-hover py-6 rounded-2xl font-black uppercase text-sm disabled:opacity-50 border border-accent shadow-xl shadow-accent/20 transition-all">Nakit Böl (₺{splitTotal.toFixed(2)})</button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button onClick={() => handleCompletePayment('card')} className="bg-surface hover:bg-white/5 border border-white/10 hover:border-accent/40 py-6 rounded-2xl font-black uppercase text-sm transition-colors text-white shadow-xl">Kart ile Öde</button>
                                                        <button onClick={() => handleCompletePayment('cash')} className="bg-accent text-white hover:bg-accent-hover py-6 rounded-2xl font-black uppercase text-sm shadow-xl shadow-accent/20 transition-all active:scale-95 border border-accent">Nakit Öde</button>
                                                    </>
                                                )}
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                <button onClick={() => { setIsPaymentMode(false); setIsSplitPaymentMode(false); }} className="w-full py-4 glass rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary hover:text-white transition-colors">Siparişe Geri Dön</button>
                                                <button
                                                    onClick={() => {
                                                        if (onLogout) onLogout();
                                                        setSelectedTable(null);
                                                        setIsPaymentMode(false);
                                                    }}
                                                    className="w-full py-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 transition-all flex items-center justify-center gap-2"
                                                >
                                                    <LogOut size={14} /> Genel Çıkış (Kitle)
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col h-full space-y-4">
                                        <div className="flex-1 min-h-[300px] overflow-y-auto space-y-4 pr-2 custom-scrollbar pb-6">
                                            {activeOrder?.items.length === 0 && <div className="h-full flex flex-col items-center justify-center text-text-secondary opacity-30 select-none"><UtensilsCrossed size={64} strokeWidth={1} className="mb-4" /><p>Henüz ürün eklenmemiş.</p></div>}
                                            {activeOrder?.items.map((item) => {
                                                const isFullyPaid = item.status === 'paid' || (item.paidQuantity || 0) >= item.quantity;
                                                const isPartiallyPaid = (item.paidQuantity || 0) > 0 && !isFullyPaid;
                                                const remainingQty = item.quantity - (item.paidQuantity || 0);
                                                return (
                                                    <div key={item.id} className={cn("flex items-start gap-4 p-4 rounded-2xl border transition-all bg-surface/30 border-white/5", isFullyPaid ? "opacity-50 grayscale border-emerald-500/20" : isPartiallyPaid ? "border-orange-500/20" : "")}>
                                                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center font-bold", isFullyPaid ? "bg-emerald-500/20 text-emerald-500" : isPartiallyPaid ? "bg-orange-500/20 text-orange-500" : "bg-accent/20 text-accent")}>{isFullyPaid ? <CheckCircle2 size={18} /> : `${item.quantity}x`}</div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className={cn("font-bold", isFullyPaid && "line-through opacity-70")}>{item.name}</h4>
                                                                {isFullyPaid && <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">ÖDENDİ</span>}
                                                            </div>
                                                            <p className="text-text-secondary text-[10px] mt-1 line-clamp-1">{item.selectedModifiers?.map(m => m.option.name).join(', ')}</p>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <p className="text-text-secondary text-xs">₺{item.price}</p>
                                                                {isPartiallyPaid && <span className="text-[9px] text-orange-500 font-black uppercase tracking-tighter">{item.paidQuantity} adedi ödendi</span>}
                                                            </div>
                                                        </div>
                                                        <div className="text-right shrink-0 flex flex-col items-end gap-2">
                                                            <p className={cn("font-bold", isFullyPaid && "line-through opacity-50")}>₺{item.price * item.quantity}</p>
                                                            {isManager && !isFullyPaid && <button onClick={() => { if (confirm(`${item.name} silinecek?`)) firebaseService.removeOrderItem(activeOrder.id, item.id); }} className="p-2 hover:bg-rose-500/20 text-rose-500 rounded-lg"><Trash2 size={16} /></button>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-border">
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 shrink-0">
                                                <button onClick={() => setIsAddingItem(true)} className="glass py-6 rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-accent/10 transition-all border border-transparent hover:border-accent/20"><Plus size={26} className="text-accent" /><span className="text-[10px] font-black uppercase tracking-widest text-accent">Ekle</span></button>
                                                <button onClick={() => setIsPrintingReceipt(true)} className="glass py-6 rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-orange-500/10 transition-all border border-transparent hover:border-orange-500/20"><Printer size={26} className="text-orange-500" /><span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Müşteri Hesap</span></button>
                                                <button onClick={() => setIsTransferring(true)} className="glass py-6 rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-purple-500/10 transition-all border border-transparent hover:border-purple-500/20"><Move size={26} className="text-purple-500" /><span className="text-[10px] font-black uppercase tracking-widest text-purple-500">Taşı</span></button>
                                                <button onClick={() => setIsPaymentMode(true)} className="bg-emerald-500/10 py-6 rounded-3xl flex flex-col items-center justify-center gap-3 hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/20 text-emerald-500 group shadow-lg shadow-emerald-500/20 active:scale-95"><CreditCard size={26} className="group-hover:scale-110 transition-transform" /><span className="text-[10px] font-black uppercase tracking-widest">Ödeme Al</span></button>
                                            </div>
                                            <button onClick={() => setSelectedTable(null)} className="w-full py-4 bg-surface/50 hover:bg-surface border border-white/5 hover:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary hover:text-white transition-all">Masalara Geri Dön</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

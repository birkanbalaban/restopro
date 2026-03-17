import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Map as MapIcon, 
  UtensilsCrossed, 
  Users, 
  Package, 
  Settings, 
  LogOut,
  Bell,
  Search,
  ChevronRight,
  Plus,
  TrendingUp,
  CreditCard,
  Banknote,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Filter,
  LogIn,
  Trash2,
  Move
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Firebase & Services
import { auth } from './firebase';
import { signInAnonymously, onAuthStateChanged, signOut, User, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { orderBy, limit } from 'firebase/firestore';
import { 
  subscribeToCollection, 
  seedDatabase, 
  updateTableStatus, 
  completeSale, 
  createOrder, 
  addOrderItem,
  updateInventoryItem,
  addStaffMember,
  updateStaffStatus,
  updateTablePosition,
  transferOrderItems,
  addMenuItem,
  deleteMenuItem,
  deleteStaffMember
} from './services/firebaseService';

// Types & Constants
import { Table, MenuItem, Staff, InventoryItem, SaleRecord, Order, OrderItem, ActivityLog } from './types';
import { TABLES, MENU_ITEMS, STAFF, INVENTORY, SALES } from './constants';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Icons / Components ---
const NotificationIcon = () => <Bell size={20} className="text-text-secondary hover:text-white transition-colors" />;
const SettingsIcon = () => <Settings size={20} className="text-text-secondary hover:text-white transition-colors" />;

// --- Components ---

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 50, x: '-50%' }}
    animate={{ opacity: 1, y: 0, x: '-50%' }}
    exit={{ opacity: 0, y: 50, x: '-50%' }}
    className={cn(
      "fixed bottom-8 left-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[300px]",
      type === 'success' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
    )}
  >
    {type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
    <span className="font-bold text-sm">{message}</span>
    <button onClick={onClose} className="ml-auto p-1 hover:bg-white/20 rounded-lg transition-colors">
      <Plus size={18} className="rotate-45" />
    </button>
  </motion.div>
);

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 group",
      active 
        ? "bg-surface-hover text-white font-semibold"
        : "text-text-secondary hover:text-white"
    )}
  >
    <Icon size={18} className={cn(active ? "text-white" : "text-text-secondary group-hover:text-white transition-colors")} />
    <span className="font-medium">{label}</span>
  </button>
);

const StatCard = ({ label, value, trend, icon: Icon, color }: any) => (
  <div className="glass p-6 rounded-3xl bg-[#252528] flex flex-col gap-4 border-none shadow-md">
    <div className="flex justify-between items-start">
      <div className={cn("p-3 rounded-2xl", color)}>
        <Icon size={24} className="text-white" />
      </div>
      {trend && (
        <span className={cn(
          "text-xs font-bold px-3 py-1 rounded-full",
          trend > 0 ? "bg-[#4ADE80]/10 text-[#4ADE80]" : "bg-rose-500/10 text-rose-500"
        )}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div>
      <p className="text-text-secondary text-sm font-semibold uppercase tracking-wider mb-1">{label}</p>
      <h3 className="text-3xl font-black text-white">{value}</h3>
    </div>
  </div>
);

// --- Views ---

const DashboardView = ({ sales, menuItems }: { sales: SaleRecord[], menuItems: MenuItem[] }) => (
  <div className="space-y-8 animate-in fade-in duration-500">
    <div className="flex items-center justify-between">
       <h2 className="text-2xl font-bold">Reports & Analytics</h2>
       <button className="bg-[#252528] px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-surface-hover transition-colors">
          <Clock size={16} /> Today
       </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard 
        label="Daily Revenue"
        value={`₺${sales.reduce((acc, s) => acc + s.total, 0).toLocaleString('tr-TR')}`} 
        trend={12} 
        icon={TrendingUp} 
        color="bg-accent"
      />
      <StatCard 
        label="Total Orders"
        value={sales.length} 
        trend={8} 
        icon={UtensilsCrossed} 
        color="bg-[#4ADE80]"
      />
      <StatCard 
        label="Cash Payments"
        value={`₺${sales.filter(s => s.paymentMethod === 'cash').reduce((acc, s) => acc + s.total, 0).toLocaleString('tr-TR')}`} 
        trend={-2} 
        icon={Banknote} 
        color="bg-[#FCD34D]"
      />
      <StatCard 
        label="Card Payments"
        value={`₺${sales.filter(s => s.paymentMethod === 'card').reduce((acc, s) => acc + s.total, 0).toLocaleString('tr-TR')}`} 
        trend={15} 
        icon={CreditCard} 
        color="bg-blue-500"
      />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 glass p-6 rounded-3xl bg-[#252528] border-none shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Recent Sales</h3>
          <button className="text-accent text-sm font-bold hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-text-secondary text-xs uppercase tracking-wider border-b border-border/50 pb-4">
                <th className="pb-4 font-bold">Table</th>
                <th className="pb-4 font-bold">Payment</th>
                <th className="pb-4 font-bold">Time</th>
                <th className="pb-4 font-bold">Items</th>
                <th className="pb-4 font-bold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {sales.map((sale) => (
                <tr key={sale.id} className="group hover:bg-white/5 transition-colors">
                  <td className="py-4 font-bold">{sale.tableName}</td>
                  <td className="py-4">
                    <span className={cn(
                      "flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full w-fit",
                      sale.paymentMethod === 'card' ? "bg-blue-500/10 text-blue-400" : "bg-[#4ADE80]/10 text-[#4ADE80]"
                    )}>
                      {sale.paymentMethod === 'card' ? <CreditCard size={14} /> : <Banknote size={14} />}
                      {sale.paymentMethod === 'card' ? 'Card' : 'Cash'}
                    </span>
                  </td>
                  <td className="py-4 text-text-secondary text-sm font-medium">{sale.timestamp}</td>
                  <td className="py-4 text-text-secondary text-sm font-medium">{sale.itemsCount} Items</td>
                  <td className="py-4 text-right font-black text-white">₺{sale.total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass p-6 rounded-3xl bg-[#252528] border-none shadow-md">
        <h3 className="text-xl font-bold mb-6">Top Sellers</h3>
        <div className="space-y-6">
          {menuItems.slice(0, 4).map((item, idx) => (
            <div key={item.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors">
              <div className="relative">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-14 h-14 rounded-xl object-cover border border-border/50"
                  referrerPolicy="no-referrer"
                />
                <span className="absolute -top-2 -left-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-lg">
                  {idx + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm truncate">{item.name}</h4>
                <p className="text-text-secondary text-xs mt-0.5">{item.category}</p>
              </div>
              <div className="text-right">
                <p className="font-black text-white">₺{item.price}</p>
                <p className="text-[#4ADE80] text-[10px] font-bold mt-0.5 flex items-center justify-end gap-0.5"><TrendingUp size={10} /> +12%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const FloorPlanView = ({ tables, menuItems, orders, showToast, isManager }: { tables: Table[], menuItems: MenuItem[], orders: Order[], showToast: (m: string, t?: 'success' | 'error') => void, isManager: boolean }) => {
  const [activeSection, setActiveSection] = useState('Ana Salon');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferTarget, setTransferTarget] = useState<string | null>(null);
  const [isMoveMode, setIsMoveMode] = useState(false);

  const stats = {
    occupancy: 84,
    liveRevenue: 1.2,
    peakWait: '12m',
    ordersHr: 48,
    revenue: 4821.00,
    target: 6000
  };
  
  // Modifiers state
  const [selectedItemForMod, setSelectedItemForMod] = useState<MenuItem | null>(null);
  const [currentModifiers, setCurrentModifiers] = useState<Record<string, any[]>>({});

  const activeOrder = selectedTable ? orders.find(o => o.id === selectedTable.activeOrderId && o.status === 'active') : null;

  const handleCompletePayment = async (method: 'card' | 'cash') => {
    if (!selectedTable || !activeOrder) return;
    
    await completeSale({
      tableId: selectedTable.id,
      tableName: selectedTable.name,
      total: activeOrder.total,
      paymentMethod: method,
      itemsCount: activeOrder.items.reduce((acc, i) => acc + i.quantity, 0)
    }, activeOrder.id);
    
    showToast(`${selectedTable.name} ödemesi tamamlandı.`, 'success');
    setSelectedTable(null);
  };

  const handleItemClick = (item: MenuItem) => {
    if (item.modifierGroups && item.modifierGroups.length > 0) {
      setSelectedItemForMod(item);
      const initialMods: Record<string, any[]> = {};
      item.modifierGroups.forEach(g => {
        if (g.required && g.options.length > 0) {
          initialMods[g.name] = [g.options[0]];
        } else {
          initialMods[g.name] = [];
        }
      });
      setCurrentModifiers(initialMods);
    } else {
      handleAddItem(item);
    }
  };

  const handleAddItem = async (item: MenuItem, modifiers?: { groupName: string, option: any }[]) => {
    if (!activeOrder) return;
    await addOrderItem(activeOrder.id, item, modifiers);
    showToast(`${item.name} eklendi.`, 'success');
    setIsAddingItem(false);
    setSelectedItemForMod(null);
  };

  const handleTransfer = async () => {
    if (!activeOrder || !transferTarget) return;
    await transferOrderItems(activeOrder.id, transferTarget, activeOrder.items);
    showToast(`Ürünler ${tables.find(t => t.id === transferTarget)?.name} masasına taşındı.`, 'success');
    setIsTransferring(false);
    setSelectedTable(null);
  };

  const handleTableMove = async (tableId: string, x: number, y: number) => {
    if (!isManager) return;
    await updateTablePosition(tableId, x, y);
  };
  
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center justify-between pb-4 gap-4">
        <div className="flex bg-[#252528] p-1 rounded-xl border border-border/50">
          {['Ana Salon', 'Teras', 'VIP'].map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={cn(
                "px-6 py-2 rounded-lg text-sm font-medium transition-all",
                activeSection === section ? "bg-accent text-white shadow-md" : "text-text-secondary hover:text-white"
              )}
            >
              {section}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {isManager && (
            <button 
              onClick={() => setIsMoveMode(!isMoveMode)}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all border",
                isMoveMode ? "bg-orange-500 text-white border-orange-500" : "bg-[#252528] text-text-secondary hover:text-white border-border/50"
              )}
              title="Masaları Taşı"
            >
              <Move size={18} />
            </button>
          )}

          <div className="h-6 w-px bg-border/50 mx-2" />

          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-2 text-text-secondary">
              <span className="w-2.5 h-2.5 rounded-full bg-[#4ADE80]" /> Boş
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FCD34D]" /> Dolu
            </div>
            <div className="flex items-center gap-2 text-text-secondary">
              <span className="w-2.5 h-2.5 rounded-full bg-[#A78BFA]" /> Hesap
            </div>
          </div>
        </div>

        {isManager && (
          <button className="bg-accent hover:bg-accent-hover text-white px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 transition-all shadow-lg shadow-accent/20">
            <Plus size={18} /> Masa Ekle
          </button>
        )}
      </div>

      <div className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6",
        isMoveMode && "border-2 border-dashed border-orange-500/30 p-4 rounded-3xl bg-orange-500/5"
      )}>
        {tables.filter(t => t.section === activeSection).map((table) => {
          const tableOrder = orders.find(o => o.id === table.activeOrderId && o.status === 'active');

          let bgColor = "bg-[#252528]";
          let borderColor = "border-transparent";
          let textColor = "text-text-secondary";
          let statusText = "BOŞ";

          if (table.status === 'occupied') {
             bgColor = "bg-[#2A231C]";
             borderColor = "border-[#FCD34D]/20";
             textColor = "text-[#FCD34D]";
             statusText = "DOLU";
          } else if (table.status === 'bill-requested') {
             bgColor = "bg-[#1E1C2A]";
             borderColor = "border-[#A78BFA]/20";
             textColor = "text-[#A78BFA]";
             statusText = "HESAP İSTENDİ";
          } else if (table.status === 'dirty') {
             bgColor = "bg-[#2A1C1C]";
             borderColor = "border-rose-500/20";
             textColor = "text-rose-500";
             statusText = "KONTROL GEREKİYOR";
          } else {
             textColor = "text-[#4ADE80]";
          }

          return (
            <motion.div
              key={table.id}
              layout
              whileHover={!isMoveMode ? { y: -4 } : {}}
              onClick={() => {
                 if (isMoveMode) return;
                 if (table.status === 'free') createOrder(table.id);
                 else if (table.status !== 'dirty') setSelectedTable(table);
              }}
              className={cn(
                "rounded-3xl p-6 border-2 transition-all cursor-pointer relative flex flex-col justify-between min-h-[220px]",
                bgColor, borderColor,
                isMoveMode && "cursor-move border-orange-500"
              )}
            >
              {isMoveMode && (
                <div className="absolute inset-0 bg-orange-500/10 flex items-center justify-center gap-2 z-10 rounded-3xl backdrop-blur-[2px]">
                  <button onClick={(e) => { e.stopPropagation(); handleTableMove(table.id, (table.x || 0) - 1, table.y || 0); }} className="p-2 glass rounded-lg hover:bg-white/20"><ChevronRight className="rotate-180" size={16} /></button>
                  <div className="flex flex-col gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleTableMove(table.id, table.x || 0, (table.y || 0) - 1); }} className="p-2 glass rounded-lg hover:bg-white/20"><ChevronRight className="-rotate-90" size={16} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleTableMove(table.id, table.x || 0, (table.y || 0) + 1); }} className="p-2 glass rounded-lg hover:bg-white/20"><ChevronRight className="rotate-90" size={16} /></button>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleTableMove(table.id, (table.x || 0) + 1, table.y || 0); }} className="p-2 glass rounded-lg hover:bg-white/20"><ChevronRight size={16} /></button>
                </div>
              )}

              <div className="flex justify-between items-start relative z-0">
                 <span className="text-4xl font-bold opacity-20">{table.name.replace('Masa ', '').padStart(2, '0')}</span>
                 {table.status === 'occupied' && (
                    <div className="flex items-center gap-1.5 text-[#FCD34D] font-bold text-sm bg-[#FCD34D]/10 px-3 py-1 rounded-full">
                      <Users size={14} /> 4
                    </div>
                 )}
                 {table.status === 'dirty' && (
                    <AlertCircle size={24} className="text-rose-500" />
                 )}
              </div>

              <div className="mt-4 relative z-0">
                 <h4 className="text-xl font-bold text-white mb-1">{table.name}</h4>
                 <p className={cn("text-xs font-bold tracking-wider", textColor)}>{statusText}</p>
              </div>

              <div className="mt-6 flex flex-col gap-2 relative z-0">
                 <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">{table.status === 'free' ? 'Kapasite:' : table.status === 'bill-requested' ? 'Hesap' : 'Toplam'}</span>
                    <span className="font-bold text-white">
                      {table.status === 'free' ? `${table.capacity}` : `₺${(table.currentOrderTotal || 0).toFixed(2)}`}
                    </span>
                 </div>
                 {table.status !== 'free' && table.status !== 'dirty' && (
                   <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Süre</span>
                      <span className="font-bold text-white">{table.occupiedTime || '0m'}</span>
                   </div>
                 )}
              </div>

              {table.status === 'dirty' && !isMoveMode && (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    updateTableStatus(table.id, 'free');
                  }}
                  className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-3xl opacity-0 hover:opacity-100 transition-opacity z-20"
                >
                  <span className="text-sm font-bold text-white uppercase tracking-wider bg-rose-500 px-6 py-2 rounded-full">Masayı Temizle</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-6">
        <div className="glass p-6 rounded-3xl bg-[#161618] flex flex-col justify-between">
           <div>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Servis İstatistikleri</p>
              <div className="flex justify-between items-end mb-1">
                 <h3 className="text-4xl font-black">{stats.occupancy}%</h3>
                 <span className="text-[#4ADE80] font-bold">+₺{stats.liveRevenue}k</span>
              </div>
              <div className="flex justify-between text-xs text-text-secondary">
                 <span>Doluluk</span>
                 <span>Canlı Ciro</span>
              </div>
           </div>
        </div>

        <div className="lg:col-span-2 glass p-6 rounded-3xl bg-[#252528] flex items-center justify-between">
           <div className="max-w-[50%]">
              <h3 className="text-xl font-bold mb-2">Servis Hızı</h3>
              <p className="text-sm text-text-secondary leading-relaxed mb-6">
                Ortalama masa süresi şu an 42 dakika. Dünkü öğle servisine göre %12 daha hızlı.
              </p>
              <div className="flex gap-4">
                 <div className="bg-white/5 px-4 py-2 rounded-2xl">
                    <p className="text-[10px] text-text-secondary uppercase font-bold mb-1">Zirve Bekleme</p>
                    <p className="text-lg font-bold">{stats.peakWait}</p>
                 </div>
                 <div className="bg-white/5 px-4 py-2 rounded-2xl">
                    <p className="text-[10px] text-text-secondary uppercase font-bold mb-1">Sipariş/Saat</p>
                    <p className="text-lg font-bold">{stats.ordersHr}</p>
                 </div>
              </div>
           </div>
           <div className="flex items-end gap-2 h-24">
              {[40, 70, 50, 60, 40, 90, 60].map((h, i) => (
                 <div key={i} className={cn("w-8 rounded-t-lg", i === 5 ? "bg-[#A78BFA]" : "bg-white/10")} style={{ height: `${h}%` }} />
              ))}
           </div>
        </div>

        <div className="glass p-6 rounded-3xl bg-[#1A3326] border border-[#4ADE80]/20 flex flex-col justify-between relative overflow-hidden">
           <div className="relative z-10">
              <p className="font-bold text-white mb-1">Günün Cirosu</p>
              <h3 className="text-4xl font-black text-[#4ADE80]">₺{stats.revenue.toLocaleString('tr-TR', {minimumFractionDigits: 2})}</h3>
           </div>
           <div className="relative z-10 mt-8">
              <div className="flex justify-between text-xs text-white/60 mb-2">
                 <span>Hedef: ₺{stats.target.toLocaleString('tr-TR')}</span>
                 <span>{Math.round((stats.revenue / stats.target) * 100)}%</span>
              </div>
              <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                 <div className="h-full bg-[#4ADE80] rounded-full" style={{ width: `${(stats.revenue / stats.target) * 100}%` }} />
              </div>
           </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedTable && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedTable(null);
                setIsAddingItem(false);
                setIsTransferring(false);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl glass rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-border flex justify-between items-center bg-surface/50">
                <div>
                  <h3 className="text-xl font-bold">{selectedTable.name} - Sipariş Detayı</h3>
                  <p className="text-text-secondary text-xs">Açılış: {selectedTable.occupiedTime}</p>
                </div>
                <button 
                  onClick={() => {
                    setSelectedTable(null);
                    setIsAddingItem(false);
                    setIsTransferring(false);
                  }}
                  className="p-2 hover:bg-surface rounded-xl transition-colors"
                >
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {isAddingItem ? (
                  <div className="space-y-4">
                    {selectedItemForMod ? (
                      <div className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold text-lg">{selectedItemForMod.name} Seçenekleri</h4>
                          <button onClick={() => setSelectedItemForMod(null)} className="text-accent text-sm font-bold">Geri Dön</button>
                        </div>
                        
                        <div className="space-y-6">
                          {selectedItemForMod.modifierGroups?.map(group => (
                            <div key={group.name} className="space-y-3">
                              <div className="flex justify-between items-center">
                                <h5 className="font-bold text-sm">{group.name}</h5>
                                {group.required && <span className="text-[10px] bg-rose-500/20 text-rose-500 px-2 py-0.5 rounded-full font-bold uppercase">Zorunlu</span>}
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                {group.options.map(option => {
                                  const isSelected = currentModifiers[group.name]?.some(mod => mod.name === option.name);
                                  return (
                                    <button
                                      key={option.name}
                                      onClick={() => {
                                        setCurrentModifiers(prev => {
                                          const groupMods = prev[group.name] || [];
                                          if (group.multiSelect) {
                                            if (isSelected) {
                                              return { ...prev, [group.name]: groupMods.filter(m => m.name !== option.name) };
                                            } else {
                                              return { ...prev, [group.name]: [...groupMods, option] };
                                            }
                                          } else {
                                            return { ...prev, [group.name]: [option] };
                                          }
                                        });
                                      }}
                                      className={cn(
                                        "flex justify-between items-center p-3 rounded-xl border transition-all text-left",
                                        isSelected ? "bg-accent/20 border-accent" : "bg-surface/30 border-border/50 hover:border-accent/50"
                                      )}
                                    >
                                      <span className="text-sm font-medium">{option.name}</span>
                                      {option.price > 0 && <span className="text-xs text-accent font-bold">+₺{option.price}</span>}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => {
                            // Check required groups
                            const missingRequired = selectedItemForMod.modifierGroups?.find(g => g.required && (!currentModifiers[g.name] || currentModifiers[g.name].length === 0));
                            if (missingRequired) {
                              showToast(`${missingRequired.name} seçimi zorunludur.`, 'error');
                              return;
                            }

                            // Flatten selected modifiers
                            const flatModifiers: { groupName: string, option: any }[] = [];
                            Object.entries(currentModifiers).forEach(([groupName, options]) => {
                              options.forEach(option => flatModifiers.push({ groupName, option }));
                            });

                            handleAddItem(selectedItemForMod, flatModifiers);
                          }}
                          className="w-full bg-accent text-white py-4 rounded-2xl font-bold mt-6"
                        >
                          Siparişe Ekle
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <h4 className="font-bold">Ürün Seçin</h4>
                          <button onClick={() => setIsAddingItem(false)} className="text-accent text-sm font-bold">Geri Dön</button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          {menuItems.map(item => (
                            <button 
                              key={item.id}
                              onClick={() => handleItemClick(item)}
                              className="flex items-center gap-3 p-3 rounded-2xl bg-surface/30 border border-border/50 hover:bg-accent/10 transition-all text-left"
                            >
                              <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover" referrerPolicy="no-referrer" />
                              <div className="flex-1 min-w-0">
                                <h5 className="font-bold text-sm truncate">{item.name}</h5>
                                <p className="text-accent text-xs font-bold">₺{item.price}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ) : isTransferring ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold">Hedef Masa Seçin</h4>
                      <button onClick={() => setIsTransferring(false)} className="text-accent text-sm font-bold">İptal</button>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {tables.filter(t => t.id !== selectedTable.id && t.status === 'free').map(t => (
                        <button
                          key={t.id}
                          onClick={() => setTransferTarget(t.id)}
                          className={cn(
                            "glass p-4 rounded-xl text-center hover:border-accent transition-all",
                            transferTarget === t.id && "border-accent bg-accent/10"
                          )}
                        >
                          <p className="font-bold">{t.name}</p>
                          <p className="text-[10px] text-text-secondary">{t.section}</p>
                        </button>
                      ))}
                    </div>
                    <button 
                      disabled={!transferTarget}
                      onClick={handleTransfer}
                      className="w-full bg-accent text-white py-4 rounded-2xl font-bold disabled:opacity-50"
                    >
                      Transferi Tamamla
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {activeOrder?.items.length === 0 && (
                        <div className="text-center py-12 text-text-secondary">
                          <UtensilsCrossed size={48} className="mx-auto mb-4 opacity-20" />
                          <p>Henüz ürün eklenmemiş.</p>
                        </div>
                      )}
                      {activeOrder?.items.map((item) => (
                        <div key={item.id} className="flex items-start gap-4 p-3 rounded-2xl bg-surface/30 border border-border/50">
                          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center font-bold text-accent shrink-0">
                            {item.quantity}x
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold truncate">{item.name}</h4>
                            {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                              <div className="mt-1 space-y-0.5">
                                {item.selectedModifiers.map((mod, idx) => (
                                  <p key={idx} className="text-[10px] text-text-secondary flex justify-between">
                                    <span>- {mod.option.name}</span>
                                    {mod.option.price > 0 && <span>+₺{mod.option.price}</span>}
                                  </p>
                                ))}
                              </div>
                            )}
                            <p className="text-text-secondary text-xs mt-1">Birim: ₺{item.price}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold">₺{item.price * item.quantity}</p>
                            <span className="text-[10px] text-emerald-500 font-bold uppercase">{item.status === 'new' ? 'Yeni' : item.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <button 
                        onClick={() => setIsAddingItem(true)}
                        className="glass p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-accent/10 hover:border-accent/50 transition-all group"
                      >
                        <Plus size={20} className="text-accent group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Ürün Ekle</span>
                      </button>
                      <button 
                        onClick={() => updateTableStatus(selectedTable.id, 'bill-requested')}
                        className="glass p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-orange-500/10 hover:border-orange-500/50 transition-all group"
                      >
                        <Banknote size={20} className="text-orange-500 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Hesap İste</span>
                      </button>
                      {isManager && (
                        <button 
                          onClick={() => setIsTransferring(true)}
                          className="glass p-4 rounded-2xl flex flex-col items-center gap-2 hover:bg-purple-500/10 hover:border-purple-500/50 transition-all group"
                        >
                          <Move size={20} className="text-purple-500 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Masa Taşı</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              {!isAddingItem && !isTransferring && (
                <div className="p-6 bg-surface/80 border-t border-border space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-text-secondary">
                      <span>Ara Toplam</span>
                      <span>₺{activeOrder ? (activeOrder.total * 0.8).toFixed(2) : 0}</span>
                    </div>
                    <div className="flex justify-between text-sm text-text-secondary">
                      <span>KDV (%20)</span>
                      <span>₺{activeOrder ? (activeOrder.total * 0.2).toFixed(2) : 0}</span>
                    </div>
                    <div className="flex justify-between text-xl font-black pt-2 border-t border-border">
                      <span>TOPLAM</span>
                      <span className="text-accent">₺{activeOrder?.total || 0}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => handleCompletePayment('card')}
                      className="bg-surface border border-border py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-surface-hover transition-all"
                    >
                      <CreditCard size={20} /> Kart
                    </button>
                    <button 
                      onClick={() => handleCompletePayment('cash')}
                      className="bg-accent hover:bg-accent-hover text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-accent/20 transition-all"
                    >
                      <CheckCircle2 size={20} /> Nakit
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MenuView = ({ menuItems, isManager, showToast }: { menuItems: MenuItem[], isManager: boolean, showToast: (m: string, t?: 'success' | 'error') => void }) => {
  const [activeCategory, setActiveCategory] = useState('Tümü');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [currentModifiers, setCurrentModifiers] = useState<Record<string, any[]>>({});
  const [newItem, setNewItem] = useState<Omit<MenuItem, 'id'>>({
    name: '',
    price: 0,
    category: 'Ana Yemek',
    image: 'https://picsum.photos/seed/food/200/200',
    description: '',
    isAvailable: true
  });

  const categories = ['Tümü', ...Array.from(new Set(menuItems.map(i => i.category)))];

  const handleItemClick = (item: MenuItem) => {
    setSelectedItem(item);
    if (item.modifierGroups && item.modifierGroups.length > 0) {
      const initialMods: Record<string, any[]> = {};
      item.modifierGroups.forEach(g => {
        if (g.required && g.options.length > 0) {
          initialMods[g.name] = [g.options[0]];
        } else {
          initialMods[g.name] = [];
        }
      });
      setCurrentModifiers(initialMods);
    } else {
      setCurrentModifiers({});
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManager) return;

    const categoryToUse = isNewCategory ? customCategory : newItem.category;
    
    if (isNewCategory && !customCategory.trim()) {
      showToast('Lütfen yeni kategori adını girin.', 'error');
      return;
    }

    await addMenuItem({ ...newItem, category: categoryToUse } as any);
    showToast(`${newItem.name} menüye eklendi.`, 'success');
    setIsAddingItem(false);
    setIsNewCategory(false);
    setCustomCategory('');
    setNewItem({
      name: '',
      price: 0,
      category: 'Ana Yemek',
      image: 'https://picsum.photos/seed/food/200/200',
      description: '',
      isAvailable: true
    });
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!isManager) return;
    if (confirm(`${name} ürününü silmek istediğinize emin misiniz?`)) {
      await deleteMenuItem(id);
      showToast(`${name} silindi.`, 'success');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                activeCategory === cat ? "bg-accent text-white" : "glass text-text-secondary hover:text-text-primary"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
            <input 
              type="text"
              placeholder="Ürün veya kategori ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 bg-surface border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          {isManager && (
            <button 
              onClick={() => setIsAddingItem(true)}
              className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap"
            >
              <Plus size={18} /> Yeni Ürün Ekle
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {menuItems.filter(i => {
          const matchesCategory = activeCategory === 'Tümü' || i.category === activeCategory;
          const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                i.category.toLowerCase().includes(searchQuery.toLowerCase());
          return matchesCategory && matchesSearch;
        }).map((item) => (
          <div 
            key={item.id} 
            onClick={() => handleItemClick(item)}
            className="glass rounded-2xl overflow-hidden group border-transparent hover:border-accent/30 transition-all relative cursor-pointer"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img 
                src={item.image} 
                alt={item.name} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold">
                ₺{item.price}
              </div>
              {isManager && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteItem(item.id, item.name);
                  }}
                  className="absolute top-3 left-3 bg-rose-500/80 hover:bg-rose-500 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <div className="p-5 space-y-2">
              <div className="flex justify-between items-start">
                <h4 className="font-bold">{item.name}</h4>
              </div>
              <p className="text-text-secondary text-xs line-clamp-2 leading-relaxed">
                {item.description}
              </p>
              <div className="pt-3 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-bold text-accent">{item.category}</span>
                <div className="flex items-center gap-1">
                  <div className={cn("w-2 h-2 rounded-full", item.isAvailable ? "bg-emerald-500" : "bg-rose-500")} />
                  <span className={cn("text-[10px] font-medium", item.isAvailable ? "text-emerald-500" : "text-rose-500")}>
                    {item.isAvailable ? 'Müsait' : 'Tükendi'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl glass rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="relative h-48 sm:h-64 shrink-0">
                <img 
                  src={selectedItem.image} 
                  alt={selectedItem.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition-colors"
                >
                  <Plus size={24} className="rotate-45" />
                </button>
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-accent mb-1 block">{selectedItem.category}</span>
                      <h3 className="text-3xl font-black text-white">{selectedItem.name}</h3>
                    </div>
                    <div className="text-2xl font-black text-white bg-accent px-4 py-2 rounded-xl">
                      ₺{selectedItem.price}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <p className="text-text-secondary leading-relaxed text-lg">
                  {selectedItem.description}
                </p>

                {selectedItem.modifierGroups && selectedItem.modifierGroups.length > 0 && (
                  <div className="space-y-6">
                    <h4 className="font-bold text-xl border-b border-border pb-2">Seçenekler</h4>
                    {selectedItem.modifierGroups.map(group => (
                      <div key={group.name} className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h5 className="font-bold text-lg">{group.name}</h5>
                          {group.required && <span className="text-xs bg-rose-500/20 text-rose-500 px-3 py-1 rounded-full font-bold uppercase tracking-wider">Zorunlu</span>}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {group.options.map(option => {
                            const isSelected = currentModifiers[group.name]?.some(mod => mod.name === option.name);
                            return (
                              <button
                                key={option.name}
                                onClick={() => {
                                  setCurrentModifiers(prev => {
                                    const groupMods = prev[group.name] || [];
                                    if (group.multiSelect) {
                                      if (isSelected) {
                                        return { ...prev, [group.name]: groupMods.filter(m => m.name !== option.name) };
                                      } else {
                                        return { ...prev, [group.name]: [...groupMods, option] };
                                      }
                                    } else {
                                      return { ...prev, [group.name]: [option] };
                                    }
                                  });
                                }}
                                className={cn(
                                  "flex justify-between items-center p-4 rounded-2xl border-2 transition-all text-left group",
                                  isSelected 
                                    ? "bg-accent/10 border-accent" 
                                    : "bg-surface/30 border-border/50 hover:border-accent/50 hover:bg-surface"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                                    group.multiSelect ? "rounded-md" : "rounded-full",
                                    isSelected ? "border-accent bg-accent" : "border-text-secondary group-hover:border-accent/50"
                                  )}>
                                    {isSelected && <CheckCircle2 size={14} className="text-white" />}
                                  </div>
                                  <span className={cn("font-medium", isSelected ? "text-text-primary" : "text-text-secondary")}>
                                    {option.name}
                                  </span>
                                </div>
                                {option.price > 0 && (
                                  <span className={cn("font-bold", isSelected ? "text-accent" : "text-text-secondary")}>
                                    +₺{option.price}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 bg-surface/80 border-t border-border shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-text-secondary font-medium mb-1">Toplam Tutar</p>
                    <p className="text-3xl font-black text-accent">
                      ₺{
                        selectedItem.price + 
                        Object.values(currentModifiers).flat().reduce((sum, mod) => sum + mod.price, 0)
                      }
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      // Check required groups
                      const missingRequired = selectedItem.modifierGroups?.find(g => g.required && (!currentModifiers[g.name] || currentModifiers[g.name].length === 0));
                      if (missingRequired) {
                        showToast(`${missingRequired.name} seçimi zorunludur.`, 'error');
                        return;
                      }
                      showToast('Bu özellik sipariş ekranında (Kat Planı) kullanılabilir.', 'success');
                      setSelectedItem(null);
                    }}
                    className="bg-accent hover:bg-accent-hover text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg shadow-accent/20 transition-all"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {isAddingItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingItem(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md glass rounded-3xl p-8 shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-6">Yeni Ürün Ekle</h3>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase">Ürün Adı</label>
                  <input 
                    required
                    type="text" 
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary uppercase">Fiyat (₺)</label>
                    <input 
                      required
                      type="number" 
                      value={newItem.price}
                      onChange={(e) => setNewItem({...newItem, price: Number(e.target.value)})}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary uppercase">Kategori</label>
                    <select 
                      value={isNewCategory ? 'NEW' : newItem.category}
                      onChange={(e) => {
                        if (e.target.value === 'NEW') {
                          setIsNewCategory(true);
                        } else {
                          setIsNewCategory(false);
                          setNewItem({...newItem, category: e.target.value});
                        }
                      }}
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent"
                    >
                      {categories.filter(c => c !== 'Tümü').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="NEW">+ Yeni Kategori Ekle...</option>
                    </select>
                  </div>
                </div>
                {isNewCategory && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                  >
                    <label className="text-xs font-bold text-text-secondary uppercase">Yeni Kategori Adı</label>
                    <input 
                      required
                      type="text" 
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Örn: Mezeler"
                      className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent"
                    />
                  </motion.div>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase">Açıklama</label>
                  <textarea 
                    value={newItem.description}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent h-24 resize-none"
                  />
                </div>
                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsAddingItem(false)}
                    className="flex-1 glass py-3 rounded-xl font-bold"
                  >
                    İptal
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-accent hover:bg-accent-hover text-white py-3 rounded-xl font-bold transition-all"
                  >
                    Ekle
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StaffView = ({ staff, logs, showToast, isManager }: { staff: Staff[], logs: ActivityLog[], showToast: (m: string, t?: 'success' | 'error') => void, isManager: boolean }) => {
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [newStaff, setNewStaff] = useState<Omit<Staff, 'id' | 'lastActive'>>({
    name: '',
    role: 'waiter',
    status: 'active',
    avatar: 'https://picsum.photos/seed/staff/200/200',
    pin: ''
  });

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManager) return;
    await addStaffMember(newStaff as any);
    showToast(`${newStaff.name} personele eklendi.`, 'success');
    setIsAddingStaff(false);
    setNewStaff({
      name: '',
      role: 'waiter',
      status: 'active',
      avatar: 'https://picsum.photos/seed/staff/200/200',
      pin: ''
    });
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (!isManager) return;
    if (confirm(`${name} isimli personeli silmek istediğinize emin misiniz?`)) {
      await deleteStaffMember(id);
      showToast(`${name} silindi.`, 'success');
    }
  };

  const toggleStatus = async (person: Staff) => {
    const newStatus = person.status === 'active' ? 'on-break' : 'active';
    await updateStaffStatus(person.id, newStatus, person.name);
    showToast(`${person.name} durumu güncellendi.`, 'success');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">Personel Yönetimi</h3>
        {isManager && (
          <button 
            onClick={() => setIsAddingStaff(true)}
            className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
          >
            <Plus size={18} /> Yeni Personel Ekle
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {staff.map((person) => (
            <div key={person.id} className="glass p-6 rounded-2xl flex items-center gap-4 card-hover">
              <div className="relative">
                <img 
                  src={person.avatar} 
                  alt={person.name} 
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-border" 
                />
                <div className={cn(
                  "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-surface",
                  person.status === 'active' ? "bg-emerald-500" : "bg-orange-500"
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold truncate">{person.name}</h4>
                <p className="text-text-secondary text-xs capitalize">{person.role}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-text-secondary">Son Görülme: {person.lastActive}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => toggleStatus(person)}
                  className="text-text-secondary hover:text-accent p-1"
                  title="Durum Değiştir"
                >
                  <Clock size={16} />
                </button>
                {isManager && (
                  <button 
                    onClick={() => handleDeleteStaff(person.id, person.name)}
                    className="text-text-secondary hover:text-rose-500 p-1"
                    title="Personeli Sil"
                  >
                    <LogOut size={16} className="rotate-180" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="glass p-8 rounded-3xl h-fit">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Clock size={20} className="text-accent" />
            Aktivite Günlüğü
          </h3>
          <div className="space-y-6">
            {logs.length > 0 ? logs.map((log) => (
              <div key={log.id} className="flex gap-4 relative">
                <div className="w-px bg-border absolute left-[11px] top-8 bottom-[-24px] last:hidden" />
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 z-10">
                  <div className="w-2 h-2 rounded-full bg-accent" />
                </div>
                <div>
                  <p className="text-sm font-bold">{log.staffName}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{log.action}</p>
                  <p className="text-[10px] text-text-secondary mt-1 font-medium uppercase tracking-wider">
                    {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : 'Şimdi'}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-sm text-text-secondary text-center py-4 italic">Henüz aktivite yok.</p>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isAddingStaff && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingStaff(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md glass rounded-3xl p-8 shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-6">Yeni Personel Ekle</h3>
              <form onSubmit={handleAddStaff} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase">Ad Soyad</label>
                  <input 
                    required
                    type="text" 
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent"
                    placeholder="Örn: Ahmet Yılmaz"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase">Rol</label>
                  <select 
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({...newStaff, role: e.target.value as any})}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent"
                  >
                    <option value="waiter">Garson</option>
                    <option value="chef">Aşçı</option>
                    <option value="manager">Müdür</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase">PIN Kodu (4 Hane)</label>
                  <input 
                    required
                    type="password" 
                    maxLength={4}
                    value={newStaff.pin}
                    onChange={(e) => setNewStaff({...newStaff, pin: e.target.value})}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent"
                    placeholder="Örn: 1234"
                  />
                </div>
                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setIsAddingStaff(false)}
                    className="flex-1 glass py-3 rounded-xl font-bold"
                  >
                    İptal
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-accent hover:bg-accent-hover text-white py-3 rounded-xl font-bold shadow-lg shadow-accent/20 transition-all"
                  >
                    Kaydet
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

const InventoryView = ({ inventory, showToast }: { inventory: InventoryItem[], showToast: (m: string, t?: 'success' | 'error') => void }) => {
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    await updateInventoryItem(editingItem.id, { stock: editingItem.stock });
    showToast(`${editingItem.name} stoğu güncellendi.`, 'success');
    setEditingItem(null);
  };

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-2xl border-l-4 border-l-rose-500">
          <h4 className="text-text-secondary text-sm font-medium">Kritik Stok</h4>
          <p className="text-3xl font-bold mt-2">{inventory.filter(i => i.stock <= i.minStock).length} <span className="text-sm font-normal text-text-secondary">Ürün</span></p>
        </div>
        <div className="glass p-6 rounded-2xl border-l-4 border-l-orange-500">
          <h4 className="text-text-secondary text-sm font-medium">Bekleyen Siparişler</h4>
          <p className="text-3xl font-bold mt-2">5 <span className="text-sm font-normal text-text-secondary">Tedarikçi</span></p>
        </div>
        <div className="glass p-6 rounded-2xl border-l-4 border-l-emerald-500">
          <h4 className="text-text-secondary text-sm font-medium">Toplam Envanter Değeri</h4>
          <p className="text-3xl font-bold mt-2">₺{inventory.reduce((acc, i) => acc + (i.stock * i.price), 0).toLocaleString('tr-TR')}</p>
        </div>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h3 className="font-bold">Stok Listesi</h3>
          <div className="flex gap-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input 
                type="text" 
                placeholder="Stok ara..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-bg border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-accent w-64"
              />
            </div>
            <button className="glass p-2 rounded-xl hover:text-accent transition-colors">
              <Filter size={18} />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-text-secondary text-sm bg-surface/30">
                <th className="px-6 py-4 font-medium">Ürün Adı</th>
                <th className="px-6 py-4 font-medium">Kategori</th>
                <th className="px-6 py-4 font-medium">Stok Miktarı</th>
                <th className="px-6 py-4 font-medium">Birim Fiyat</th>
                <th className="px-6 py-4 font-medium">Durum</th>
                <th className="px-6 py-4 font-medium text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{item.name}</td>
                  <td className="px-6 py-4 text-text-secondary text-sm">{item.category}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{item.stock}</span>
                      <span className="text-text-secondary text-xs">{item.unit}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">₺{item.price}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-1 rounded-full uppercase",
                      item.stock > item.minStock ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
                    )}>
                      {item.stock > item.minStock ? 'Yeterli' : 'Kritik'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setEditingItem(item)}
                      className="text-accent text-sm font-bold hover:underline"
                    >
                      Düzenle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingItem(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md glass rounded-3xl p-8 shadow-2xl"
            >
              <h3 className="text-xl font-bold mb-6">Stok Güncelle - {editingItem.name}</h3>
              <form onSubmit={handleUpdateStock} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase">Mevcut Stok ({editingItem.unit})</label>
                  <input 
                    required
                    type="number" 
                    value={editingItem.stock}
                    onChange={(e) => setEditingItem({...editingItem, stock: Number(e.target.value)})}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="pt-4 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="flex-1 glass py-3 rounded-xl font-bold"
                  >
                    İptal
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-accent hover:bg-accent-hover text-white py-3 rounded-xl font-bold shadow-lg shadow-accent/20 transition-all"
                  >
                    Güncelle
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main Layout ---

const KeypadLogin = ({ staff, onLogin, authError, user }: { staff: Staff[], onLogin: (s: Staff) => void, authError: string | null, user: User | null }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isIdentifying, setIsIdentifying] = useState(false);

  const handleNumber = (num: string) => {
    if (pin.length < 4) setPin(prev => prev + num);
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleLogin = () => {
    setIsIdentifying(true);
    // Find staff member with this PIN
    const foundStaff = staff.find(s => s.pin === pin);

    if (foundStaff) {
      onLogin(foundStaff);
    } else {
      setError('Hatalı PIN kodu!');
      setPin('');
      setTimeout(() => {
        setError('');
        setIsIdentifying(false);
      }, 2000);
    }
  };

  useEffect(() => {
    if (pin.length === 4) {
      handleLogin();
    }
  }, [pin]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-8 rounded-3xl max-w-md w-full space-y-8"
      >
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black tracking-tighter">RESTO<span className="text-accent">PRO</span></h1>
          <p className="text-text-secondary text-sm">Lütfen giriş yapmak için PIN kodunuzu girin</p>
          {!user && authError && (
            <p className="text-[10px] text-red-400">Bağlantı hatası: Firebase Anonymous Auth kapalı.</p>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex justify-center gap-4">
            {[1, 2, 3, 4].map((_, i) => (
              <div key={i} className={clsx(
                "w-4 h-4 rounded-full border-2 border-accent transition-all duration-200",
                pin.length > i ? "bg-accent scale-110 shadow-[0_0_10px_rgba(255,99,33,0.5)]" : "bg-transparent"
              )} />
            ))}
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-rose-500 text-center text-sm font-bold"
            >
              {error}
            </motion.p>
          )}

          {isIdentifying && !error && (
            <p className="text-accent text-center text-xs font-bold animate-pulse">Kimlik doğrulanıyor...</p>
          )}

          {staff.length === 0 && (
            <p className="text-rose-400 text-center text-[10px] animate-pulse">
              Dikkat: Personel listesi boş. Lütfen veritabanının yüklendiğinden emin olun.
            </p>
          )}

          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <button
                key={num}
                disabled={isIdentifying}
                onClick={() => handleNumber(num.toString())}
                className="glass h-16 rounded-2xl text-xl font-bold hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50"
              >
                {num}
              </button>
            ))}
            <button 
              disabled={isIdentifying}
              onClick={handleDelete} 
              className="glass h-16 rounded-2xl flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50"
            >
              <ChevronRight className="rotate-180" size={24} />
            </button>
            <button
              disabled={isIdentifying}
              onClick={() => handleNumber('0')}
              className="glass h-16 rounded-2xl text-xl font-bold hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50"
            >
              0
            </button>
            <button 
              disabled={true}
              className="glass h-16 rounded-2xl flex items-center justify-center opacity-20"
            >
              <CheckCircle2 size={24} />
            </button>
          </div>
        </div>

        <div className="pt-4 flex flex-col items-center gap-2">
          <button 
            onClick={() => {
              const provider = new GoogleAuthProvider();
              signInWithPopup(auth, provider).catch(console.error);
            }}
            className="text-[10px] text-text-secondary hover:text-accent uppercase tracking-widest font-bold opacity-20 hover:opacity-100 transition-all"
          >
            Yönetici Girişi (Kurtarma)
          </button>
          
          <button 
            onClick={() => seedDatabase(TABLES, MENU_ITEMS, STAFF, INVENTORY)}
            className="text-[8px] text-text-secondary hover:text-emerald-500 uppercase tracking-widest opacity-10 hover:opacity-100 transition-all"
          >
            Veritabanını Manuel Tetikle
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Data State
  const [tables, setTables] = useState<Table[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      if (!u) {
        signInAnonymously(auth).catch((error) => {
          console.error("Auth error:", error);
          setAuthError(error.code);
          setLoading(false);
          if (error.code === 'auth/admin-restricted-operation') {
            showToast("Lütfen Firebase Console'dan 'Anonymous Authentication'ı etkinleştirin.", 'error');
          }
        });
      } else {
        setUser(u);
        setAuthError(null);
        setLoading(false);
        // Seed database once on first login if needed
        seedDatabase(TABLES, MENU_ITEMS, STAFF, INVENTORY);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubTables = subscribeToCollection<Table>('tables', setTables);
    const unsubMenu = subscribeToCollection<MenuItem>('menu', setMenuItems);
    const unsubStaff = subscribeToCollection<Staff>('staff', setStaff);
    const unsubInventory = subscribeToCollection<InventoryItem>('inventory', setInventory);
    const unsubSales = subscribeToCollection<SaleRecord>('sales', setSales);
    const unsubOrders = subscribeToCollection<Order>('orders', setOrders);
    const unsubLogs = subscribeToCollection<ActivityLog>('activity_logs', setLogs, [orderBy('timestamp', 'desc'), limit(20)]);

    return () => {
      unsubTables();
      unsubMenu();
      unsubStaff();
      unsubInventory();
      unsubSales();
      unsubOrders();
      unsubLogs();
    };
  }, [user]);

  if (loading) return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!currentStaff) return (
    <KeypadLogin 
      staff={staff} 
      onLogin={setCurrentStaff} 
      authError={authError}
      user={user}
    />
  );

  const isManager = currentStaff.role === 'manager' || currentStaff.role === 'admin';

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView sales={sales} menuItems={menuItems} />;
      case 'floorplan': return <FloorPlanView tables={tables} menuItems={menuItems} orders={orders} showToast={showToast} isManager={isManager} />;
      case 'menu': return <MenuView menuItems={menuItems} isManager={isManager} showToast={showToast} />;
      case 'staff': return <StaffView staff={staff} logs={logs} showToast={showToast} isManager={isManager} />;
      case 'inventory': return <InventoryView inventory={inventory} showToast={showToast} />;
      default: return <DashboardView sales={sales} menuItems={menuItems} />;
    }
  };

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'floorplan': return 'Masa Düzeni';
      case 'menu': return 'Menü Kataloğu';
      case 'staff': return 'Personel';
      case 'inventory': return 'Stok Takibi';
      default: return 'RestoPro';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg text-text-primary">
      {/* Top Header */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-[#161618] sticky top-0 z-40">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">Resto<span className="text-accent">Pro</span></h1>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button onClick={() => setActiveTab('floorplan')} className={cn("transition-colors", activeTab === 'floorplan' ? "text-white" : "text-text-secondary hover:text-white")}>Masalar</button>
            <button onClick={() => setActiveTab('menu')} className={cn("transition-colors", activeTab === 'menu' ? "text-white" : "text-text-secondary hover:text-white")}>Menü</button>
            <button onClick={() => setActiveTab('staff')} className={cn("transition-colors", activeTab === 'staff' ? "text-white" : "text-text-secondary hover:text-white")}>Personel</button>
            <button onClick={() => setActiveTab('dashboard')} className={cn("transition-colors", activeTab === 'dashboard' ? "text-white" : "text-text-secondary hover:text-white")}>Raporlar</button>
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="Masa ara..."
              className="bg-[#0D0D0E] border border-border/50 rounded-full pl-10 pr-4 py-1.5 text-sm focus:outline-none focus:border-border text-white w-64 placeholder:text-zinc-600 transition-colors"
            />
          </div>
          <button className="relative">
            <NotificationIcon />
            <span className="absolute top-0 right-0 w-2 h-2 bg-white rounded-full" />
          </button>
          <button>
            <SettingsIcon />
          </button>
          <button className="flex items-center justify-center w-8 h-8 bg-orange-200 rounded-full border-2 border-border overflow-hidden" onClick={() => setCurrentStaff(null)} title="Logout">
            <img src={currentStaff.avatar || "https://i.pravatar.cc/150"} alt="Profile" className="w-full h-full object-cover" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <aside className="w-64 bg-[#1A1A1C] border-r border-border flex flex-col py-6">
          <div className="px-6 mb-8 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#3D5B66] rounded-full flex flex-col items-center justify-center">
               <div className="w-6 h-1 bg-white/20 mb-1 rounded-full"/>
               <div className="w-4 h-1 bg-white/40 rounded-full"/>
            </div>
            <div>
              <p className="font-bold text-white leading-tight">Ana Mutfak</p>
              <p className="text-xs text-text-secondary">Vardiya: Sabah</p>
            </div>
          </div>
          <nav className="flex-1 px-3 space-y-1">
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
            <SidebarItem icon={Package} label="Stok Takibi" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
            <SidebarItem icon={Users} label="Rezervasyonlar" active={false} onClick={() => {}} />
            <SidebarItem icon={TrendingUp} label="Analizler" active={false} onClick={() => {}} />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 bg-[#161618] overflow-y-auto">

          {/* View Content */}
          <div className="p-8 max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {toast && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => setToast(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

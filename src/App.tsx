import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Map as MapIcon,
  ChefHat,
  Users,
  Package,
  Settings,
  LogOut,
  Bell,
  Search,
  Shield,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './utils';

// API & Socket Services
import { apiService } from './services/apiService';
import { socketService } from './services/socketService';
import { Toast } from './components/shared/Toast';

// Types & Constants
import { Table, MenuItem, Staff, InventoryItem, SaleRecord, Order, ActivityLog, Reservation, Shift } from './types';
import { TABLES, MENU_ITEMS, STAFF, INVENTORY, RESERVATIONS } from './constants';
import { SidebarItem } from './components/layout/SidebarItem';
import { DashboardView } from './views/DashboardView';
import { KeypadLogin } from './views/KeypadLogin';
import { MenuView } from './views/MenuView';
import { InventoryView } from './views/InventoryView';
import { ReservationsView } from './views/Reservations';
import { StaffView } from './views/StaffView';
import { KitchenView } from './views/KitchenView';
import { FloorPlanView } from './views/FloorPlan';
import { SettingsView } from './views/SettingsView';
import { usePrinters } from './hooks/usePrinters';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState<any>(null);
  const [currentStaff, setCurrentStaff] = useState<Staff | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Data State
  const [tables, setTables] = useState<Table[]>(TABLES);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU_ITEMS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [staff, setStaff] = useState<Staff[]>(STAFF);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>(INVENTORY);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>(RESERVATIONS);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const { printers, addPrinter, updatePrinter, deletePrinter } = usePrinters();

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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
      setMenuItems(m);
      setStaff(s);
      setInventory(i);
      setReservations(r);
      setSales(sl);
      setShifts(sh);
    } catch (error) {
      // Failed to fetch initial data - handle silently or show user-facing error
    }
  };

  const fetchOrders = () => {
    return apiService.getOrders().then(o => {
      setOrders(o);
    });
  };

  useEffect(() => {
    fetchData();
    fetchOrders();
    socketService.connect();

    socketService.on('table_updated', () => apiService.getTables().then(setTables));
    socketService.on('orders_updated', fetchOrders);
    socketService.on('staff_updated', () => apiService.getStaff().then(setStaff));
    socketService.on('shifts_updated', () => apiService.getShifts().then(setShifts));
    socketService.on('inventory_updated', () => apiService.getInventory().then(setInventory));
    socketService.on('sales_updated', () => apiService.getSales().then(setSales));
    socketService.on('reservations_updated', () => apiService.getReservations().then(setReservations));

    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    setCurrentStaff(null);
    showToast('Oturum kapatıldı.');
  };

  // Session Auto-Lock (5 minutes)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const lockSession = () => {
      setCurrentStaff(null);
      setToast({ message: 'Güvenlik: Oturum zaman aşımına uğradı.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    };

    const resetTimer = () => {
      clearTimeout(timeoutId);
      if (currentStaff) {
        timeoutId = setTimeout(lockSession, 5 * 60 * 1000); // 5 mins
      }
    };

    if (currentStaff) {
      resetTimer();
      window.addEventListener('mousemove', resetTimer);
      window.addEventListener('mousedown', resetTimer);
      window.addEventListener('keypress', resetTimer);
      window.addEventListener('touchstart', resetTimer);
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('mousedown', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
    };
  }, [currentStaff]);

  if (!currentStaff) {
    return (
      <>
        <KeypadLogin
          staff={staff}
          onLogin={(s) => {
            setCurrentStaff(s);
            if (s.role !== 'admin' && s.role !== 'manager') setActiveTab('floorplan');
            showToast(`Hoş geldin, ${s.name}`);
          }}
          user={null}
        />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        <div className="fixed bottom-8 right-8 z-[200]">
          <button
            onClick={() => {
              // Local seed call
              fetch('http://localhost:3005/api/seed', { method: 'POST' })
                .then(() => fetchData())
                .then(() => showToast('Demo verileri yüklendi.'));
            }}
            className="bg-white/5 hover:bg-white/10 text-white/20 hover:text-white/60 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all"
          >
            Demo Verilerini Yükle
          </button>
        </div>
      </>
    );
  }

  const isManager = currentStaff.role === 'admin' || currentStaff.role === 'manager';

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView sales={sales} menuItems={menuItems} />;
      case 'floorplan':
        return <FloorPlanView tables={tables} menuItems={menuItems} orders={orders} showToast={showToast} isManager={isManager} user={null} setTables={setTables} setOrders={setOrders} setSales={setSales} currentStaff={currentStaff} staff={staff} />;
      case 'kitchen':
        return <KitchenView orders={orders} user={null} setOrders={setOrders} />;
      case 'menu':
        return <MenuView menuItems={menuItems} isManager={isManager} showToast={showToast} printers={printers} />;
      case 'inventory':
        return <InventoryView inventory={inventory} showToast={showToast} isManager={isManager} setInventory={setInventory} />;
      case 'reservations':
        return <ReservationsView reservations={reservations} tables={tables} onAddReservation={(r: any) => apiService.addReservation(r)} showToast={showToast} setReservations={setReservations} user={null} />;
      case 'staff':
        return <StaffView staff={staff} logs={activityLogs} shifts={shifts} isManager={isManager} showToast={showToast} setStaff={setStaff} setShifts={setShifts} user={null} />;
      case 'settings':
        return <SettingsView showToast={showToast} printers={printers} onAddPrinter={addPrinter} onUpdatePrinter={updatePrinter} onDeletePrinter={deletePrinter} />;
      default:
        return <DashboardView sales={sales} menuItems={menuItems} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#0f0f10] text-text font-['Inter'] selection:bg-accent/30 selection:text-white overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarCollapsed ? 100 : 300 }}
        className="bg-[#161618] border-r border-white/5 flex flex-col relative z-10 shadow-2xl"
      >
        <div className="p-8 mb-8 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {!isSidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-4"
              >
                <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-lg shadow-accent/20">
                  <ChefHat className="text-white" size={24} />
                </div>
                <h2 className="text-xl font-black tracking-tighter">RESTOPRO</h2>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-text-secondary"
          >
            <ChevronRight className={cn("transition-transform duration-500", !isSidebarCollapsed && "rotate-180")} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto no-scrollbar">
          {isManager && <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} collapsed={isSidebarCollapsed} />}
          <SidebarItem icon={MapIcon} label="Masalar" active={activeTab === 'floorplan'} onClick={() => setActiveTab('floorplan')} collapsed={isSidebarCollapsed} />
          <SidebarItem icon={ChefHat} label="Mutfak" active={activeTab === 'kitchen'} onClick={() => setActiveTab('kitchen')} collapsed={isSidebarCollapsed} />
          {isManager && <SidebarItem icon={Package} label="Envanter" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} collapsed={isSidebarCollapsed} />}
          <SidebarItem icon={Calendar} label="Rezervasyonlar" active={activeTab === 'reservations'} onClick={() => setActiveTab('reservations')} collapsed={isSidebarCollapsed} />
          {isManager && <SidebarItem icon={Users} label="Personel" active={activeTab === 'staff'} onClick={() => setActiveTab('staff')} collapsed={isSidebarCollapsed} />}
          {isManager && <SidebarItem icon={Settings} label="Ayarlar" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} collapsed={isSidebarCollapsed} />}
        </nav>

        <div className="p-6 mt-auto">
          <div className={cn(
            "p-4 rounded-3xl bg-white/5 border border-white/5 flex items-center gap-4 transition-all",
            isSidebarCollapsed ? "justify-center" : "justify-between"
          )}>
            {!isSidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent to-purple-500 p-0.5">
                  <div className="w-full h-full rounded-full bg-[#161618] flex items-center justify-center">
                    <span className="text-xs font-black">{currentStaff.name[0]}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-black truncate max-w-[100px]">{currentStaff.name}</p>
                  <p className="text-[10px] text-text-secondary uppercase tracking-widest">{(currentStaff.role === 'admin' || currentStaff.role === 'manager') ? 'Yönetici' : 'Personel'}</p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="p-3 hover:bg-rose-500/10 text-rose-500 rounded-2xl transition-all active:scale-90"
              title="Çıkış Yap"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-bg z-20">
        {/* Header */}
        <header className="h-24 border-b border-white/5 flex items-center justify-between px-10 relative z-40 bg-bg/80 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black tracking-tighter">
              {activeTab === 'dashboard' ? 'Dashboard' :
                activeTab === 'floorplan' ? 'Masalar & Yerleşim' :
                  activeTab === 'kitchen' ? 'Mutfak Ekranı' :
                    activeTab === 'menu' ? 'Dijital Menü' :
                      activeTab === 'inventory' ? 'Stok Takibi' :
                        activeTab === 'reservations' ? 'Rezervasyonlar' :
                          activeTab === 'staff' ? 'Personel Yönetimi' : 'Sistem Ayarları'}
            </h1>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4 bg-[#161618] p-1.5 rounded-2xl border border-white/5">
              <button
                onClick={() => isManager && setActiveTab('settings')}
                className="p-2.5 rounded-xl hover:bg-white/5 text-text-secondary transition-colors"
              >
                <Settings size={20} />
              </button>
              <div className="relative">
                <button className="p-2.5 rounded-xl hover:bg-white/5 text-text-secondary transition-colors">
                  <Bell size={20} />
                </button>
                <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-[#161618]" />
              </div>
            </div>

            {isManager && (
              <div className="flex items-center gap-3 bg-accent/10 py-2.5 px-6 rounded-2xl border border-accent/20">
                <Shield size={16} className="text-accent" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">Yönetici Modu</span>
              </div>
            )}
          </div>
        </header>

        {/* View Container */}
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar relative">
          {renderView()}
        </div>

        {/* Floating Background Glows */}
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/5 blur-[120px] rounded-full pointer-events-none z-10" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none z-10" />
      </main>

      {/* Global Components */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

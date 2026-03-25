import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PackageSearch, AlertCircle, Plus, Edit2, Trash2, X, Info, Search, Shield } from 'lucide-react';
import { cn } from '../utils';
import { InventoryItem } from '../types';
import { apiService } from '../services/apiService';

export const InventoryView = ({
  inventory,
  showToast,
  isManager,
  setInventory,
}: {
  inventory: InventoryItem[];
  showToast: (m: string, t?: 'success' | 'error') => void;
  isManager: boolean;
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
}) => {
  const [editingItem, setEditingItem] = useState<InventoryItem | Partial<InventoryItem> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'external' | 'expiring'>('all');

  /* ---- SKT helpers ---- */
  const daysUntilExpiry = (dateStr?: string): number | null => {
    if (!dateStr) return null;
    const diff = new Date(dateStr).getTime() - new Date().setHours(0, 0, 0, 0);
    return Math.ceil(diff / 86400000);
  };

  const expiryStatus = (dateStr?: string): 'expired' | 'critical' | 'warning' | 'ok' | null => {
    const days = daysUntilExpiry(dateStr);
    if (days === null) return null;
    if (days < 0) return 'expired';
    if (days === 0) return 'critical';
    if (days <= 2) return 'critical';
    if (days <= 5) return 'warning';
    return 'ok';
  };

  const expiryLabel = (dateStr?: string): string => {
    const days = daysUntilExpiry(dateStr);
    if (days === null) return '';
    if (days < 0) return `${Math.abs(days)} gün geçti!`;
    if (days === 0) return 'Bugün sona eriyor!';
    if (days === 1) return 'Yarın sona eriyor';
    return `${days} gün kaldı`;
  };

  /* ---- Filters ---- */
  const baseFiltered = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.supplier || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredInventory = baseFiltered.filter(item => {
    if (activeFilter === 'critical') return item.stock <= item.minStock;
    if (activeFilter === 'external') return item.isExternal;
    if (activeFilter === 'expiring') {
      const s = expiryStatus(item.expiresAt);
      return s === 'expired' || s === 'critical' || s === 'warning';
    }
    return true;
  });

  /* ---- Stats ---- */
  const expiringCount = inventory.filter(i => {
    const s = expiryStatus(i.expiresAt);
    return s === 'expired' || s === 'critical' || s === 'warning';
  }).length;
  const criticalCount = inventory.filter(i => i.stock <= i.minStock).length;
  const externalCount = inventory.filter(i => i.isExternal).length;
  const totalValue = inventory.reduce((acc, i) => acc + i.stock * i.price, 0);

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name) return;

    if (!isManager) {
      if ('id' in editingItem) {
        setInventory(prev => prev.map(i => i.id === editingItem.id ? { ...i, stock: editingItem.stock! } : i));
        try { await apiService.updateInventoryStock(editingItem.id!, editingItem.stock!); } catch { }
        showToast(`${editingItem.name} stok güncellendi.`, 'success');
      }
    } else {
      if ('id' in editingItem) {
        setInventory(prev => prev.map(i => i.id === editingItem.id ? { ...(editingItem as InventoryItem) } : i));
        try { await apiService.updateInventoryItem(editingItem.id!, editingItem as InventoryItem); } catch { }
        showToast(`${editingItem.name} güncellendi.`, 'success');
      } else {
        try {
          const res = await apiService.addInventoryItem(editingItem as Omit<InventoryItem, 'id'>) as { id: string };
          const newItem = { ...editingItem, id: res.id || `inv-${Date.now()}` } as InventoryItem;
          setInventory(prev => [...prev, newItem]);
          showToast(`${editingItem.name} eklendi.`, 'success');
        } catch {
          const newItem = { ...editingItem, id: `inv-${Date.now()}` } as InventoryItem;
          setInventory(prev => [...prev, newItem]);
          showToast(`${editingItem.name} eklendi (Yerel).`, 'success');
        }
      }
    }
    setEditingItem(null);
  };

  const handleDeleteItem = async () => {
    if (!editingItem || !('id' in editingItem)) return;
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;

    setInventory(prev => prev.filter(i => i.id !== editingItem.id));
    try {
      if (editingItem.id && !editingItem.id.startsWith('inv-')) {
        await apiService.deleteInventoryItem(editingItem.id);
      }
    } catch { }
    showToast(`${editingItem.name} silindi.`, 'success');
    setEditingItem(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* --- Stats Row --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Kritik Stok', value: criticalCount, unit: 'Ürün', color: 'border-rose-500', textColor: 'text-rose-500', bg: 'bg-rose-500/10', filter: 'critical' as const },
          { label: 'SKT Yaklaşıyor', value: expiringCount, unit: 'Ürün', color: 'border-amber-500', textColor: 'text-amber-500', bg: 'bg-amber-500/10', filter: 'expiring' as const },
          { label: 'Dışarıdan Gelen', value: externalCount, unit: 'Kalem', color: 'border-blue-500', textColor: 'text-blue-400', bg: 'bg-blue-500/10', filter: 'external' as const },
          { label: 'Envanter Değeri', value: `₺${totalValue.toLocaleString('tr-TR')}`, unit: '', color: 'border-emerald-500', textColor: 'text-emerald-400', bg: 'bg-emerald-500/10', filter: 'all' as const },
        ].map(card => (
          <button
            key={card.label}
            onClick={() => setActiveFilter(card.filter)}
            className={cn(
              'glass p-6 rounded-3xl border-l-4 text-left transition-all active:scale-95 hover:ring-2 hover:ring-white/10',
              card.color,
              activeFilter === card.filter ? 'ring-2 ring-accent/50' : ''
            )}
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-70">{card.label}</p>
            <p className={cn('text-3xl font-black mt-3 tabular-nums', card.textColor)}>
              {card.value}
              {card.unit && <span className={cn('text-xs font-black ml-2 px-2 py-0.5 rounded-full', card.bg)}>{card.unit}</span>}
            </p>
          </button>
        ))}
      </div>

      {/* --- SKT Uyarı Paneli --- */}
      {expiringCount > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-amber-400 font-black text-sm uppercase tracking-widest">
            <AlertCircle size={16} /> Son Kullanma Tarihi Uyarıları
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {inventory
              .filter(i => expiryStatus(i.expiresAt) !== null && expiryStatus(i.expiresAt) !== 'ok')
              .sort((a, b) => (daysUntilExpiry(a.expiresAt) ?? 999) - (daysUntilExpiry(b.expiresAt) ?? 999))
              .map(item => {
                const st = expiryStatus(item.expiresAt);
                return (
                  <div key={item.id} className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-2xl border',
                    st === 'expired' ? 'bg-rose-500/10 border-rose-500/30' :
                      st === 'critical' ? 'bg-orange-500/10 border-orange-500/30' :
                        'bg-amber-500/10 border-amber-500/20'
                  )}>
                    <div className={cn(
                      'w-2.5 h-2.5 rounded-full shrink-0',
                      st === 'expired' ? 'bg-rose-500 animate-pulse' :
                        st === 'critical' ? 'bg-orange-500 animate-pulse' : 'bg-amber-400'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm truncate">{item.name}</p>
                      <p className="text-[10px] text-text-secondary">{item.supplier && `${item.supplier} · `}{item.stock} {item.unit} mevcut</p>
                    </div>
                    <span className={cn(
                      'text-[10px] font-black shrink-0',
                      st === 'expired' ? 'text-rose-400' :
                        st === 'critical' ? 'text-orange-400' : 'text-amber-400'
                    )}>
                      {expiryLabel(item.expiresAt)}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* --- Table Section --- */}
      <div className="glass rounded-[48px] overflow-hidden shadow-2xl border-white/5">
        <div className="p-8 border-b border-border/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-wrap">
          <h3 className="text-2xl font-black uppercase tracking-tighter">Stok Listesi</h3>
          <div className="flex gap-3 flex-wrap items-center">
            {/* Filter chips */}
            <div className="flex bg-[#252528] p-1 rounded-xl gap-1">
              {([
                { key: 'all', label: 'Tümü' },
                { key: 'critical', label: '🔴 Kritik' },
                { key: 'external', label: '🚚 Dışarıdan' },
                { key: 'expiring', label: '⏰ SKT' },
              ] as const).map(f => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all',
                    activeFilter === f.key ? 'bg-accent text-white shadow-lg' : 'text-text-secondary hover:text-white'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {isManager && (
              <button
                onClick={() => setEditingItem({ name: '', category: 'İçecek', price: 0, stock: 0, minStock: 10, unit: 'adet', isExternal: false })}
                className="bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg flex items-center gap-2 active:scale-95"
              >
                <Plus size={16} /> Yeni Ürün
              </button>
            )}
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
              <input
                type="text"
                placeholder="Ara…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-bg/50 border-2 border-border/50 rounded-xl pl-10 pr-4 py-3 text-sm font-bold focus:outline-none focus:border-accent w-48 sm:w-64"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-text-secondary text-[10px] font-black uppercase tracking-[0.2em] bg-surface/30">
                <th className="px-6 py-5">Ürün Adı</th>
                <th className="px-4 py-5 text-center">Kategori</th>
                <th className="px-4 py-5 text-center">Stok</th>
                <th className="px-4 py-5">Tedarikçi</th>
                <th className="px-6 py-5 min-w-[180px]">SKT (Son Kullanma)</th>
                <th className="px-4 py-5 text-center">Durum</th>
                <th className="px-6 py-5 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredInventory.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-16 text-center text-text-secondary opacity-40 font-bold">
                    Bu filtreyle eşleşen ürün bulunamadı.
                  </td>
                </tr>
              )}
              {filteredInventory.map((item) => {
                const expSt = expiryStatus(item.expiresAt);
                const days = daysUntilExpiry(item.expiresAt);
                return (
                  <tr key={item.id} className="hover:bg-accent/5 transition-all group">
                    {/* Name */}
                    <td className="px-6 py-6 border-l-2 border-transparent group-hover:border-accent">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-base group-hover:text-accent transition-colors">{item.name}</span>
                        {item.isExternal && (
                          <span className="text-[9px] font-black bg-blue-500/15 text-blue-400 border border-blue-500/25 px-2 py-0.5 rounded-full uppercase tracking-widest shrink-0">
                            Dışarıdan
                          </span>
                        )}
                      </div>
                      {item.batchNote && (
                        <p className="text-[10px] text-text-secondary opacity-60 mt-0.5 font-medium">{item.batchNote}</p>
                      )}
                    </td>
                    {/* Category */}
                    <td className="px-4 py-6 text-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-secondary bg-black/20 px-3 py-1 rounded-full">{item.category}</span>
                    </td>
                    {/* Stock */}
                    <td className="px-4 py-6">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-2">
                          <span className={cn('font-black text-xl tabular-nums', item.stock <= item.minStock ? 'text-rose-400' : '')}>{item.stock}</span>
                          <span className="text-[10px] text-text-secondary font-bold uppercase opacity-50">{item.unit}</span>
                        </div>
                        <div className="mt-1.5 w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full transition-all', item.stock <= item.minStock ? 'bg-rose-500' : item.stock <= item.minStock * 2 ? 'bg-amber-500' : 'bg-emerald-500')}
                            style={{ width: `${Math.min((item.stock / (item.minStock * 3)) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    {/* Supplier */}
                    <td className="px-4 py-6 text-sm text-text-secondary font-medium">
                      {item.supplier || <span className="opacity-30">—</span>}
                    </td>
                    {/* SKT */}
                    <td className="px-6 py-6 min-w-[180px]">
                      {item.expiresAt ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-black tabular-nums">{item.expiresAt}</span>
                          <span className={cn(
                            'text-[9px] font-black px-2 py-0.5 rounded-md border w-fit uppercase tracking-wider',
                            expSt === 'expired' ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' :
                              expSt === 'critical' ? 'bg-orange-500/15 text-orange-400 border-orange-500/30' :
                                expSt === 'warning' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          )}>
                            {expiryLabel(item.expiresAt)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-text-secondary opacity-20 font-medium text-xs">—</span>
                      )}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-6 text-center">
                      <span className={cn(
                        'text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest',
                        item.stock > item.minStock ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                      )}>
                        {item.stock > item.minStock ? 'Yeterli' : 'Kritik'}
                      </span>
                    </td>
                    {/* Edit */}
                    <td className="px-6 py-6 text-right">
                      <button
                        onClick={() => setEditingItem({ ...item })}
                        className="bg-accent/10 hover:bg-accent text-accent hover:text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
                      >
                        Düzenle
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Edit Modal --- */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingItem(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg glass rounded-[44px] p-8 sm:p-10 shadow-2xl border-white/5 max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-black mb-2 tracking-tighter text-center uppercase">
                {'id' in editingItem ? 'Stok Güncelle' : 'Yeni Ürün'}
              </h3>
              <p className="text-center text-accent font-bold mb-8">{editingItem.name || 'Yeni Stok Kalemi'}</p>

              <form onSubmit={handleUpdateStock} className="space-y-5">
                {(!('id' in editingItem) || isManager) && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Ürün Adı</label>
                      <input required type="text" value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} className="w-full bg-surface/50 border-2 border-border/50 rounded-2xl px-5 py-3.5 focus:border-accent text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Kategori</label>
                        <input required type="text" value={editingItem.category} onChange={e => setEditingItem({ ...editingItem, category: e.target.value })} className="w-full bg-surface/50 border-2 border-border/50 rounded-2xl px-5 py-3.5 focus:border-accent text-sm" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Birim Fiyat (₺)</label>
                        <input required type="number" step="0.01" value={editingItem.price} onChange={e => setEditingItem({ ...editingItem, price: Number(e.target.value) })} className="w-full bg-surface/50 border-2 border-border/50 rounded-2xl px-5 py-3.5 focus:border-accent text-sm" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Stock qty */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Mevcut Stok ({editingItem.unit || 'adet'})</label>
                    <input
                      required
                      type="number"
                      step="0.1"
                      value={editingItem.stock}
                      onChange={(e) => setEditingItem({ ...editingItem, stock: Number(e.target.value) })}
                      className="w-full bg-surface/50 border-2 border-border/50 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-accent font-black text-lg text-center tabular-nums"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Kritik Stok</label>
                    <input
                      required
                      type="number"
                      step="0.1"
                      disabled={!isManager}
                      value={editingItem.minStock}
                      onChange={(e) => setEditingItem({ ...editingItem, minStock: Number(e.target.value) })}
                      className="w-full bg-surface/50 border-2 border-border/50 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-accent font-black text-lg text-center tabular-nums disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Manager-only fields */}
                {isManager && (
                  <>
                    <div className="border-t border-border/40 pt-5 space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-accent flex items-center gap-2">
                        <Shield size={12} /> Yönetici Alanları
                      </p>

                      {/* Supplier */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Tedarikçi</label>
                        <input
                          type="text"
                          placeholder="Tedarikçi adı…"
                          value={editingItem.supplier || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, supplier: e.target.value })}
                          className="w-full bg-surface/50 border-2 border-border/50 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-accent font-medium text-sm"
                        />
                      </div>

                      {/* isExternal toggle */}
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Dışarıdan Temin</label>
                        <button
                          type="button"
                          onClick={() => setEditingItem({ ...editingItem, isExternal: !editingItem.isExternal })}
                          className={cn(
                            'w-12 h-6 rounded-full transition-all relative',
                            editingItem.isExternal ? 'bg-accent' : 'bg-white/10'
                          )}
                        >
                          <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all', editingItem.isExternal ? 'left-[26px]' : 'left-0.5')} />
                        </button>
                      </div>

                      {/* SKT */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Son Kullanma Tarihi</label>
                        <input
                          type="date"
                          value={editingItem.expiresAt || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, expiresAt: e.target.value || undefined })}
                          className="w-full bg-surface/50 border-2 border-border/50 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-accent font-medium text-sm"
                        />
                      </div>

                      {/* Batch note */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Parti / Lot Notu</label>
                        <input
                          type="text"
                          placeholder="Lot #... – Teslimat tarihi vb."
                          value={editingItem.batchNote || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, batchNote: e.target.value })}
                          className="w-full bg-surface/50 border-2 border-border/50 rounded-2xl px-5 py-3.5 focus:outline-none focus:border-accent font-medium text-sm"
                        />
                      </div>
                    </div>
                  </>
                )}
                {/* Actions */}
                <div className="flex gap-4 pt-6">
                  {isManager && 'id' in editingItem && (
                    <button type="button" onClick={handleDeleteItem} className="w-14 items-center justify-center flex bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl transition-all font-bold">
                      <Trash2 size={20} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="flex-1 bg-surface border-2 border-border/50 text-white rounded-2xl px-4 py-4 font-black uppercase tracking-widest text-xs hover:bg-white/5 transition-all"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-accent hover:bg-accent-hover text-white rounded-2xl px-4 py-4 font-black uppercase tracking-widest text-xs shadow-xl shadow-accent/20 active:scale-95 transition-all"
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
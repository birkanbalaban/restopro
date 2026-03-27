import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Utensils, AlertCircle, Plus, Edit2, Trash2, X, Image as ImageIcon,
  ChevronDown, Search, Filter, Eye, Settings, CheckCircle2
} from 'lucide-react';
import { cn } from '../utils';
import { MenuItem, PrinterConfig } from '../types';
import { firebaseService } from '../services/firebaseService';

export function MenuView({ menuItems, isManager, showToast, printers = [] }: { menuItems: MenuItem[], isManager: boolean, showToast: (m: string, t?: 'success' | 'error') => void, printers?: PrinterConfig[] }) {
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
    isAvailable: true,
    printer: printers[0]?.id || 'kitchen'
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

    await firebaseService.addMenuItem({ ...newItem, category: categoryToUse } as any);
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
      isAvailable: true,
      printer: printers[0]?.id || 'kitchen'
    });
  };

  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !isManager) return;

    await firebaseService.updateMenuItem(editingItem.id, editingItem);
    showToast(`${editingItem.name} güncellendi.`, 'success');
    setEditingItem(null);
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    if (!isManager) return;
    await firebaseService.updateMenuItem(item.id, { isAvailable: !item.isAvailable });
    showToast(`${item.name} artık ${!item.isAvailable ? 'satışta' : 'tükendi'}.`, 'success');
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (!isManager) return;
    if (confirm(`${name} ürününü silmek istediğinize emin misiniz?`)) {
      await firebaseService.deleteMenuItem(id);
      showToast(`${name} silindi.`, 'success');
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest transition-all",
                activeCategory === cat ? "bg-accent text-white shadow-lg" : "glass text-text-secondary hover:text-text-primary active:scale-95"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={20} />
            <input
              type="text"
              placeholder="Ürün veya kategori ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-80 bg-surface border border-border rounded-2xl pl-12 pr-5 py-4 text-sm focus:outline-none focus:border-accent transition-colors shadow-sm"
            />
          </div>
          {isManager && (
            <button
              onClick={() => setIsAddingItem(true)}
              className="bg-accent hover:bg-accent-hover text-white px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all whitespace-nowrap shadow-lg shadow-accent/20 active:scale-95"
            >
              <Plus size={20} /> Yeni Ürün Ekle
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {menuItems.filter(i => {
          const matchesCategory = activeCategory === 'Tümü' || i.category === activeCategory;
          const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            i.category.toLowerCase().includes(searchQuery.toLowerCase());
          return matchesCategory && matchesSearch;
        }).map((item) => (
          <div
            key={item.id}
            onClick={() => handleItemClick(item)}
            className="glass rounded-[40px] overflow-hidden group border-2 border-transparent hover:border-accent/30 transition-all relative cursor-pointer active:scale-95 shadow-lg"
          >
            <div className="p-8 pb-0 space-y-6">
              <div className="flex justify-between items-center bg-accent/5 p-6 rounded-[28px] border border-accent/10">
                <div className="bg-accent/20 w-16 h-16 rounded-3xl flex items-center justify-center">
                  <Utensils size={32} className="text-accent" />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Fiyat</p>
                  <p className="text-3xl font-black text-accent tracking-tighter">₺{item.price}</p>
                </div>
              </div>

              {isManager && (
                <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleAvailability(item);
                    }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                      item.isAvailable ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                    )}
                  >
                    <Eye size={16} /> {item.isAvailable ? "Müsait" : "Tükendi"}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingItem(item);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20 transition-all"
                  >
                    <Settings size={16} /> Düzenle
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteItem(item.id, item.name);
                    }}
                    className="p-4 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 transition-all hover:bg-rose-500 hover:text-white"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
            <div className="p-8 space-y-3">
              <div className="flex justify-between items-start">
                <h4 className={cn("font-black text-xl leading-tight", !item.isAvailable && "text-text-secondary line-through opacity-50")}>{item.name}</h4>
              </div>
              <p className="text-text-secondary text-sm line-clamp-2 leading-relaxed opacity-70">
                {item.description}
              </p>
              <div className="pt-4 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-accent">{item.category}</span>
                <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full border border-white/5">
                  <div className={cn("w-2 h-2 rounded-full", item.isAvailable ? "bg-emerald-500" : "bg-rose-500")} />
                  <span className={cn("text-[10px] uppercase font-black tracking-tight", item.isAvailable ? "text-emerald-500" : "text-rose-500")}>
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 text-text-primary">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl glass rounded-[44px] overflow-hidden shadow-2xl flex flex-col max-h-[95vh] border-white/5"
            >
              <div className="relative h-48 sm:h-56 shrink-0 bg-accent/10 flex items-center justify-center border-b border-white/5">
                <div className="bg-accent/20 w-32 h-32 rounded-[40px] flex items-center justify-center shadow-2xl shadow-accent/20 border-2 border-accent/20">
                  <Utensils size={64} className="text-accent" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-bg via-transparent to-transparent opacity-60" />
                <button
                  onClick={() => setSelectedItem(null)}
                  className="absolute top-6 right-6 bg-black/60 hover:bg-black/80 text-white p-3 rounded-full backdrop-blur-xl transition-all active:scale-90 border border-white/10"
                >
                  <Plus size={28} className="rotate-45" />
                </button>
                <div className="absolute bottom-10 left-10 right-10">
                  <div className="flex justify-between items-end gap-6">
                    <div>
                      <span className="text-xs font-black uppercase tracking-[0.3em] text-accent mb-2 block">{selectedItem.category}</span>
                      <h3 className="text-4xl font-black text-white">{selectedItem.name}</h3>
                    </div>
                    <div className="text-3xl font-black text-white bg-accent px-6 py-3 rounded-[24px] shadow-2xl shadow-accent/40">
                      ₺{selectedItem.price}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
                <p className="text-text-secondary leading-relaxed text-xl opacity-80">
                  {selectedItem.description}
                </p>

                {selectedItem.modifierGroups && selectedItem.modifierGroups.length > 0 && (
                  <div className="space-y-8">
                    <h4 className="font-black text-2xl border-b border-border/50 pb-4 uppercase tracking-tighter">Seçenekler</h4>
                    {selectedItem.modifierGroups.map(group => (
                      <div key={group.name} className="space-y-6">
                        <div className="flex justify-between items-center">
                          <h5 className="font-black text-lg uppercase tracking-widest opacity-70">{group.name}</h5>
                          {group.required && <span className="text-[10px] bg-rose-500/20 text-rose-500 px-4 py-1.5 rounded-full font-black uppercase tracking-widest">Zorunlu</span>}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                  "flex justify-between items-center p-6 rounded-[32px] border-2 transition-all text-left group active:scale-[0.98]",
                                  isSelected
                                    ? "bg-accent/10 border-accent shadow-lg shadow-accent/5"
                                    : "bg-surface/30 border-border/50 hover:border-accent/50 hover:bg-surface"
                                )}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={cn(
                                    "w-6 h-6 border-2 flex items-center justify-center transition-all duration-300",
                                    group.multiSelect ? "rounded-lg" : "rounded-full",
                                    isSelected ? "border-accent bg-accent scale-110" : "border-text-secondary group-hover:border-accent/50"
                                  )}>
                                    {isSelected && <CheckCircle2 size={16} className="text-white" />}
                                  </div>
                                  <span className={cn("text-base font-bold", isSelected ? "text-text-primary" : "text-text-secondary")}>
                                    {option.name}
                                  </span>
                                </div>
                                {option.price > 0 && (
                                  <span className={cn("font-black", isSelected ? "text-accent" : "text-text-secondary opacity-60")}>
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

              <div className="p-10 bg-surface/80 border-t border-border/50 shrink-0">
                <div className="flex items-center justify-between gap-10">
                  <div>
                    <p className="text-xs text-text-secondary font-black uppercase tracking-[0.2em] mb-2 opacity-60">Toplam Tutar</p>
                    <p className="text-4xl font-black text-accent tracking-tighter drop-shadow-[0_0_15px_rgba(157,123,250,0.4)]">
                      ₺{
                        selectedItem.price +
                        Object.values(currentModifiers).flat().reduce((sum, mod) => sum + (mod as any).price, 0)
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
                    className="flex-1 bg-accent hover:bg-accent-hover text-white py-6 rounded-3xl font-black text-lg shadow-2xl shadow-accent/30 transition-all uppercase tracking-widest active:scale-95"
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
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
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
                      onChange={(e) => setNewItem({ ...newItem, price: Number(e.target.value) })}
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
                          setNewItem({ ...newItem, category: e.target.value });
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
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className="w-full bg-surface border border-border rounded-xl px-4 py-3 focus:outline-none focus:border-accent h-24 resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-secondary uppercase">Yazıcı Hedefi</label>
                  {printers.length > 0 ? (
                    <div className="flex flex-wrap gap-2 bg-surface p-1 rounded-xl border border-border">
                      {printers.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setNewItem(prev => ({ ...prev, printer: p.id }))}
                          className={cn(
                            "flex-1 py-2 rounded-lg font-bold text-xs uppercase transition-all",
                            newItem.printer === p.id ? "bg-accent text-white shadow-md" : "text-text-secondary hover:text-white"
                          )}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-secondary opacity-50 italic">Ayarlar'dan yazıcı tanımlamanız gerekiyor.</p>
                  )}
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
              className="relative w-full max-w-lg glass rounded-[36px] p-10 shadow-2xl overflow-hidden border border-white/5"
            >
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black uppercase tracking-tighter">Ürünü Düzenle</h3>
                <button
                  onClick={() => setEditingItem(null)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>

              <form onSubmit={handleUpdateItem} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Ürün Adı</label>
                  <input
                    required
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full bg-surface/50 border border-border/50 rounded-2xl px-6 py-4 focus:outline-none focus:border-accent transition-all text-lg font-bold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Fiyat (₺)</label>
                    <input
                      required
                      type="number"
                      value={editingItem.price}
                      onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                      className="w-full bg-surface/50 border border-border/50 rounded-2xl px-6 py-4 focus:outline-none focus:border-accent transition-all text-lg font-bold"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Kategori</label>
                    <select
                      value={editingItem.category}
                      onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                      className="w-full bg-surface/50 border border-border/50 rounded-2xl px-6 py-4 focus:outline-none focus:border-accent transition-all text-lg font-bold appearance-none"
                    >
                      {categories.filter(c => c !== 'Tümü').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Açıklama</label>
                  <textarea
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                    className="w-full bg-surface/50 border border-border/50 rounded-2xl px-6 py-4 focus:outline-none focus:border-accent h-32 resize-none transition-all"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Yazıcı Hedefi</label>
                  {printers.length > 0 ? (
                    <div className="flex flex-wrap gap-2 bg-surface/50 p-1 rounded-2xl border border-border/50">
                      {printers.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setEditingItem({ ...editingItem, printer: p.id })}
                          className={cn(
                            "flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all",
                            editingItem.printer === p.id ? "bg-accent text-white shadow-lg" : "text-text-secondary hover:text-white"
                          )}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-secondary opacity-50 italic">Ayarlar'dan yazıcı tanımlamanız gerekiyor.</p>
                  )}
                </div>
                <div className="pt-6 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="flex-1 px-8 py-5 rounded-[24px] border-2 border-border/50 text-text-secondary hover:text-white hover:border-white/20 transition-all font-black uppercase tracking-widest text-xs active:scale-95"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-accent hover:bg-accent-hover text-white px-8 py-5 rounded-[24px] font-black uppercase tracking-widest text-xs shadow-xl shadow-accent/30 transition-all active:scale-95"
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
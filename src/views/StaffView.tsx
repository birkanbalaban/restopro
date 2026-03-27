import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Plus, Edit2, Trash2, X, Clock, Settings, Shield, Calendar, ChevronLeft, ChevronRight, Moon, Sun, Sunrise } from 'lucide-react';
import { cn } from '../utils';
import { Staff, Shift } from '../types';
import { firebaseService } from '../services/firebaseService';

export const StaffView = ({ staff, shifts, logs, showToast, isManager, setStaff, setShifts, user }: {
  staff: Staff[],
  shifts: Shift[],
  logs: any[],
  showToast: (m: string, t?: 'success' | 'error') => void,
  isManager: boolean,
  setStaff?: React.Dispatch<React.SetStateAction<Staff[]>>,
  setShifts?: React.Dispatch<React.SetStateAction<Shift[]>>,
  user?: any
}) => {
  const [activeView, setActiveView] = useState<'list' | 'schedule'>('list');
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [roleFilter, setRoleFilter] = useState<'all' | Staff['role']>('all');

  const [isAddingShift, setIsAddingShift] = useState(false);
  const [newShift, setNewShift] = useState<Omit<Shift, 'id'>>({
    staffId: '',
    staffName: '',
    dayIndex: 0,
    startTime: '09:00',
    endTime: '17:00',
    type: 'morning'
  });

  const [newStaff, setNewStaff] = useState<Omit<Staff, 'id' | 'lastActive'>>({
    name: '',
    role: 'waiter',
    status: 'active',
    avatar: '',
    pin: ''
  });

  const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  const shiftTypes = [
    { id: 'morning', label: 'Sabah', icon: Sunrise, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    { id: 'evening', label: 'Akşam', icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
    { id: 'full', label: 'Tam Gün', icon: Sun, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
  ];

  /* Handlers */
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManager) return;
    try {
      await firebaseService.addStaff(newStaff as any);
      showToast(`${newStaff.name} personele eklendi.`, 'success');
      setIsAddingStaff(false);
      setNewStaff({ name: '', role: 'waiter', status: 'active', avatar: '', pin: '' });
    } catch (error) {
      showToast('Ekleme sırasında hata oluştu.', 'error');
    }
  };

  const handleDeleteStaff = async (id: string, name: string) => {
    if (!isManager) return;
    if (confirm(`${name} isimli personeli silmek istediğinize emin misiniz?`)) {
      await firebaseService.deleteStaff(id);
      showToast(`${name} silindi.`, 'success');
    }
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff || !isManager) return;
    await firebaseService.updateStaff(editingStaff.id, editingStaff);
    showToast(`${editingStaff.name} bilgileri güncellendi.`, 'success');
    setEditingStaff(null);
  };

  const handleAddShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManager) return;

    const person = staff.find(s => s.id === newShift.staffId);
    if (!person) return;

    try {
      await firebaseService.addShift({ ...newShift, staffName: person.name });
      showToast('Vardiya eklendi.', 'success');
      setIsAddingShift(false);
    } catch (error) {
      showToast('Hata oluştu.', 'error');
    }
  };

  const handleDeleteShift = async (id: string) => {
    if (!isManager) return;
    await firebaseService.deleteShift(id);
    showToast('Vardiya kaldırıldı.', 'success');
  };

  /* role config */
  const roleConfig: Record<Staff['role'], { label: string; color: string; bg: string; border: string; gradient: string }> = {
    admin: { label: 'Admin', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', gradient: 'from-purple-600 to-purple-900' },
    manager: { label: 'Yönetici', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', gradient: 'from-amber-600 to-orange-900' },
    chef: { label: 'Aşçı', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', gradient: 'from-rose-600 to-red-900' },
    waiter: { label: 'Garson', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', gradient: 'from-blue-600 to-indigo-900' },
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const filteredStaff = staff.filter(p => roleFilter === 'all' || p.role === roleFilter);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-[28px] border border-white/5 flex items-center gap-6 bg-[#1a1a1c]/40">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent"><Users size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1">Toplam Personel</p>
            <h4 className="text-2xl font-black">{staff.length}</h4>
          </div>
        </div>
        <div className="glass p-6 rounded-[28px] border border-white/5 flex items-center gap-6 bg-[#1a1a1c]/40">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500"><Calendar size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1">Haftalık Vardiya</p>
            <h4 className="text-2xl font-black">{shifts.length}</h4>
          </div>
        </div>
        <div className="glass p-6 rounded-[28px] border border-white/5 flex items-center gap-6 bg-accent/5">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent"><Clock size={24} /></div>
          <div>
            <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-1">Günlük Akış</p>
            <h4 className="text-sm font-black text-text-secondary">Vardiya Planı Aktif</h4>
          </div>
        </div>
      </div>

      {/* View Switcher & Action */}
      <div className="flex justify-between items-center bg-black/20 p-2 rounded-[28px] border border-white/5">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveView('list')}
            className={cn(
              "px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeView === 'list' ? "bg-accent text-white shadow-xl" : "text-text-secondary hover:bg-white/5"
            )}
          >
            <Users size={16} /> Personel Listesi
          </button>
          <button
            onClick={() => setActiveView('schedule')}
            className={cn(
              "px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              activeView === 'schedule' ? "bg-accent text-white shadow-xl" : "text-text-secondary hover:bg-white/5"
            )}
          >
            <Calendar size={16} /> Haftalık Çizelge
          </button>
        </div>

        {isManager && (
          <button
            onClick={() => activeView === 'list' ? setIsAddingStaff(true) : setIsAddingShift(true)}
            className="bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-accent/20 active:scale-95"
          >
            <Plus size={18} /> {activeView === 'list' ? 'Personel Ekle' : 'Vardiya Ekle'}
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeView === 'list' ? (
          <motion.div key="list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            {/* Role filter chips */}
            <div className="flex gap-2 flex-wrap">
              {(['all', 'waiter', 'chef', 'manager', 'admin'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all',
                    roleFilter === r
                      ? 'bg-accent text-white shadow-lg'
                      : r === 'all' ? 'glass text-text-secondary hover:text-white' : cn(roleConfig[r as Staff['role']]?.bg, roleConfig[r as Staff['role']]?.color, 'border', roleConfig[r as Staff['role']]?.border, 'hover:opacity-100 opacity-70')
                  )}
                >
                  {r === 'all' ? 'Tümü' : roleConfig[r as Staff['role']].label}
                </button>
              ))}
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStaff.map((person) => {
                const rc = roleConfig[person.role];
                return (
                  <div key={person.id} className="glass rounded-[32px] p-6 flex flex-col gap-6 border border-white/5 transition-all hover:scale-[1.02] shadow-xl relative overflow-hidden group">
                    <div className={cn("absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-10 blur-3xl -mr-16 -mt-16", rc.gradient)}></div>
                    <div className="flex items-center gap-5 relative z-10">
                      <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-lg shrink-0 bg-gradient-to-br', rc.gradient)}>
                        {getInitials(person.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-lg truncate">{person.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest', rc.bg, rc.color, rc.border)}>
                            {rc.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 relative z-10">
                      <div className="flex-1 text-[11px] font-bold text-text-secondary bg-white/5 px-4 py-3 rounded-2xl border border-white/5">
                        PIN: <span className="font-black text-white ml-1">****</span>
                      </div>
                      {isManager && (
                        <>
                          <button onClick={() => setEditingStaff(person)} className="p-3 rounded-2xl glass hover:bg-amber-500/10 hover:text-amber-400 text-text-secondary transition-all active:scale-90 border border-white/5">
                            <Settings size={18} />
                          </button>
                          <button onClick={() => handleDeleteStaff(person.id, person.name)} className="p-3 rounded-2xl glass hover:bg-rose-500/10 hover:text-rose-400 text-text-secondary transition-all active:scale-90 border border-white/5">
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div key="schedule" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="overflow-x-auto pb-4">
              <div className="grid grid-cols-7 min-w-[1000px] gap-4">
                {days.map((day, idx) => {
                  const dayShifts = shifts.filter(s => s.dayIndex === idx);
                  return (
                    <div key={day} className="space-y-4">
                      <div className="glass p-4 rounded-2xl text-center border-b-2 border-accent/30">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">{day}</p>
                      </div>

                      <div className="space-y-3 min-h-[400px]">
                        {dayShifts.map(s => {
                          const type = shiftTypes.find(t => t.id === s.type) || shiftTypes[0];
                          const Icon = type.icon;
                          const rc = roleConfig[staff.find(st => st.id === s.staffId)?.role || 'waiter'];

                          return (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              key={s.id}
                              className={cn(
                                "p-4 rounded-[24px] border border-white/5 shadow-lg relative group overflow-hidden",
                                type.bg
                              )}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <Icon size={14} className={type.color} />
                                {isManager && (
                                  <button
                                    onClick={() => handleDeleteShift(s.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                                  >
                                    <X size={12} />
                                  </button>
                                )}
                              </div>
                              <p className="text-xs font-black truncate mb-1">{s.staffName}</p>
                              <div className="flex items-center gap-1.5 text-[10px] font-bold opacity-60">
                                <Clock size={10} />
                                <span>{s.startTime} - {s.endTime}</span>
                              </div>
                            </motion.div>
                          );
                        })}
                        {dayShifts.length === 0 && (
                          <div className="h-full border-2 border-dashed border-white/5 rounded-3xl flex items-center justify-center">
                            <span className="text-[10px] font-bold opacity-10 uppercase tracking-widst rotate-90">Boş</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {isAddingStaff && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAddingStaff(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md glass rounded-[44px] p-10 shadow-2xl border-white/5"
            >
              <h3 className="text-2xl font-black mb-8 tracking-tighter text-center uppercase">Yeni Personel</h3>
              <form onSubmit={handleAddStaff} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Ad Soyad</label>
                  <input required type="text" value={newStaff.name}
                    onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                    className="w-full bg-surface/50 border-2 border-border/50 rounded-2xl px-6 py-4 focus:outline-none focus:border-accent font-bold placeholder:opacity-30"
                    placeholder="Örn: Ahmet Yılmaz" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Rol</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['waiter', 'chef', 'manager', 'admin'] as Staff['role'][]).map(r => (
                      <button key={r} type="button"
                        onClick={() => setNewStaff({ ...newStaff, role: r })}
                        className={cn(
                          'py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all',
                          newStaff.role === r ? cn('border-2', roleConfig[r].border, roleConfig[r].bg, roleConfig[r].color) : 'border-border/50 text-text-secondary hover:border-white/20'
                        )}
                      >
                        {roleConfig[r].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">PIN Kodu (4 Hane)</label>
                  <input required type="password" maxLength={4} value={newStaff.pin}
                    onChange={(e) => setNewStaff({ ...newStaff, pin: e.target.value })}
                    className="w-full bg-surface/50 border-2 border-border/50 rounded-2xl px-6 py-4 focus:outline-none focus:border-accent font-black tracking-[0.5em] text-center"
                    placeholder="••••" />
                </div>
                <div className="pt-2 flex gap-4">
                  <button type="button" onClick={() => setIsAddingStaff(false)} className="flex-1 glass py-4 rounded-[28px] font-black uppercase tracking-widest text-xs">İptal</button>
                  <button type="submit" className="flex-1 bg-accent hover:bg-accent-hover text-white py-4 rounded-[28px] font-black uppercase tracking-widest text-xs shadow-2xl shadow-accent/40">Kaydet</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isAddingShift && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAddingShift(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md glass rounded-[44px] p-10 shadow-2xl border-white/5"
            >
              <h3 className="text-2xl font-black mb-8 tracking-tighter text-center uppercase">Vardiya Ekle</h3>
              <form onSubmit={handleAddShift} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Personel Seç</label>
                  <select required value={newShift.staffId}
                    onChange={e => setNewShift({ ...newShift, staffId: e.target.value })}
                    className="w-full bg-surface/50 border-2 border-border/50 rounded-2xl px-6 py-4 focus:outline-none focus:border-accent font-bold"
                  >
                    <option value="">Lütfen seçin</option>
                    {staff.map(s => <option key={s.id} value={s.id}>{s.name} ({roleConfig[s.role].label})</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Gün</label>
                    <select value={newShift.dayIndex} onChange={e => setNewShift({ ...newShift, dayIndex: Number(e.target.value) })}
                      className="w-full bg-surface/50 border-2 border-border/50 rounded-2xl px-4 py-3 focus:outline-none focus:border-accent font-bold text-sm"
                    >
                      {days.map((d, i) => <option key={d} value={i}>{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Vardiya Tipi</label>
                    <select value={newShift.type} onChange={e => setNewShift({ ...newShift, type: e.target.value as any })}
                      className="w-full bg-surface/50 border-2 border-border/50 rounded-2xl px-4 py-3 focus:outline-none focus:border-accent font-bold text-sm"
                    >
                      {shiftTypes.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Başlangıç</label>
                    <input type="time" value={newShift.startTime} onChange={e => setNewShift({ ...newShift, startTime: e.target.value })}
                      className="w-full bg-surface/50 border-2 border-border/50 rounded-2xl px-4 py-3 focus:outline-none focus:border-accent font-bold" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Bitiş</label>
                    <input type="time" value={newShift.endTime} onChange={e => setNewShift({ ...newShift, endTime: e.target.value })}
                      className="w-full bg-surface/50 border-2 border-border/50 rounded-2xl px-4 py-3 focus:outline-none focus:border-accent font-bold" />
                  </div>
                </div>
                <div className="pt-2 flex gap-4">
                  <button type="button" onClick={() => setIsAddingShift(false)} className="flex-1 glass py-4 rounded-[28px] font-black uppercase tracking-widest text-xs">İptal</button>
                  <button type="submit" className="flex-1 bg-accent hover:bg-accent-hover text-white py-4 rounded-[28px] font-black uppercase tracking-widest text-xs">Ata</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {editingStaff && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditingStaff(null)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md glass rounded-[44px] p-10 shadow-2xl border-white/5"
            >
              <h3 className="text-xl font-black uppercase tracking-tighter mb-6">Personeli Düzenle</h3>
              <form onSubmit={handleUpdateStaff} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Ad Soyad</label>
                  <input required type="text" value={editingStaff.name}
                    onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })}
                    className="w-full bg-surface/50 border-2 border-border/50 rounded-2xl px-6 py-4 focus:outline-none focus:border-accent font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Rol / Yetki</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['waiter', 'chef', 'manager', 'admin'] as Staff['role'][]).map(r => (
                      <button key={r} type="button"
                        onClick={() => setEditingStaff({ ...editingStaff, role: r })}
                        className={cn(
                          'py-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all',
                          editingStaff.role === r ? cn('border-2', roleConfig[r].border, roleConfig[r].bg, roleConfig[r].color) : 'border-border/50 text-text-secondary hover:border-white/20'
                        )}
                      >
                        {roleConfig[r].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">PIN Kodu (4 Hane)</label>
                  <input required type="password" maxLength={4} value={editingStaff.pin}
                    onChange={(e) => setEditingStaff({ ...editingStaff, pin: e.target.value })}
                    className="w-full bg-surface/50 border-2 border-border/50 rounded-2xl px-6 py-4 focus:outline-none focus:border-accent font-black tracking-[0.5em] text-center" />
                </div>
                <div className="pt-2 flex gap-4">
                  <button type="button" onClick={() => setEditingStaff(null)} className="flex-1 glass py-4 rounded-[28px] font-black uppercase tracking-widest text-xs">İptal</button>
                  <button type="submit" className="flex-1 bg-accent hover:bg-accent-hover text-white py-4 rounded-[28px] font-black uppercase tracking-widest text-xs shadow-2xl shadow-accent/40">Güncelle</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div >
  );
};
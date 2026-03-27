import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Calendar as CalendarIcon,
    ChevronRight,
    ChevronLeft,
    Plus,
    Users,
    Clock,
    Phone,
    CheckCircle2,
    XCircle,
    MoreVertical,
    Filter,
    Search,
    LogIn,
    Edit2,
    Trash2
} from 'lucide-react';
import { cn } from '../utils';
import { Reservation, Table } from '../types';
import { firebaseService } from '../services/firebaseService';

export function ReservationsView({
    reservations,
    tables,
    onAddReservation,
    showToast,
    setReservations,
    user
}: {
    reservations: Reservation[],
    tables: Table[],
    onAddReservation: (res: any) => void,
    showToast: (m: string, t?: 'success' | 'error') => void,
    setReservations?: React.Dispatch<React.SetStateAction<Reservation[]>>,
    user?: any
}) {
    const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingResId, setEditingResId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'seated'>('all');

    const [newRes, setNewRes] = useState({
        customerName: '',
        phone: '',
        guestCount: 2,
        date: selectedDate,
        time: '19:00',
        notes: '',
        tableId: '',
        status: 'confirmed' as const
    });

    const [showAllDates, setShowAllDates] = useState(false);
    const dailyReservations = showAllDates ? reservations : reservations.filter(r => r.date === selectedDate);
    const filteredReservations = filter === 'all' ? dailyReservations : dailyReservations.filter(r => r.status === filter);

    const handleOpenAdd = () => {
        setEditingResId(null);
        setNewRes({
            customerName: '',
            phone: '',
            guestCount: 2,
            date: selectedDate,
            time: '19:00',
            notes: '',
            tableId: '',
            status: 'confirmed'
        });
        setIsModalOpen(true);
    };

    const handleOpenEdit = (res: Reservation) => {
        setEditingResId(res.id);
        setNewRes({
            customerName: res.customerName,
            phone: res.phone,
            guestCount: res.guestCount,
            date: res.date,
            time: res.time || '19:00',
            notes: res.notes || '',
            tableId: res.tableId || '',
            status: res.status as any
        });
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Header Controls */}
            <div className="flex flex-wrap items-center justify-between gap-6 pb-4">
                <div className="flex bg-[#252528] p-1.5 rounded-2xl border border-border/50 shadow-xl">
                    <button
                        onClick={() => {
                            const d = new Date(selectedDate);
                            d.setDate(d.getDate() - 1);
                            setSelectedDate(d.toISOString().split('T')[0]);
                        }}
                        className="p-2 hover:bg-white/5 rounded-xl transition-colors text-text-secondary hover:text-white"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="px-6 py-2 flex items-center gap-3">
                        <CalendarIcon size={18} className="text-accent" />
                        <span className="relative cursor-pointer">
                            <span className="font-bold text-sm tracking-widest hover:text-white transition-colors">
                                {new Date(selectedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}
                            </span>
                            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                        </span>
                    </div>
                    <button
                        onClick={() => {
                            const d = new Date(selectedDate);
                            d.setDate(d.getDate() + 1);
                            setSelectedDate(d.toISOString().split('T')[0]);
                        }}
                        className="p-2 hover:bg-white/5 rounded-xl transition-colors text-text-secondary hover:text-white"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowAllDates(!showAllDates)}
                        className={cn(
                            "px-6 py-3 rounded-2xl border-2 transition-all flex items-center gap-3",
                            showAllDates ? "bg-accent border-accent text-white shadow-lg shadow-accent/20" : "bg-[#252528] border-border/30 text-text-secondary hover:text-white"
                        )}
                    >
                        <Filter size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{showAllDates ? "Günlüğe Dön" : "Tüm Kayıtlar"}</span>
                    </button>

                    <div className="flex bg-[#252528] p-1.5 rounded-2xl border border-border/50">
                        {(['all', 'pending', 'confirmed', 'seated'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    filter === f ? "bg-accent text-white shadow-lg" : "text-text-secondary hover:text-white"
                                )}
                            >
                                {f === 'all' ? 'Tümü' : f === 'pending' ? 'Bekliyor' : f === 'confirmed' ? 'Onaylı' : 'Oturtuldu'}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={handleOpenAdd}
                        className="bg-accent hover:bg-accent-hover text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 shadow-xl shadow-accent/20 transition-all active:scale-95"
                    >
                        <Plus size={18} /> Yeni Rezervasyon
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass p-6 rounded-[32px] border border-white/5 bg-[#1a1a1c]/40 flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent"><Users size={24} /></div>
                    <div>
                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1">Toplam Kişi</p>
                        <h4 className="text-2xl font-black">{dailyReservations.reduce((acc, r) => acc + r.guestCount, 0)}</h4>
                    </div>
                </div>
                <div className="glass p-6 rounded-[32px] border border-white/5 bg-[#1a1a1c]/40 flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500"><CalendarIcon size={24} /></div>
                    <div>
                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-1">Gelenler</p>
                        <h4 className="text-2xl font-black">{dailyReservations.filter(r => r.status === 'seated').length}</h4>
                    </div>
                </div>
                <div className="col-span-2 glass p-6 rounded-[32px] border border-white/5 bg-accent/5 flex items-center justify-between px-10">
                    <div className="flex gap-4">
                        <div className="w-1.5 h-12 bg-accent rounded-full" />
                        <div>
                            <p className="text-sm font-black text-accent mb-1 tracking-tighter">Günün Özeti</p>
                            <p className="text-xs text-text-secondary opacity-70">Bugün için {dailyReservations.length} rezervasyon bulunuyor.</p>
                        </div>
                    </div>
                    <p className="text-4xl font-black text-accent/20">#{dailyReservations.length}</p>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredReservations.length === 0 ? (
                    <div className="col-span-full py-24 text-center glass rounded-[48px] border-dashed border-border/50 opacity-20 flex flex-col items-center justify-center gap-6">
                        <CalendarIcon size={80} strokeWidth={1} />
                        <p className="text-xl font-medium tracking-tight">Rezervasyon bulunamadı.</p>
                    </div>
                ) : (
                    filteredReservations.map((res) => (
                        <motion.div
                            key={res.id}
                            className={cn(
                                "glass p-8 rounded-[40px] border-2 transition-all group relative overflow-hidden flex flex-col justify-between",
                                res.status === 'seated' ? "border-emerald-500/20 opacity-70" : "border-border/30 hover:border-accent hover:bg-accent/5"
                            )}
                        >
                            <div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="space-y-4 flex-1 mr-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-white/5 rounded-2xl border border-border/20 group-hover:bg-accent group-hover:text-white transition-all"><LogIn size={20} /></div>
                                            <h4 className="text-xl font-black group-hover:text-accent transition-colors truncate">{res.customerName}</h4>
                                        </div>
                                        <div className="flex flex-col gap-2 text-text-secondary text-xs font-bold">
                                            <span className="flex items-center gap-2"><Phone size={14} className="opacity-50" /> {res.phone}</span>
                                            <span className="flex items-center gap-2"><Users size={14} className="opacity-50" /> {res.guestCount} Kişi</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-2 text-accent bg-accent/10 px-4 py-2 rounded-2xl border border-accent/20">
                                            <CalendarIcon size={12} />
                                            <span className="text-[11px] font-black">{new Date(res.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-white bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
                                            <Clock size={12} />
                                            <span className="text-sm font-black tabular-nums">{res.time}</span>
                                        </div>
                                        <span className={cn(
                                            "text-[8px] font-black uppercase tracking-[0.2em] px-2.5 py-1.5 rounded-full border shadow-sm",
                                            res.status === 'confirmed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" :
                                                res.status === 'seated' ? "bg-white/5 text-text-secondary border-border/50" :
                                                    "bg-orange-500/10 text-orange-500 border-orange-500/30"
                                        )}>
                                            {res.status === 'confirmed' ? 'ONAYLANDI' : res.status === 'seated' ? 'MASADA' : 'BEKLİYOR'}
                                        </span>
                                    </div>
                                </div>

                                {res.notes && (
                                    <div className="p-4 bg-white/5 rounded-2xl border border-border/20 mb-6 italic text-xs text-text-secondary">
                                        "{res.notes}"
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-border/30 mt-auto">
                                <p className="text-[10px] font-black uppercase text-accent tracking-widest truncate max-w-[100px]">
                                    {res.tableId ? `${tables.find(t => t.id === res.tableId)?.name || 'Masa'}` : 'Masa Yok'}
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleOpenEdit(res)}
                                        className="p-3 glass rounded-xl text-amber-500 hover:bg-amber-500/10 border border-amber-500/20 transition-all"
                                        title="Düzenle"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    {res.status !== 'seated' && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Masaya oturtuldu mu?')) {
                                                        firebaseService.updateReservation(res.id, { status: 'seated' });
                                                        showToast(`${res.customerName} oturtuldu.`, 'success');
                                                    }
                                                }}
                                                className="bg-accent hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-accent/20 transition-all flex items-center gap-2"
                                            >
                                                <LogIn size={14} /> Oturt
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm('İptal edilsin mi?')) {
                                                        firebaseService.updateReservation(res.id, { status: 'cancelled' as any });
                                                    }
                                                }}
                                                className="p-3 glass rounded-xl text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition-all"
                                            >
                                                <XCircle size={16} />
                                            </button>
                                        </>
                                    <button
                                        onClick={() => {
                                            if (confirm('Bu rezervasyon kaydını tamamen silmek istediğinize emin misiniz?')) {
                                                firebaseService.deleteReservation(res.id);
                                                showToast('Rezervasyon silindi.', 'success');
                                            }
                                        }}
                                        className="p-3 glass rounded-xl text-rose-500 hover:bg-rose-500/10 border border-rose-500/20 transition-all"
                                        title="Sil"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-xl glass rounded-[44px] p-10 shadow-2xl z-10 border-2 border-border/30 overflow-y-auto max-h-[90vh]">
                            <h3 className="text-2xl font-black mb-8 tracking-tighter uppercase">{editingResId ? 'Rezervasyonu Düzenle' : 'Yeni Rezervasyon'}</h3>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                try {
                                    if (editingResId) {
                                        await firebaseService.updateReservation(editingResId, newRes);
                                        showToast('Güncellendi.', 'success');
                                    } else {
                                        await onAddReservation(newRes);
                                        showToast('Eklendi.', 'success');
                                    }
                                    setIsModalOpen(false);
                                } catch (e) { showToast('Hata!', 'error'); }
                            }} className="grid grid-cols-2 gap-6">
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-2">Müşteri Adı</label>
                                    <input required type="text" value={newRes.customerName} onChange={e => setNewRes({ ...newRes, customerName: e.target.value })} className="w-full h-14 bg-[#252528] border-2 border-border/50 rounded-2xl px-6 focus:outline-none focus:border-accent font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-2">Telefon</label>
                                    <input required type="tel" value={newRes.phone} onChange={e => setNewRes({ ...newRes, phone: e.target.value })} className="w-full h-14 bg-[#252528] border-2 border-border/50 rounded-2xl px-6 focus:outline-none focus:border-accent font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-2">Kişi</label>
                                    <input required type="number" min="1" value={newRes.guestCount} onChange={e => setNewRes({ ...newRes, guestCount: parseInt(e.target.value) })} className="w-full h-14 bg-[#252528] border-2 border-border/50 rounded-2xl px-6 focus:outline-none focus:border-accent font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-2">Tarih</label>
                                    <input required type="date" value={newRes.date} onChange={e => setNewRes({ ...newRes, date: e.target.value })} className="w-full h-14 bg-[#252528] border-2 border-border/50 rounded-2xl px-6 focus:outline-none focus:border-accent font-bold" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-2">Saat</label>
                                    <input required type="time" value={newRes.time} onChange={e => setNewRes({ ...newRes, time: e.target.value })} className="w-full h-14 bg-[#252528] border-2 border-border/50 rounded-2xl px-6 focus:outline-none focus:border-accent font-bold" />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-2">Masa</label>
                                    <select value={newRes.tableId} onChange={e => setNewRes({ ...newRes, tableId: e.target.value })} className="w-full h-14 bg-[#252528] border-2 border-border/50 rounded-2xl px-6 focus:outline-none focus:border-accent font-bold">
                                        <option value="">Seçiniz (Opsiyonel)</option>
                                        {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-2">Notlar</label>
                                    <textarea value={newRes.notes} onChange={e => setNewRes({ ...newRes, notes: e.target.value })} className="w-full bg-[#252528] border-2 border-border/50 rounded-2xl p-4 h-24 focus:outline-none focus:border-accent resize-none font-bold" />
                                </div>
                                <div className="col-span-2 pt-4 flex gap-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 glass h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest">İptal</button>
                                    <button type="submit" className="flex-1 bg-accent hover:bg-accent-hover text-white h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-accent/20 flex items-center justify-center">Kaydet</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

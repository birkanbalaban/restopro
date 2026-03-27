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
    LogIn
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
    const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA')); // en-CA gives YYYY-MM-DD reliably
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'seated'>('all');
    const [newRes, setNewRes] = useState({
        customerName: '',
        phone: '',
        guestCount: 2,
        date: selectedDate,
        time: '19:00',
        notes: '',
        tableId: ''
    });

    const [showAllDates, setShowAllDates] = useState(false);
    const dailyReservations = showAllDates ? reservations : reservations.filter(r => r.date === selectedDate);
    const filteredReservations = filter === 'all' ? dailyReservations : dailyReservations.filter(r => r.status === filter);

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* Date & Filter Controls */}
            <div className="flex flex-wrap items-center justify-between gap-6 pb-4">
                <div className="flex bg-[#252528] p-1.5 rounded-2xl border border-border/50 shadow-xl self-start">
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
                            <span className="font-bold text-sm tracking-widest hover:text-white transition-colors">{new Date(selectedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}</span>
                            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full left-0 top-0" />
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

                <button
                    onClick={() => setShowAllDates(!showAllDates)}
                    className={cn(
                        "px-6 py-3 rounded-2xl border-2 transition-all flex items-center gap-3 active:scale-95",
                        showAllDates
                            ? "bg-accent border-accent text-white shadow-lg shadow-accent/20"
                            : "bg-[#252528] border-border/30 text-text-secondary hover:text-white hover:border-border"
                    )}
                >
                    <Filter size={18} className={showAllDates ? "animate-pulse" : ""} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        {showAllDates ? "Günlük Görünüme Dön" : "Tüm Tarihli Kayıtlar"}
                    </span>
                </button>

                <div className="flex items-center gap-4">
                    <div className="flex bg-[#252528] p-1.5 rounded-2xl border border-border/50">
                        {['all', 'pending', 'confirmed', 'seated'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f as any)}
                                className={cn(
                                    "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                    filter === f ? "bg-accent text-white shadow-lg" : "text-text-secondary hover:text-white"
                                )}
                            >
                                {f === 'all' ? 'Tümü' : f === 'pending' ? 'Bekliyor' : f === 'confirmed' ? 'Onaylı' : 'Oturtuldu'}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-accent hover:bg-accent-hover text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 shadow-xl shadow-accent/20 transition-all active:scale-95"
                    >
                        <Plus size={18} /> Yeni Rezervasyon
                    </button>
                </div>
            </div>

            {/* Stats row */}
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
                        <p className="text-xl font-medium tracking-tight">Bu tarihte rezervasyon bulunmiyor.</p>
                    </div>
                ) : (
                    filteredReservations.map((res) => (
                        <motion.div
                            key={res.id}
                            className={cn(
                                "glass p-8 rounded-[40px] border-2 transition-all group relative overflow-hidden",
                                res.status === 'seated' ? "border-emerald-500/20 opacity-70" : "border-border/30 hover:border-accent hover:bg-accent/5"
                            )}
                        >
                            <div className="flex justify-between items-start mb-8 relative z-10">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-white/5 rounded-2xl border border-border/20 group-hover:bg-accent group-hover:text-white transition-all"><LogIn size={20} /></div>
                                        <h4 className="text-xl font-black group-hover:text-accent transition-colors">{res.customerName}</h4>
                                    </div>
                                    <div className="flex items-center gap-4 text-text-secondary text-xs font-bold tracking-tight">
                                        <span className="flex items-center gap-1.5"><Phone size={14} className="opacity-50" /> {res.phone}</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-white/10" />
                                        <span className="flex items-center gap-1.5"><Users size={14} className="opacity-50" /> {res.guestCount} Kişi</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-2 text-accent bg-accent/10 px-4 py-2 rounded-2xl border border-accent/20 mb-3">
                                        <Clock size={14} />
                                        <span className="text-sm font-black tabular-nums">{res.time}</span>
                                    </div>
                                    <span className={cn(
                                        "text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border shadow-sm inline-block",
                                        res.status === 'confirmed' ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" :
                                            res.status === 'seated' ? "bg-white/5 text-text-secondary border-border/50" :
                                                "bg-orange-500/10 text-orange-500 border-orange-500/30"
                                    )}>
                                        {res.status === 'confirmed' ? 'ONAYLANDI' : res.status === 'seated' ? 'MASADA' : 'BEKLİYOR'}
                                    </span>
                                </div>
                            </div>

                            {res.notes ? (
                                <div className="p-5 bg-white/5 rounded-3xl border border-border/30 mb-8 relative z-10 flex justify-between items-start gap-4">
                                    <p className="text-xs text-text-secondary italic leading-relaxed flex-1">"{res.notes}"</p>
                                    <button onClick={() => { const note = prompt('Rezervasyon Notu:', res.notes); if (note !== null) { firebaseService.updateReservation(res.id, { notes: note }); showToast('Not güncellendi.', 'success'); } }} className="text-accent text-[10px] font-bold uppercase hover:underline">Düzenle</button>
                                </div>
                            ) : (
                                <div className="mb-8 relative z-10">
                                    <button onClick={() => { const note = prompt('Rezervasyon Notu:'); if (note !== null && note.trim() !== '') { firebaseService.updateReservation(res.id, { notes: note }); showToast('Not eklendi.', 'success'); } }} className="text-[10px] font-black uppercase text-accent/50 tracking-widest hover:text-accent hover:underline">+ Garson Notu Ekle</button>
                                </div>
                            )}

                            <div className="flex items-center justify-between pt-8 border-t border-border/30 relative z-10">
                                <p className="text-[10px] font-black uppercase text-accent tracking-widest">{res.tableId ? `${tables.find(t => t.id === res.tableId)?.name || 'Masa Bilgisi Yok'}` : 'Masa Atanmamış'}</p>
                                <div className="flex items-center gap-3">
                                    {res.status !== 'seated' && (
                                        <>
                                            <button
                                                onClick={async () => {
                                                    if (confirm('Müşteri geldi ve masaya oturtuldu mu?')) {
                                                        // 1. Update reservation (backend handles table status too)
                                                        await firebaseService.updateReservation(res.id, { status: 'seated', tableId: res.tableId });





                                                        showToast(`${res.customerName} masaya oturtuldu.`, 'success');
                                                    }
                                                }}
                                                className="bg-accent hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-accent/20 flex items-center gap-2"
                                            >
                                                <LogIn size={14} /> Masaya Oturt
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Rezervasyonu iptal etmek istediğinize emin misiniz?')) {
                                                        firebaseService.updateReservation(res.id, { status: 'cancelled' as any });
                                                        showToast('Rezervasyon iptal edildi.', 'error');
                                                    }
                                                }}
                                                className="p-3 glass rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all border border-rose-500/20"
                                                title="İptal Et"
                                            >
                                                <XCircle size={16} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* New Reservation Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-xl glass rounded-[48px] p-12 shadow-2xl z-10 border-2 border-border/30">
                            <h3 className="text-3xl font-black mb-10 tracking-tighter">Yeni Rezervasyon</h3>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                try {
                                    await onAddReservation({ ...newRes, date: newRes.date, status: 'confirmed' });
                                    showToast(`${newRes.customerName} için rezervasyon oluşturuldu.`, 'success');
                                    setIsModalOpen(false);
                                } catch (error: any) {
                                    showToast('Rezervasyon eklenemedi.', 'error');
                                }
                            }} className="grid grid-cols-2 gap-8">
                                <div className="col-span-2 space-y-4">
                                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-2">Müşteri Adı</label>
                                    <div className="relative group">
                                        <input required autoFocus type="text" value={newRes.customerName} onChange={(e) => setNewRes({ ...newRes, customerName: e.target.value })} className="w-full h-16 bg-[#252528] border-2 border-border/50 rounded-3xl px-8 focus:outline-none focus:border-accent text-lg font-bold group-hover:border-border transition-all" placeholder="Ad Soyad" />
                                        <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-text-secondary group-focus-within:text-accent transition-colors" size={20} />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-2">Telefon</label>
                                    <input required type="tel" value={newRes.phone} onChange={(e) => setNewRes({ ...newRes, phone: e.target.value })} className="w-full h-16 bg-[#252528] border-2 border-border/50 rounded-3xl px-8 focus:outline-none focus:border-accent text-lg font-bold" placeholder="05XX" />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-2">Kişi Sayısı</label>
                                    <input required type="number" min="1" value={newRes.guestCount} onChange={(e) => setNewRes({ ...newRes, guestCount: parseInt(e.target.value) })} className="w-full h-16 bg-[#252528] border-2 border-border/50 rounded-3xl px-8 focus:outline-none focus:border-accent text-lg font-bold" />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-2">Tarih</label>
                                    <input required type="date" value={newRes.date} onChange={(e) => setNewRes({ ...newRes, date: e.target.value })} className="w-full h-16 bg-[#252528] border-2 border-border/50 rounded-3xl px-8 focus:outline-none focus:border-accent text-lg font-bold" />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-2">Saat</label>
                                    <input required type="time" value={newRes.time} onChange={(e) => setNewRes({ ...newRes, time: e.target.value })} className="w-full h-16 bg-[#252528] border-2 border-border/50 rounded-3xl px-8 focus:outline-none focus:border-accent text-lg font-bold" />
                                </div>
                                <div className="col-span-2 space-y-4">
                                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-2">Masa (Opsiyonel)</label>
                                    <select value={newRes.tableId} onChange={(e) => setNewRes({ ...newRes, tableId: e.target.value })} className="w-full h-16 bg-[#252528] border-2 border-border/50 rounded-3xl px-8 focus:outline-none focus:border-accent font-bold">
                                        <option value="">Seçiniz</option>
                                        {tables.map(t => <option key={t.id} value={t.id}>{t.name} ({t.capacity} Kişilik)</option>)}
                                    </select>
                                </div>
                                <div className="col-span-2 space-y-4">
                                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-2">Notlar</label>
                                    <textarea value={newRes.notes} onChange={(e) => setNewRes({ ...newRes, notes: e.target.value })} className="w-full bg-[#252528] border-2 border-border/50 rounded-3xl p-6 h-32 focus:outline-none focus:border-accent resize-none font-bold placeholder:opacity-30" placeholder="Örn: Bebek sandalyesi lazım..." />
                                </div>
                                <div className="col-span-2 pt-6 flex gap-6">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 glass h-16 rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-white/5 transition-all">İptal</button>
                                    <button type="submit" className="flex-1 bg-accent hover:bg-accent-hover text-white h-16 rounded-[24px] font-black uppercase tracking-widest text-xs shadow-2xl shadow-accent/30 transition-all active:scale-95">Kaydet</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

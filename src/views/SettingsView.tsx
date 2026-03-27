import React, { useState } from 'react';
import { Settings, Printer, Plus, Trash2, Edit2, Check, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import { PrinterConfig } from '../types';

const COLOR_OPTIONS = [
    { value: 'red', label: 'Kırmızı', bg: 'bg-red-500', ring: 'ring-red-500' },
    { value: 'amber', label: 'Sarı', bg: 'bg-amber-500', ring: 'ring-amber-500' },
    { value: 'blue', label: 'Mavi', bg: 'bg-blue-500', ring: 'ring-blue-500' },
    { value: 'green', label: 'Yeşil', bg: 'bg-green-500', ring: 'ring-green-500' },
    { value: 'purple', label: 'Mor', bg: 'bg-purple-500', ring: 'ring-purple-500' },
    { value: 'rose', label: 'Pembe', bg: 'bg-rose-500', ring: 'ring-rose-500' },
    { value: 'cyan', label: 'Turkuaz', bg: 'bg-cyan-500', ring: 'ring-cyan-500' },
    { value: 'orange', label: 'Turuncu', bg: 'bg-orange-500', ring: 'ring-orange-500' },
];

const colorMap: Record<string, { bg: string; text: string; border: string; ring: string }> = {
    red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', ring: 'ring-red-500' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', ring: 'ring-amber-500' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', ring: 'ring-blue-500' },
    green: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', ring: 'ring-green-500' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', ring: 'ring-purple-500' },
    rose: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', ring: 'ring-rose-500' },
    cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30', ring: 'ring-cyan-500' },
    orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30', ring: 'ring-orange-500' },
};

interface Props {
    showToast: (m: string, t?: 'success' | 'error') => void;
    printers: PrinterConfig[];
    onAddPrinter: (p: Omit<PrinterConfig, 'id'>) => void;
    onUpdatePrinter: (id: string, p: Partial<PrinterConfig>) => void;
    onDeletePrinter: (id: string) => void;
}

export const SettingsView = ({ showToast, printers, onAddPrinter, onUpdatePrinter, onDeletePrinter }: Props) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState('red');
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('red');

    const handleAdd = () => {
        if (!newName.trim()) return;
        onAddPrinter({ name: newName.trim(), color: newColor });
        showToast(`"${newName}" yazıcısı eklendi.`, 'success');
        setNewName('');
        setNewColor('red');
        setIsAdding(false);
    };

    const startEdit = (p: PrinterConfig) => {
        setEditingId(p.id);
        setEditName(p.name);
        setEditColor(p.color);
    };

    const handleUpdate = (id: string) => {
        if (!editName.trim()) return;
        onUpdatePrinter(id, { name: editName.trim(), color: editColor });
        showToast('Yazıcı güncellendi.', 'success');
        setEditingId(null);
    };

    const handleDelete = (p: PrinterConfig) => {
        if (confirm(`"${p.name}" yazıcısını silmek istediğinize emin misiniz?`)) {
            onDeletePrinter(p.id);
            showToast(`"${p.name}" silindi.`, 'success');
        }
    };

    const handleReset = () => {
        if (confirm('Tüm yerel verileri (LocalStorage) sıfırlamak istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
            localStorage.clear();
            showToast('Tüm yerel veriler temizlendi. Sayfa yenileniyor...', 'success');
            setTimeout(() => window.location.reload(), 1500);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                {/* Printer Management Card */}
                <div className="glass p-8 rounded-[40px] border border-white/5 shadow-2xl space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-black flex items-center gap-3 uppercase tracking-tighter">
                            <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20">
                                <Printer size={20} className="text-accent" />
                            </div>
                            Yazıcı Yönetimi
                        </h3>
                        <button
                            onClick={() => setIsAdding(true)}
                            className="bg-accent hover:bg-accent-hover text-white px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-accent/20 active:scale-95"
                        >
                            <Plus size={16} /> Ekle
                        </button>
                    </div>

                    {/* Info */}
                    <div className="flex items-start gap-3 bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4">
                        <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-text-secondary leading-relaxed">
                            Her yazıcıya bir isim ve renk verin. Menü yönetimindeki her ürüne bu yazıcılardan birini atayın.
                            Sipariş onaylandığında ürünler otomatik olarak doğru yazıcıya yönlendirilir.
                        </p>
                    </div>

                    {/* Printers list */}
                    <div className="space-y-3">
                        <AnimatePresence>
                            {printers.map(p => {
                                const clr = colorMap[p.color] || colorMap['red'];
                                const isEditing = editingId === p.id;
                                return (
                                    <motion.div
                                        key={p.id}
                                        layout
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className={cn(
                                            "p-4 rounded-2xl border flex items-center gap-4 transition-all",
                                            clr.bg, clr.border
                                        )}
                                    >
                                        {/* Color dot */}
                                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", clr.bg, "border", clr.border)}>
                                            <Printer size={18} className={clr.text} />
                                        </div>

                                        {isEditing ? (
                                            <div className="flex-1 flex gap-2 flex-wrap">
                                                <input
                                                    autoFocus
                                                    value={editName}
                                                    onChange={e => setEditName(e.target.value)}
                                                    className="flex-1 min-w-[120px] bg-black/30 border border-white/10 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-accent"
                                                    onKeyDown={e => e.key === 'Enter' && handleUpdate(p.id)}
                                                />
                                                <div className="flex gap-1.5 items-center">
                                                    {COLOR_OPTIONS.map(c => (
                                                        <button
                                                            key={c.value}
                                                            onClick={() => setEditColor(c.value)}
                                                            className={cn(
                                                                "w-6 h-6 rounded-full transition-all",
                                                                c.bg,
                                                                editColor === c.value ? `ring-2 ring-offset-2 ring-offset-black ${c.ring} scale-110` : 'opacity-60 hover:opacity-100'
                                                            )}
                                                            title={c.label}
                                                        />
                                                    ))}
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleUpdate(p.id)} className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white border border-emerald-500/20 transition-all">
                                                        <Check size={16} />
                                                    </button>
                                                    <button onClick={() => setEditingId(null)} className="p-2 rounded-xl bg-white/5 text-text-secondary hover:text-white border border-white/10 transition-all">
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex-1">
                                                    <p className={cn("font-black text-sm uppercase tracking-widest", clr.text)}>{p.name}</p>
                                                    <p className="text-[10px] text-text-secondary opacity-50 font-mono">ID: {p.id}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => startEdit(p)} className="p-2 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-white border border-amber-500/20 transition-all">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button onClick={() => handleDelete(p)} className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white border border-rose-500/20 transition-all">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* Add form */}
                        <AnimatePresence>
                            {isAdding && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="p-4 rounded-2xl border border-accent/30 bg-accent/5 space-y-3"
                                >
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Yazıcı adı (örn: Balkon, Soğuk Mutfak...)"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-accent"
                                    />
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest mr-1">Renk:</span>
                                        {COLOR_OPTIONS.map(c => (
                                            <button
                                                key={c.value}
                                                onClick={() => setNewColor(c.value)}
                                                className={cn(
                                                    "w-7 h-7 rounded-full transition-all",
                                                    c.bg,
                                                    newColor === c.value ? `ring-2 ring-offset-2 ring-offset-black ${c.ring} scale-110` : 'opacity-60 hover:opacity-100'
                                                )}
                                                title={c.label}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleAdd}
                                            disabled={!newName.trim()}
                                            className="flex-1 bg-accent hover:bg-accent-hover text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30"
                                        >
                                            Ekle
                                        </button>
                                        <button onClick={() => setIsAdding(false)} className="flex-1 glass py-3 rounded-xl font-black text-xs uppercase tracking-widest">
                                            İptal
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* System Settings Card */}
                <div className="glass p-8 rounded-[40px] border border-white/5 shadow-2xl space-y-6">
                    <h3 className="text-xl font-black flex items-center gap-3 uppercase tracking-tighter">
                        <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20">
                            <Settings size={20} className="text-accent" />
                        </div>
                        Sistem Ayarları
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-6 bg-rose-500/5 rounded-[32px] border border-rose-500/20">
                            <div>
                                <h4 className="font-black text-rose-500 uppercase tracking-widest text-sm">Veri Sıfırlama</h4>
                                <p className="text-text-secondary text-xs mt-2 opacity-70">Tüm yerel verileri (masa, menü, personel) temizler.</p>
                            </div>
                            <button
                                onClick={handleReset}
                                className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-rose-500/20 active:scale-95 transition-all"
                            >
                                Reset At
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

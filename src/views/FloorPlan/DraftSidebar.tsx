import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UtensilsCrossed, Package, Plus, Minus, StickyNote, Trash2, Send } from 'lucide-react';
import { cn } from '../../utils';
import { OrderItem } from '../../types';

interface DraftSidebarProps {
    orderDraft: OrderItem[];
    setOrderDraft: React.Dispatch<React.SetStateAction<OrderItem[]>>;
    editingNoteId: string | null;
    setEditingNoteId: (id: string | null) => void;
    updateDraftNote: (id: string, note: string) => void;
    updateDraftQuantity: (id: string, delta: number) => void;
    handleRemoveDraftItem: (id: string) => void;
    generalNote: string;
    setGeneralNote: (note: string) => void;
    handleConfirmOrder: () => void;
}

export function DraftSidebar({
    orderDraft,
    setOrderDraft,
    editingNoteId,
    setEditingNoteId,
    updateDraftNote,
    updateDraftQuantity,
    handleRemoveDraftItem,
    generalNote,
    setGeneralNote,
    handleConfirmOrder
}: DraftSidebarProps) {
    const subtotal = orderDraft.reduce((acc, i) => acc + (i.price * i.quantity), 0);

    return (
        <div className="flex-1 min-w-[340px] bg-[#1a1a1c]/80 backdrop-blur-xl border-l border-border/50 p-4 flex flex-col animate-in slide-in-from-right duration-500">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-accent/10 border border-accent/20">
                        <UtensilsCrossed size={20} className="text-accent" />
                    </div>
                    <h4 className="font-bold text-lg">Sipariş Taslağı</h4>
                </div>
                {orderDraft.length > 0 && (
                    <button
                        onClick={() => setOrderDraft([])}
                        className="text-rose-400 text-xs hover:text-rose-300 font-medium tracking-wide transition-colors"
                    >
                        Temizle
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto pr-3 -mr-3 space-y-1.5 custom-scrollbar">
                {orderDraft.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none">
                        <Package size={64} strokeWidth={1} className="mb-4" />
                        <p className="text-sm">Sipariş listesini görmek için<br />menüden ürün seçin.</p>
                    </div>
                ) : (
                    orderDraft.map((draftItem) => (
                        <motion.div
                            layout
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            key={draftItem.id}
                            className="group p-2 rounded-xl bg-surface/20 border border-white/5 hover:bg-surface/40 transition-all flex flex-col gap-2 relative overflow-hidden"
                        >
                            <div className="flex items-center justify-between gap-3 px-1">
                                <div className="flex-1 min-w-0 flex flex-col">
                                    <h5 className="text-[11px] font-black truncate group-hover:text-accent transition-colors tracking-tight">{draftItem.name}</h5>
                                    {draftItem.selectedModifiers && draftItem.selectedModifiers.length > 0 && (
                                        <p className="text-[9px] text-text-secondary truncate opacity-50">
                                            {draftItem.selectedModifiers.map(m => m.option.name).join(', ')}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 bg-black/20 p-0.5 rounded-lg border border-white/5">
                                    <button
                                        onClick={() => updateDraftQuantity(draftItem.id, -1)}
                                        className="w-6 h-6 rounded-md bg-white/5 hover:bg-rose-500/20 text-text-secondary hover:text-rose-500 flex items-center justify-center transition-all active:scale-90"
                                    >
                                        <Minus size={12} />
                                    </button>
                                    <span className="w-6 text-center font-black text-xs tabular-nums">{draftItem.quantity}</span>
                                    <button
                                        onClick={() => updateDraftQuantity(draftItem.id, 1)}
                                        className="w-6 h-6 rounded-md bg-white/5 hover:bg-accent/20 text-text-secondary hover:text-accent flex items-center justify-center transition-all active:scale-90"
                                    >
                                        <Plus size={12} />
                                    </button>
                                </div>
                                <div className="text-right shrink-0 min-w-[50px]">
                                    <p className="font-black text-white text-xs tracking-tighter tabular-nums">₺{draftItem.price * draftItem.quantity}</p>
                                </div>
                                <button
                                    onClick={() => handleRemoveDraftItem(draftItem.id)}
                                    className="p-1 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>

                            <AnimatePresence mode="wait">
                                {editingNoteId === draftItem.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden px-1"
                                    >
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Not ekleyin..."
                                            value={draftItem.note || ''}
                                            onChange={(e) => updateDraftNote(draftItem.id, e.target.value)}
                                            onBlur={() => setEditingNoteId(null)}
                                            onKeyDown={(e) => e.key === 'Enter' && setEditingNoteId(null)}
                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-[10px] focus:outline-none focus:border-accent"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {draftItem.note && editingNoteId !== draftItem.id && (
                                <div className="px-1 flex items-center justify-between">
                                    <p className="text-[9px] text-orange-400 font-bold italic truncate flex-1">
                                        "{draftItem.note}"
                                    </p>
                                    <button
                                        onClick={() => setEditingNoteId(draftItem.id)}
                                        className="text-[9px] text-accent font-black hover:underline ml-2"
                                    >
                                        Düzenle
                                    </button>
                                </div>
                            )}

                            {!draftItem.note && editingNoteId !== draftItem.id && (
                                <button
                                    onClick={() => setEditingNoteId(draftItem.id)}
                                    className="text-[9px] text-text-secondary/30 hover:text-accent font-black uppercase tracking-tighter self-start px-1 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    + Not Ekle
                                </button>
                            )}
                        </motion.div>
                    ))
                )}
            </div>



            <div className="mt-6 pt-6 border-t border-border/50 space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-orange-400/80 mb-1">
                        <StickyNote size={12} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Masa Geneli Not</span>
                    </div>
                    <textarea
                        placeholder="Masa için özel not..."
                        value={generalNote}
                        onChange={(e) => setGeneralNote(e.target.value)}
                        className="w-full bg-black/20 border border-white/5 rounded-2xl p-4 text-xs focus:outline-none focus:border-orange-500/50 min-h-[60px] resize-none transition-all placeholder:opacity-30"
                    />
                </div>

                <div className="flex justify-between items-center bg-accent/5 p-6 rounded-3xl border border-accent/20">
                    <span className="font-black text-accent uppercase tracking-widest text-xs">Toplam Taslak</span>
                    <span className="font-black text-2xl text-accent tabular-nums">₺{subtotal.toFixed(2)}</span>
                </div>

                <button
                    onClick={handleConfirmOrder}
                    disabled={orderDraft.length === 0}
                    className={cn(
                        "w-full py-5 rounded-2xl font-black shadow-xl transition-all flex items-center justify-center gap-3 relative overflow-hidden group active:scale-[0.98]",
                        orderDraft.length > 0
                            ? "bg-accent hover:bg-accent-hover text-white shadow-accent/20 cursor-pointer"
                            : "bg-surface/50 text-text-secondary border border-border/50 opacity-50 cursor-not-allowed shadow-none"
                    )}
                >
                    <Send size={20} className={cn(
                        orderDraft.length > 0 && "group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                    )} />
                    {orderDraft.length === 0 ? "ÜRÜN SEÇİNİZ" : "SİPARİŞİ ONAYLA"}
                </button>
            </div>
        </div>
    );
}

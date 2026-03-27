import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../../utils';
import { MenuItem, OrderItem } from '../../types';

interface MenuSelectorProps {
    menuItems: MenuItem[];
    orderDraft: OrderItem[];
    activeMenuCategory: string;
    setActiveMenuCategory: (cat: string) => void;
    onItemClick: (item: MenuItem) => void;
    onClose: () => void;
}

export function MenuSelector({
    menuItems,
    orderDraft,
    activeMenuCategory,
    setActiveMenuCategory,
    onItemClick,
    onClose
}: MenuSelectorProps) {
    const categories = ['Tümü', ...Array.from(new Set(menuItems.map(i => i.category)))];

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-12">
                <div>
                    <h4 className="font-black text-4xl tracking-tighter">Menü Seçimi</h4>
                    <p className="text-text-secondary text-sm mt-2 uppercase tracking-[0.3em] font-bold opacity-40">Siparişe eklemek için ürünleri seçin</p>
                </div>
                <button
                    onClick={onClose}
                    className="bg-surface/50 hover:bg-surface border-2 border-border/50 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
                >
                    Kapat
                </button>
            </div>

            <div className="flex gap-4 mb-8 overflow-x-auto pb-4 scroll-smooth no-scrollbar w-full min-h-fit shrink-0">
                <style dangerouslySetInnerHTML={{ __html: `.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }` }} />
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveMenuCategory(cat)}
                        className={cn(
                            "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 shrink-0 h-fit",
                            activeMenuCategory === cat
                                ? "bg-accent border-accent text-white shadow-lg shadow-accent/20 scale-105"
                                : "bg-surface/20 border-border/50 text-text-secondary hover:border-accent/40 active:scale-95"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 pb-6 overflow-y-auto custom-scrollbar min-h-0">
                {menuItems.filter(i => activeMenuCategory === 'Tümü' || i.category === activeMenuCategory).map(item => {
                    const draftCount = orderDraft.filter(di => di.menuItemId === item.id).length;
                    const isAvailable = item.isAvailable !== false;

                    return (
                        <button
                            key={item.id}
                            disabled={!isAvailable}
                            onClick={() => isAvailable && onItemClick(item)}
                            className={cn(
                                "relative group p-5 rounded-[40px] bg-surface/20 border-2 border-border/30 transition-all text-left flex flex-col gap-5",
                                isAvailable
                                    ? "hover:border-accent hover:bg-accent/5 active:scale-95 cursor-pointer"
                                    : "opacity-40 grayscale cursor-not-allowed border-rose-500/20"
                            )}
                        >
                            {draftCount > 0 && isAvailable && (
                                <div className="absolute -top-3 -right-3 bg-accent text-white w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shadow-2xl border-4 border-[#1a1a1c] z-10 animate-in zoom-in">
                                    {draftCount}
                                </div>
                            )}
                            {!isAvailable && (
                                <div className="absolute inset-0 z-20 flex items-center justify-center">
                                    <div className="bg-rose-600 text-white px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl rotate-[-12deg] border-2 border-white/20">
                                        Tükendi
                                    </div>
                                </div>
                            )}
                            <div className="flex-1 flex flex-col justify-between">
                                <div className="space-y-1">
                                    <h5 className={cn("font-black text-xl leading-tight transition-colors", isAvailable && "group-hover:text-accent")}>{item.name}</h5>
                                    <p className="text-[10px] text-text-secondary uppercase font-black tracking-[0.2em] opacity-40">{item.category}</p>
                                </div>
                                <div className="mt-6 flex items-center justify-between">
                                    <p className="text-accent font-black text-2xl tracking-tighter">₺{item.price}</p>
                                    <div className="bg-white/5 p-3 rounded-2xl group-hover:bg-accent/20 transition-all border border-white/5">
                                        <Plus size={20} className={cn("transition-transform", isAvailable && "group-hover:rotate-90 text-accent")} />
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { ChefHat, Clock, AlertCircle, StickyNote, CheckCircle2 } from 'lucide-react';
import { cn } from '../utils';
import { Order, OrderItem } from '../types';
import { apiService } from '../services/apiService';

export function KitchenView({ orders, setOrders }: { orders: Order[], user: any, setOrders: React.Dispatch<React.SetStateAction<Order[]>> }) {
    const [, forceUpdate] = useState(0);

    // Live tick every 10 seconds to update elapsed times
    useEffect(() => {
        const interval = setInterval(() => forceUpdate(n => n + 1), 10000);
        return () => clearInterval(interval);
    }, []);

    const handleStatusChange = async (orderId: string, itemId: string, newStatus: OrderItem['status']) => {
        try {
            await apiService.updateOrderItemStatus(orderId, itemId, newStatus);
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Bilinmeyen hata';
            alert(`Durum güncellenemedi! Hata: ${msg}`);
        }
    };

    const allItems = orders
        .filter(o => o.status === 'active')
        .flatMap(o => o.items.map(i => ({ ...i, orderId: o.id, tableId: o.tableId, waiterName: o.waiterName || '' })));

    const columns: { key: OrderItem['status'], label: string, color: string, border: string, bg: string, btnLabel: string, nextStatus: OrderItem['status'] | null }[] = [
        { key: 'new', label: 'Bekliyor', color: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/10', btnLabel: 'Hazırlamaya Başla →', nextStatus: 'preparing' },
        { key: 'preparing', label: 'Hazırlanıyor', color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/10', btnLabel: 'Tamamlandı →', nextStatus: 'ready' },
        { key: 'ready', label: 'Servise Hazır', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', btnLabel: 'Servis Edildi →', nextStatus: 'served' },
        { key: 'served', label: 'Servis Edildi', color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10', btnLabel: '', nextStatus: null },
    ];

    const formatTime = (ts?: number) => {
        if (!ts) return '—';
        return new Date(ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    };

    const elapsed = (ts?: number): string => {
        if (!ts) return '';
        const mins = Math.floor((Date.now() - ts) / 60000);
        if (mins < 1) return '< 1 dk';
        if (mins < 60) return `${mins} dk`;
        return `${Math.floor(mins / 60)}s ${mins % 60}dk`;
    };

    const isUrgent = (ts?: number, warnMins = 10) => !!ts && (Date.now() - ts) / 60000 > warnMins;

    const totalActive = allItems.filter(i => i.status !== 'served' && i.status !== 'paid').length;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Mutfak Ekranı</h2>
                    <p className="text-text-secondary text-xs mt-1">
                        {totalActive} aktif kalem &nbsp;·&nbsp; {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} itibariyle
                    </p>
                </div>
                <div className="flex gap-3">
                    {columns.map(col => {
                        const count = allItems.filter(i => i.status === col.key).length;
                        return (
                            <div key={col.key} className={cn('px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2', col.bg, col.border, 'border')}>
                                <span className={col.color}>{col.label}</span>
                                <span className="text-white/80 bg-white/10 rounded-full px-2">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
                {columns.map(col => {
                    const colItems = allItems.filter(i => i.status === col.key);
                    return (
                        <div key={col.key} className={cn('rounded-3xl border-2 overflow-hidden flex flex-col', col.border, 'bg-[#1c1c1f]')}>
                            {/* Column Header */}
                            <div className={cn('px-5 py-4 flex items-center justify-between', col.bg)}>
                                <div className="flex items-center gap-2">
                                    <span className={cn('w-2.5 h-2.5 rounded-full animate-pulse', col.key === 'new' ? 'bg-rose-500' : col.key === 'preparing' ? 'bg-amber-500' : col.key === 'ready' ? 'bg-emerald-500' : 'bg-blue-500')} />
                                    <h3 className={cn('font-black text-sm uppercase tracking-widest', col.color)}>{col.label}</h3>
                                </div>
                                <span className={cn('text-lg font-black', col.color)}>{colItems.length}</span>
                            </div>

                            {/* Cards */}
                            <div className="flex flex-col gap-3 p-3 min-h-[200px]">
                                {colItems.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 opacity-20">
                                        <ChefHat size={32} className="mb-2" />
                                        <p className="text-xs font-bold">Boş</p>
                                    </div>
                                ) : (
                                    colItems.map(item => {
                                        const urgent = col.key === 'new' && isUrgent(item.statusTimestamps?.new, 8)
                                            || col.key === 'preparing' && isUrgent(item.statusTimestamps?.preparing, 15);
                                        const waitStart = item.statusTimestamps?.new;
                                        const prepStart = item.statusTimestamps?.preparing;
                                        const readyAt = item.statusTimestamps?.ready;
                                        const servedAt = item.statusTimestamps?.served;

                                        return (
                                            <div
                                                key={item.id}
                                                className={cn(
                                                    'rounded-2xl p-4 flex flex-col gap-3 border transition-all',
                                                    urgent ? 'border-rose-500/60 bg-rose-500/5 shadow-lg shadow-rose-500/10' : 'border-white/5 bg-[#252528]'
                                                )}
                                            >
                                                {/* Urgent badge */}
                                                {urgent && (
                                                    <div className="flex items-center gap-1.5 text-rose-400 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                                        <AlertCircle size={12} /> Uzun Bekliyor!
                                                    </div>
                                                )}

                                                {/* Item + table + arrival time */}
                                                <div className="flex justify-between items-start gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-black text-white leading-tight">{item.quantity}x {item.name}</p>
                                                        <p className={cn('text-[11px] font-bold uppercase tracking-widest mt-0.5', col.color)}>
                                                            {item.tableId.replace('table-', 'Masa ')}
                                                            {item.waiterName ? ` · ${item.waiterName}` : ''}
                                                        </p>
                                                        {/* Arrival time — always visible */}
                                                        {waitStart && (
                                                            <div className={cn(
                                                                'inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-lg text-[11px] font-black',
                                                                urgent ? 'bg-rose-500/15 text-rose-400' : 'bg-white/5 text-text-secondary'
                                                            )}>
                                                                <Clock size={10} className={urgent ? 'text-rose-400' : 'text-text-secondary'} />
                                                                {formatTime(waitStart)}
                                                                <span className="opacity-60 mx-0.5">·</span>
                                                                {elapsed(waitStart)}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {col.key === 'preparing' && prepStart && (
                                                        <span className={cn('text-[11px] font-black shrink-0 px-2 py-0.5 rounded-lg', urgent ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/10 text-amber-400')}>
                                                            {elapsed(prepStart)}
                                                        </span>
                                                    )}
                                                    {col.key === 'ready' && readyAt && (
                                                        <span className="text-[11px] font-black shrink-0 px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                                                            {elapsed(readyAt)} bekliyor
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Modifiers */}
                                                {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {item.selectedModifiers.map((m, idx) => (
                                                            <span key={idx} className="bg-white/5 px-2 py-0.5 rounded-md text-[10px] font-medium text-text-secondary">
                                                                +{m.option.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Note */}
                                                {item.note && (
                                                    <div className="bg-orange-500/10 border border-orange-500/20 px-3 py-2 rounded-xl flex items-start gap-2">
                                                        <StickyNote size={12} className="text-orange-400 shrink-0 mt-0.5" />
                                                        <p className="text-[11px] text-orange-300 italic leading-relaxed">"{item.note}"</p>
                                                    </div>
                                                )}

                                                {/* Timestamp timeline */}
                                                <div className="border-t border-white/5 pt-3 space-y-1">
                                                    {waitStart && (
                                                        <div className="flex items-center justify-between text-[10px] text-text-secondary">
                                                            <span className="flex items-center gap-1"><Clock size={9} className="text-rose-400" /> Sipariş</span>
                                                            <span className="font-medium">{formatTime(waitStart)}</span>
                                                        </div>
                                                    )}
                                                    {prepStart && (
                                                        <div className="flex items-center justify-between text-[10px] text-text-secondary">
                                                            <span className="flex items-center gap-1"><Clock size={9} className="text-amber-400" /> Hazırlanmaya Başladı</span>
                                                            <span className="font-medium">{formatTime(prepStart)}</span>
                                                        </div>
                                                    )}
                                                    {readyAt && (
                                                        <div className="flex items-center justify-between text-[10px] text-text-secondary">
                                                            <span className="flex items-center gap-1"><Clock size={9} className="text-emerald-400" /> Hazır</span>
                                                            <span className="font-medium">{formatTime(readyAt)}</span>
                                                        </div>
                                                    )}
                                                    {servedAt && (
                                                        <div className="flex items-center justify-between text-[10px] text-text-secondary">
                                                            <span className="flex items-center gap-1"><CheckCircle2 size={9} className="text-blue-400" /> Servis Edildi</span>
                                                            <span className="font-medium">{formatTime(servedAt)}</span>
                                                        </div>
                                                    )}
                                                    {/* Total duration when served */}
                                                    {servedAt && waitStart && (
                                                        <div className="flex items-center justify-between text-[10px] font-black mt-1">
                                                            <span className="text-blue-400">Toplam Süre</span>
                                                            <span className="text-blue-400">{elapsed(waitStart)}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action button */}
                                                {col.nextStatus && (
                                                    <button
                                                        onClick={() => handleStatusChange(item.orderId!, item.id, col.nextStatus!)}
                                                        className={cn(
                                                            'w-full py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2',
                                                            col.key === 'new' ? 'bg-amber-500 hover:bg-amber-400 text-black' :
                                                                col.key === 'preparing' ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20' :
                                                                    'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30'
                                                        )}
                                                    >
                                                        {col.btnLabel}
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

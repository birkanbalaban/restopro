import React, { useState } from 'react';
import { CreditCard, Banknote, TrendingUp, Printer } from 'lucide-react';
import { cn } from '../utils';
import { SaleRecord, MenuItem } from '../types';

export const DashboardView = ({ sales, menuItems }: { sales: SaleRecord[], menuItems: MenuItem[] }) => {
    const [activeFilter, setActiveFilter] = useState<'Bugün' | 'Hafta' | 'Ay' | 'Özel'>('Bugün');
    const [customStart, setCustomStart] = useState<string>('');
    const [customEnd, setCustomEnd] = useState<string>('');

    const getTimestamp = (val: any) => {
        if (!val) return Date.now();
        if (typeof val === 'number') return val;
        if (val.toMillis) return val.toMillis();
        if (val instanceof Date) return val.getTime();
        if (typeof val === 'string') return new Date(val).getTime();
        if (val.seconds) return val.seconds * 1000;
        return Date.now();
    };

    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;

    let filterStartMs = 0;
    let filterEndMs = now;

    if (activeFilter === 'Bugün') {
        filterStartMs = new Date().setHours(0, 0, 0, 0);
    } else if (activeFilter === 'Hafta') {
        filterStartMs = now - 7 * dayMs;
    } else if (activeFilter === 'Ay') {
        filterStartMs = now - 30 * dayMs;
    } else if (activeFilter === 'Özel') {
        filterStartMs = customStart ? new Date(customStart).getTime() : 0;
        filterEndMs = customEnd ? new Date(customEnd).setHours(23, 59, 59, 999) : now;
    }

    const filteredSales = sales.filter(s => {
        const ts = getTimestamp(s.timestampObj || s.timestamp);
        return ts >= filterStartMs && ts <= filterEndMs;
    }).sort((a, b) => getTimestamp(b.timestampObj) - getTimestamp(a.timestampObj));

    const dailyRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);

    const getDayName = (offsetIndex: number) => {
        const d = new Date(now - offsetIndex * dayMs);
        return d.toLocaleDateString('tr-TR', { weekday: 'short' });
    };

    const last7DaysRevenues = Array(7).fill(0).map((_, i) => {
        const startObj = new Date(now - i * dayMs);
        startObj.setHours(0, 0, 0, 0);
        const start = startObj.getTime();
        const end = start + dayMs;
        return sales
            .filter(s => {
                const ts = getTimestamp(s.timestampObj || s.timestamp);
                return ts >= start && ts < end;
            })
            .reduce((sum, s) => sum + s.total, 0);
    }).reverse();

    const orderedDays = Array(7).fill(0).map((_, i) => getDayName(i)).reverse();
    const maxWeeklyRevenue = Math.max(...last7DaysRevenues, 1000);

    const soldItemsMap: Record<string, { item: MenuItem, qty: number, revenue: number }> = {};
    filteredSales.forEach(sale => {
        if (sale.items) {
            sale.items.forEach(orderItem => {
                if (!soldItemsMap[orderItem.menuItemId]) {
                    const menuItem = menuItems.find(m => m.id === orderItem.menuItemId) || {
                        id: orderItem.menuItemId,
                        name: orderItem.name,
                        category: 'Bilinmiyor',
                        description: '',
                        price: orderItem.price,
                        image: 'https://i.pravatar.cc/150?u=' + orderItem.menuItemId,
                        isAvailable: true
                    };
                    soldItemsMap[orderItem.menuItemId] = { item: menuItem, qty: 0, revenue: 0 };
                }
                soldItemsMap[orderItem.menuItemId].qty += orderItem.quantity;
                soldItemsMap[orderItem.menuItemId].revenue += orderItem.price * orderItem.quantity;
            });
        }
    });

    const topSoldItems = Object.values(soldItemsMap).sort((a, b) => b.qty - a.qty).slice(0, 6);

    const dailyTarget = 6000;
    const stats = {
        revenue: dailyRevenue,
        target: dailyTarget
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 overflow-x-auto pb-4 border-b border-border/20 no-scrollbar">
                <div className="flex flex-col gap-2 shrink-0">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold tracking-tight">Raporlar & Analizler</h2>
                    </div>
                    <p className="text-text-secondary text-xs font-medium print:hidden">İşletmenizin gerçek satış verilerine dayalı performans analizi.</p>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-4 shrink-0">
                    {activeFilter === 'Özel' && (
                        <div className="flex items-center gap-2 bg-[#252528] p-1.5 rounded-2xl border border-border/50 shadow-sm">
                            <input
                                type="date"
                                value={customStart}
                                onChange={e => setCustomStart(e.target.value)}
                                className="bg-transparent text-xs text-text-secondary hover:text-white focus:outline-none px-2 py-1"
                                style={{ colorScheme: 'dark' }}
                            />
                            <span className="text-text-secondary text-xs">-</span>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={e => setCustomEnd(e.target.value)}
                                className="bg-transparent text-xs text-text-secondary hover:text-white focus:outline-none px-2 py-1"
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>
                    )}
                    <div className="flex items-center bg-[#252528] p-1.5 rounded-2xl border border-border/50 shadow-sm overflow-x-auto">
                        {(['Bugün', 'Hafta', 'Ay', 'Özel'] as const).map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={cn(
                                    "px-4 md:px-6 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                    filter === activeFilter ? "bg-accent text-white shadow-lg shadow-accent/20" : "text-text-secondary hover:text-white"
                                )}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="glass p-8 rounded-3xl bg-[#161618] border border-white/5 flex flex-col justify-between">
                    <div>
                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-4">Toplam İşlem</p>
                        <h3 className="text-4xl font-black text-white">{filteredSales.length} <span className="text-sm font-bold text-text-secondary">Adet</span></h3>
                    </div>
                    <p className="text-[10px] text-text-secondary mt-4 italic">Seçili tarih aralığındaki toplam fatura sayısı.</p>
                </div>

                <div className="glass p-8 rounded-3xl bg-[#161618] border border-white/5 flex flex-col justify-between">
                    <div>
                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mb-4">Ortalama Sepet</p>
                        <h3 className="text-4xl font-black text-white">₺{filteredSales.length > 0 ? (dailyRevenue / filteredSales.length).toFixed(2) : '0,00'}</h3>
                    </div>
                    <p className="text-[10px] text-text-secondary mt-4 italic">Fiş başına ortalama harulama tutarı.</p>
                </div>

                <div className="glass p-8 rounded-3xl bg-[#1A3326] border border-[#4ADE80]/30 shadow-2xl shadow-emerald-500/10 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#4ADE80]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-4">Toplam Ciro</p>
                        <h3 className="text-4xl font-black text-[#4ADE80]">₺{dailyRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</h3>
                    </div>
                    <div className="relative z-10 mt-8">
                        <div className="flex justify-between text-[10px] font-black text-emerald-400/60 uppercase tracking-widest mb-2">
                            <span>Hedef: ₺{dailyTarget.toLocaleString('tr-TR')}</span>
                            <span>{Math.round((dailyRevenue / dailyTarget) * 100)}%</span>
                        </div>
                        <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                            <div className="h-full bg-[#4ADE80] rounded-full shadow-[0_0_10px_rgba(74,222,128,0.5)] transition-all duration-1000" style={{ width: `${Math.min((dailyRevenue / dailyTarget) * 100, 100)}%` }} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass p-8 rounded-[48px] bg-[#252528] border-none shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="flex justify-between items-center mb-10 relative">
                            <div>
                                <h3 className="text-xl font-bold">Gelir Trendi</h3>
                                <p className="text-text-secondary text-[10px] font-black uppercase tracking-widest mt-1">Son 7 Günlük Performans</p>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-xl border border-emerald-400/20 text-xs font-bold">
                                <TrendingUp size={14} /> %24 Artış
                            </div>
                        </div>
                        <div className="flex items-end gap-3 h-52 px-4 relative">
                            {last7DaysRevenues.map((revenue, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-4 group/bar">
                                    <div className="absolute -top-12 left-0 right-0 flex justify-center opacity-0 group-hover/bar:opacity-100 transition-all duration-300 pointer-events-none z-10">
                                        <div className="bg-surface border border-border px-3 py-1.5 rounded-xl text-[10px] font-black text-accent shadow-2xl">₺{revenue.toLocaleString()}</div>
                                    </div>
                                    <div
                                        style={{ height: `${(revenue / maxWeeklyRevenue) * 100}%`, minHeight: '4px' }}
                                        className={cn(
                                            "w-full rounded-t-2xl transition-all duration-700 ease-out cursor-pointer relative",
                                            i === 6 ? "bg-accent shadow-lg shadow-accent/30" : "bg-accent/10 border-x border-t border-accent/20 group-hover/bar:bg-accent/30"
                                        )}
                                    />
                                    <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{orderedDays[i]}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="glass p-8 rounded-[48px] bg-[#252528] border-none shadow-xl">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl font-bold">Son Satışlar</h3>
                                <p className="text-text-secondary text-[10px] font-black uppercase tracking-widest mt-1">Seçili Tarihteki Kayıtlar</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-text-secondary text-xs uppercase tracking-wider border-b border-border/50 pb-4">
                                        <th className="pb-4 font-bold">Masa</th>
                                        <th className="pb-4 font-bold">Ödeme</th>
                                        <th className="pb-4 font-bold">Saat</th>
                                        <th className="pb-4 font-bold">Ürünler</th>
                                        <th className="pb-4 font-bold text-right">Toplam</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {filteredSales.length === 0 ? (
                                        <tr><td colSpan={5} className="py-4 text-center text-text-secondary text-sm">Satış bulunamadı.</td></tr>
                                    ) : filteredSales.map((sale) => (
                                        <tr key={sale.id} className="group hover:bg-white/5 transition-colors">
                                            <td className="py-4 font-bold">{sale.tableName}</td>
                                            <td className="py-4">
                                                <span className={cn(
                                                    "flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full w-fit",
                                                    sale.paymentMethod === 'card' ? "bg-blue-500/10 text-blue-400" : "bg-[#4ADE80]/10 text-[#4ADE80]"
                                                )}>
                                                    {sale.paymentMethod === 'card' ? <CreditCard size={14} /> : <Banknote size={14} />}
                                                    {sale.paymentMethod === 'card' ? 'Kart' : 'Nakit'}
                                                </span>
                                            </td>
                                            <td className="py-4 text-text-secondary text-sm font-medium">{sale.timestamp}</td>
                                            <td className="py-4 text-text-secondary text-sm font-medium">{sale.itemsCount} Ürün</td>
                                            <td className="py-4 text-right font-black text-white">₺{sale.total.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="glass p-8 rounded-[48px] bg-[#252528] border-none shadow-xl flex flex-col h-full">
                    <div>
                        <h3 className="text-xl font-bold mb-1">Satılan Ürünler</h3>
                        <p className="text-text-secondary text-[10px] font-black uppercase tracking-widest mb-6">Detaylı Satış Analizi</p>
                    </div>
                    <div className="flex-1 space-y-4 overflow-y-auto pr-2 no-scrollbar">
                        {topSoldItems.length === 0 ? (
                            <p className="text-text-secondary text-sm opacity-50 font-medium">Bu aralıkta henüz ürün satışı yok.</p>
                        ) : topSoldItems.map((sold, idx) => (
                            <div key={sold.item.id} className="flex items-center gap-4 p-3 rounded-2xl bg-black/10 hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                <div className="relative shrink-0">
                                    <img
                                        src={sold.item.image}
                                        alt={sold.item.name}
                                        className="w-12 h-12 rounded-xl object-cover border border-border/50"
                                        referrerPolicy="no-referrer"
                                    />
                                    <span className="absolute -top-2 -left-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-lg">
                                        {idx + 1}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-sm truncate">{sold.item.name}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-black uppercase bg-accent/20 text-accent px-2 py-0.5 rounded-md">{sold.qty} Adet</span>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="font-black text-white">₺{sold.revenue.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

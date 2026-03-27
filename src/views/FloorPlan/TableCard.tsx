import React from 'react';
import { motion } from 'motion/react';
import { Users, Trash2, Clock } from 'lucide-react';
import { cn } from '../../utils';
import { Table, Order, User, Staff } from '../../types';

interface TableCardProps {
    table: Table;
    activeOrder?: Order;
    isManager: boolean;
    user: User | null;
    currentStaff: Staff | null;
    onDelete: (id: string, name: string) => void;
    onClick: (table: Table) => void;
    onTableAction?: (table: Table, action: 'open' | 'select' | 'createOrder') => void;
}

export const TableCard: React.FC<TableCardProps> = ({
    table,
    activeOrder,
    isManager,
    user,
    currentStaff,
    onDelete,
    onClick,
    onTableAction
}) => {
    let bgColor = "bg-[#252528]";
    let borderColor = "border-transparent";
    let textColor = "text-text-secondary";
    let statusText = "BOŞ";

    if (table.status === 'occupied') {
        bgColor = "bg-[#2A231C]";
        borderColor = "border-[#FCD34D]/20";
        textColor = "text-[#FCD34D]";
        statusText = "DOLU";
    } else if (table.status === 'bill-requested') {
        bgColor = "bg-[#1E1C2A]";
        borderColor = "border-[#A78BFA]/20";
        textColor = "text-[#A78BFA]";
        statusText = "HESAP İSTENDİ";
    } else {
        textColor = "text-[#4ADE80]";
    }

    return (
        <motion.div
            layout
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onClick(table)}
            className={cn(
                "rounded-[40px] p-8 border-2 transition-all cursor-pointer relative flex flex-col justify-between min-h-[240px] shadow-lg",
                bgColor, borderColor
            )}
        >
            <div className="flex justify-between items-start relative z-0">
                <div className="flex items-center gap-2">
                    {isManager && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(table.id, table.name); }}
                            className="p-1.5 text-text-secondary hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                    <h4 className="text-3xl font-black text-white">{table.name}</h4>
                </div>
                <div className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border", borderColor, textColor)}>
                    {statusText}
                </div>
            </div>

            <div className="space-y-4">
                {activeOrder && (
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-text-secondary">
                            <Clock size={14} className="opacity-40" />
                            <span className="text-[11px] font-bold uppercase tracking-widest opacity-60">AÇILIŞ: {table.occupiedTime}</span>
                        </div>
                        <div className="text-3xl font-black text-white mt-1">
                            ₺{activeOrder.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border", borderColor)}>
                            <Users size={14} className={textColor} />
                        </div>
                        <span className={cn("text-xs font-bold", textColor)}>{table.capacity} Kişilik</span>
                    </div>
                    {table.waiterName && (
                        <div className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white/5", textColor)}>
                            {table.waiterName}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

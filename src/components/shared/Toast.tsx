import React from 'react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CheckCircle2, AlertCircle, Plus } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const Toast = ({
    message,
    type,
    onClose
}: {
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
}) => (
    <motion.div
        initial={{ opacity: 0, y: 50, x: '-50%' }}
        animate={{ opacity: 1, y: 0, x: '-50%' }}
        exit={{ opacity: 0, y: 50, x: '-50%' }}
        className={cn(
            "fixed bottom-8 left-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[300px]",
            type === 'success' ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
        )}
    >
        {type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
        <span className="font-bold text-sm">{message}</span>
        <button onClick={onClose} className="ml-auto p-1 hover:bg-white/20 rounded-lg transition-colors">
            <Plus size={18} className="rotate-45" />
        </button>
    </motion.div>
);

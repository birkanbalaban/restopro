import React from 'react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const SidebarItem = ({
    icon: Icon,
    label,
    active,
    onClick,
    collapsed = false
}: {
    icon: any;
    label: string;
    active: boolean;
    onClick: () => void;
    collapsed?: boolean;
}) => (
    <button
        onClick={onClick}
        title={collapsed ? label : undefined}
        className={cn(
            "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200 group relative",
            active
                ? "bg-surface-hover text-white font-semibold"
                : "text-text-secondary hover:text-white",
            collapsed && "justify-center px-0"
        )}
    >
        <Icon size={18} className={cn(active ? "text-white" : "text-text-secondary group-hover:text-white transition-colors")} />
        {!collapsed && <span className="font-medium whitespace-nowrap">{label}</span>}
        {collapsed && active && (
            <motion.div
                layoutId="sidebar-active"
                className="absolute left-0 w-1 h-6 bg-accent rounded-r-full"
            />
        )}
    </button>
);

import { useState, useEffect } from 'react';
import { PrinterConfig } from '../types';

const STORAGE_KEY = 'restopro_printers';

const DEFAULT_PRINTERS: PrinterConfig[] = [
    { id: 'kitchen', name: 'Mutfak', color: 'red' },
    { id: 'bar', name: 'Bar', color: 'blue' },
];

export function usePrinters() {
    const [printers, setPrinters] = useState<PrinterConfig[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : DEFAULT_PRINTERS;
        } catch {
            return DEFAULT_PRINTERS;
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(printers));
    }, [printers]);

    const addPrinter = (printer: Omit<PrinterConfig, 'id'>) => {
        const id = printer.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        setPrinters(prev => [...prev, { ...printer, id }]);
    };

    const updatePrinter = (id: string, updates: Partial<PrinterConfig>) => {
        setPrinters(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    };

    const deletePrinter = (id: string) => {
        setPrinters(prev => prev.filter(p => p.id !== id));
    };

    return { printers, addPrinter, updatePrinter, deletePrinter };
}

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronRight, CheckCircle2 } from 'lucide-react';
import { cn } from '../utils';
import { Staff } from '../types';
import { firebaseService } from '../services/firebaseService';
import { TABLES, MENU_ITEMS, STAFF, INVENTORY, RESERVATIONS } from '../constants';

export const KeypadLogin = ({ staff, onLogin, user }: { staff: Staff[], onLogin: (s: Staff) => void, user: any }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [isIdentifying, setIsIdentifying] = useState(false);

    const handleNumber = (num: string) => {
        if (pin.length < 4) setPin(prev => prev + num);
    };

    const handleDelete = () => {
        setPin(prev => prev.slice(0, -1));
    };

    const handleLogin = () => {
        setIsIdentifying(true);
        // Try DB staff first
        let foundStaff = staff.find(s => s.pin === pin);

        // Fallback to constants if not found in DB or DB is empty
        if (!foundStaff) {
            foundStaff = STAFF.find(s => s.pin === pin);
        }

        if (foundStaff) {
            onLogin(foundStaff);
        } else {
            setError('Hatalı PIN kodu!');
            setPin('');
            setErrorCount(c => c + 1);
            setTimeout(() => {
                setError('');
                setIsIdentifying(false);
            }, 1000);
        }
    };

    const [errorCount, setErrorCount] = useState(0);

    useEffect(() => {
        if (pin.length === 4) {
            handleLogin();
        }
    }, [pin]);

    const shakeVariants = {
        shake: {
            x: [0, -10, 10, -10, 10, 0],
            transition: { duration: 0.4 }
        }
    };

    return (
        <div className="min-h-screen bg-bg flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass p-10 rounded-3xl max-w-sm w-full space-y-10 shadow-2xl"
            >
                <div className="text-center space-y-3">
                    <h1 className="text-4xl font-black tracking-tight">Resto<span className="text-accent">Pro</span></h1>
                    <p className="text-text-secondary text-xs uppercase tracking-widest font-bold opacity-60">Güvenli Giriş</p>
                </div>

                <div className="space-y-10">
                    <motion.div
                        variants={shakeVariants}
                        animate={error ? "shake" : ""}
                        className="flex justify-center gap-6"
                    >
                        {[1, 2, 3, 4].map((_, i) => (
                            <div key={i} className={cn(
                                "w-4 h-4 rounded-full border-2 transition-all duration-300",
                                error ? "border-rose-500 bg-rose-500/20" : "border-accent",
                                pin.length > i ? "bg-accent scale-125 shadow-[0_0_15px_rgba(157,123,250,0.4)]" : "bg-transparent"
                            )} />
                        ))}
                    </motion.div>

                    <div className="grid grid-cols-3 gap-5">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                            <button
                                key={num}
                                disabled={isIdentifying}
                                onClick={() => handleNumber(num.toString())}
                                className="glass h-20 rounded-2xl text-2xl font-black hover:bg-white/10 active:scale-90 transition-all disabled:opacity-50 border-white/5"
                            >
                                {num}
                            </button>
                        ))}
                        <button
                            disabled={isIdentifying}
                            onClick={handleDelete}
                            className="glass h-20 rounded-2xl flex items-center justify-center hover:bg-white/10 active:scale-90 transition-all disabled:opacity-50 border-white/5"
                        >
                            <ChevronRight className="rotate-180" size={28} />
                        </button>
                        <button
                            disabled={isIdentifying}
                            onClick={() => handleNumber('0')}
                            className="glass h-20 rounded-2xl text-2xl font-black hover:bg-white/10 active:scale-90 transition-all disabled:opacity-50 border-white/5"
                        >
                            0
                        </button>
                        <button
                            disabled={true}
                            className="glass h-20 rounded-2xl flex items-center justify-center opacity-10 border-white/5"
                        >
                            <CheckCircle2 size={28} />
                        </button>
                    </div>

                    {error && (
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-rose-500 text-center text-sm font-black uppercase tracking-wider"
                        >
                            {error}
                        </motion.p>
                    )}

                    {isIdentifying && !error && (
                        <p className="text-accent text-center text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">Kimlik doğrulanıyor</p>
                    )}
                </div>

                <div className="pt-6 flex flex-col items-center gap-4">
                    {staff.length === 0 && (
                        <button
                            onClick={() => onLogin(STAFF[0])}
                            className="bg-emerald-500/20 hover:bg-emerald-500 text-emerald-500 hover:text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-emerald-500/20 shadow-lg shadow-emerald-500/10 active:scale-95"
                        >
                            Hızlı Demo Girişi (Admin)
                        </button>
                    )}

                    <button
                        onClick={() => firebaseService.seed(TABLES, MENU_ITEMS, STAFF, INVENTORY)}
                        className="text-[8px] text-text-secondary/50 hover:text-emerald-500 uppercase tracking-tighter opacity-10 hover:opacity-100 transition-all"
                    >
                        Firebase Sıfırla / Seed Et
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

"use client";

import React, { useState, useEffect } from 'react';
import { useConfig } from "@/context/ConfigContext";
import { motion } from "framer-motion";
import { Calendar, Clock, AlertCircle, ChevronRight, Zap } from "lucide-react";

export const CountdownTimer = () => {
    const { fechaAsamblea, nombreAsamblea } = useConfig();
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
    const [isPast, setIsPast] = useState(false);

    useEffect(() => {
        if (!fechaAsamblea) return;

        const [year, month, day] = fechaAsamblea.split('-').map(Number);
        const targetDate = new Date(year, month - 1, day, 8, 0, 0);

        const calculateTimeLeft = () => {
            const now = new Date();
            const difference = targetDate.getTime() - now.getTime();

            if (difference > 0) {
                setIsPast(false);
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                });
            } else {
                setIsPast(true);
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            }
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(timer);
    }, [fechaAsamblea]);

    if (!timeLeft && !isPast) return null;

    // Vivid Premium Design: High Contrast & System Colors
    return (
        <div className="w-full mb-4">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`
                relative overflow-hidden rounded-[2rem] w-full shadow-2xl shadow-emerald-900/20
                ${isPast
                        ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600'
                        : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500'
                    }
            `}>
                {/* Decorative Background Elements - Glassy & Vivid */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-black/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

                {/* Pattern Overlay */}
                <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay pointer-events-none" />

                <div className="relative flex flex-col lg:flex-row items-center justify-between px-4 py-6 lg:px-10 lg:py-8 gap-6 lg:gap-8">

                    {/* Left: Event Info with High Impact */}
                    <div className="flex items-center gap-4 lg:gap-6 w-full lg:w-auto z-10">
                        <div className={`
                            p-3 lg:p-4 rounded-2xl shadow-xl shrink-0 backdrop-blur-md border border-white/20
                            ${isPast ? 'bg-white/20' : 'bg-white/10'}
                        `}>
                            {isPast
                                ? <AlertCircle className="w-6 h-6 lg:w-8 lg:h-8 text-white drop-shadow-md" />
                                : <Calendar className="w-6 h-6 lg:w-8 lg:h-8 text-white drop-shadow-md" />
                            }
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                {!isPast && (
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
                                    </span>
                                )}
                                <h3 className="text-[10px] lg:text-xs font-bold text-emerald-100 uppercase tracking-[0.2em] drop-shadow-sm">
                                    {isPast ? 'Evento Finalizado' : 'Cuenta Regresiva Oficial'}
                                </h3>
                            </div>
                            <h2 className="text-xl lg:text-3xl font-black text-white leading-tight tracking-tight drop-shadow-md">
                                {nombreAsamblea}
                            </h2>
                            <p className="text-white/80 text-xs lg:text-sm font-medium mt-1 flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5" />
                                {fechaAsamblea} • Asamblea.Cloud
                            </p>
                        </div>
                    </div>

                    {/* Right: The Timer (White Cards on Vivid Background) */}
                    {!isPast && timeLeft && (
                        <div className="flex items-center gap-2 lg:gap-4 z-10 w-full lg:w-auto justify-center lg:justify-end">
                            {[
                                { val: timeLeft.days, label: 'DÍAS' },
                                { val: timeLeft.hours, label: 'HORAS' },
                                { val: timeLeft.minutes, label: 'MIN' },
                                { val: timeLeft.seconds, label: 'SEG' }
                            ].map((item, i) => (
                                <div key={item.label} className="flex flex-col items-center">
                                    <motion.div
                                        whileHover={{ y: -2 }}
                                        className="relative bg-white rounded-xl lg:rounded-2xl w-14 h-14 lg:w-20 lg:h-20 flex items-center justify-center shadow-lg shadow-emerald-900/20 border-b-4 border-emerald-100/50"
                                    >
                                        <span className="text-2xl lg:text-4xl font-black text-teal-500 tabular-nums leading-none tracking-tight">
                                            {String(item.val).padStart(2, '0')}
                                        </span>
                                    </motion.div>
                                    <span className="text-[9px] lg:text-xs font-bold text-white/90 mt-2 uppercase tracking-widest drop-shadow-sm">
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Status Badge (Desktop Only) */}
                    <div className="hidden lg:block z-10">
                        <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isPast ? 'bg-amber-400' : 'bg-emerald-400'} shadow-[0_0_8px_rgba(52,211,153,0.6)]`} />
                            <span className="text-xs font-bold text-white uppercase tracking-wider">
                                {isPast ? 'Finalizado' : 'Sistema Activo'}
                            </span>
                        </div>
                    </div>

                </div>
            </motion.div>

            {isPast && (
                <div className="mt-3 text-center">
                    <p className="text-xs text-amber-600 font-bold bg-amber-50 py-1.5 px-6 rounded-full inline-block border border-amber-100">
                        La fecha del evento ({fechaAsamblea}) ha pasado.
                        Configura 2026 para reiniciar el contador.
                    </p>
                </div>
            )}
        </div>
    );
};

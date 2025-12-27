"use client";

import React, { useState, useEffect } from 'react';
import { useConfig } from "@/context/ConfigContext";
import { motion } from "framer-motion";
import { Calendar, AlertCircle } from "lucide-react";

const Digit = ({ value, label }: { value: string | number, label: string }) => (
    <motion.div
        className="flex flex-col items-center gap-1 md:gap-2"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
    >
        <div className="relative group">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />

            {/* Main digit container - Mobile optimized */}
            <div className="relative bg-gradient-to-br from-white via-white to-emerald-50/30 rounded-xl md:rounded-2xl border-2 border-emerald-100/50 px-3 py-3 md:px-5 md:py-4 min-w-[50px] md:min-w-[80px] shadow-[0_8px_30px_rgba(16,185,129,0.12)] backdrop-blur-sm flex items-center justify-center group-hover:shadow-[0_12px_40px_rgba(16,185,129,0.18)] transition-all duration-300">
                <span className="text-2xl md:text-4xl font-black bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent leading-none select-none tabular-nums">
                    {String(value).padStart(2, '0')}
                </span>
            </div>
        </div>
        <span className="text-[10px] md:text-xs font-bold text-slate-600 uppercase tracking-[0.15em] hidden sm:block">
            {label}
        </span>
    </motion.div>
);


const Separator = () => (
    <div className="flex flex-col justify-center gap-1.5 md:gap-3 pt-1 md:pt-2 px-0.5 md:px-2">
        <div className="w-1 h-1 md:w-2 md:h-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full shadow-lg shadow-emerald-500/30" />
        <div className="w-1 h-1 md:w-2 md:h-2 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full shadow-md shadow-emerald-400/20 opacity-60" />
    </div>
);

export const CountdownTimer = () => {
    const { fechaAsamblea, nombreAsamblea } = useConfig();
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    }>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [isPast, setIsPast] = useState(false);

    useEffect(() => {
        if (!fechaAsamblea) return;

        // Intentar parsear la fecha de forma segura
        // Si viene como YYYY-MM-DD
        const [year, month, day] = fechaAsamblea.split('-').map(Number);
        const targetDate = new Date(year, month - 1, day, 8, 0, 0); // 8 AM del día X

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

    return (
        <div className="w-full mb-8">
            <div className={`bg-gradient-to-r ${isPast ? 'from-amber-50 to-orange-50 border-amber-100' : 'from-[#f0fdf4] to-[#f8fafc] border-emerald-100'} rounded-[2rem] p-4 md:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 px-4 md:px-12 relative overflow-hidden transition-colors duration-500`}>

                {/* Logo Decorativo */}
                <div className="absolute top-1/2 -right-10 -translate-y-1/2 opacity-[0.04] pointer-events-none grayscale select-none">
                    <img src="/images/logo_coop.png" className="w-56" alt="" />
                </div>

                {/* Sección Izquierda */}
                <div className="flex items-center gap-4 md:gap-6 relative z-10 w-full md:w-auto">
                    <div className={`p-3.5 ${isPast ? 'bg-amber-600 shadow-amber-200' : 'bg-emerald-600 shadow-emerald-200'} rounded-2xl shadow-lg transition-colors flex-shrink-0`}>
                        {isPast ? <AlertCircle className="w-7 h-7 text-white" /> : <Calendar className="w-7 h-7 text-white" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className={`w-2 h-2 ${isPast ? 'bg-amber-500' : 'bg-emerald-500'} rounded-full animate-ping`} />
                            <h2 className={`text-[10px] font-black ${isPast ? 'text-amber-600' : 'text-emerald-600'} uppercase tracking-[0.2em] leading-tight italic`}>
                                {isPast ? 'Evento Finalizado / En Curso' : 'Cuenta Regresiva Oficial'}
                            </h2>
                        </div>
                        <p className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tight line-clamp-2 md:line-clamp-none">
                            {nombreAsamblea}
                        </p>
                    </div>
                </div>

                {/* Centro: El Reloj - Mobile Optimized */}
                <div className={`flex items-center justify-center gap-2 md:gap-8 relative z-10 w-full md:w-auto ${isPast ? 'bg-amber-100/50 border-amber-200/50 opacity-60' : 'bg-gradient-to-br from-emerald-50/80 via-teal-50/60 to-cyan-50/40 border-emerald-200/60'} p-3 md:p-4 md:px-8 rounded-2xl md:rounded-3xl border-2 backdrop-blur-md shadow-[0_8px_32px_rgba(16,185,129,0.15)] transition-all`}>
                    <Digit value={timeLeft.days} label="Días" />
                    <Separator />
                    <Digit value={timeLeft.hours} label="Horas" />
                    <Separator />
                    <Digit value={timeLeft.minutes} label="Minutos" />
                    <Separator />
                    <Digit value={timeLeft.seconds} label="Segundos" />
                </div>

                {/* Sección Derecha */}
                <div className="hidden lg:block relative z-10">
                    <div className={`px-6 py-2.5 bg-white border ${isPast ? 'border-amber-200' : 'border-emerald-100'} rounded-2xl shadow-sm flex items-center gap-4`}>
                        <div className="flex -space-x-1">
                            <div className={`w-2 h-2 ${isPast ? 'bg-amber-500' : 'bg-emerald-500'} rounded-full`} />
                            <div className={`w-2 h-2 ${isPast ? 'bg-amber-400' : 'bg-emerald-400'} rounded-full opacity-50`} />
                        </div>
                        <span className={`text-xs font-black ${isPast ? 'text-amber-800' : 'text-emerald-800'} uppercase tracking-widest`}>
                            {isPast ? 'Finalizado' : 'Activo'}
                        </span>
                    </div>
                </div>
            </div>

            {isPast && (
                <div className="mt-2 text-center">
                    <p className="text-xs text-amber-600 font-bold bg-amber-50 py-1 px-4 rounded-full inline-block border border-amber-100 italic">
                        Nota: La fecha configurada ({fechaAsamblea}) es anterior a la fecha de hoy.
                        <strong> Cambia el año a 2026 en Configuración</strong> si deseas ver el contador.
                    </p>
                </div>
            )}
        </div>
    );
};

"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Lock, X, ChevronRight, Sparkles } from 'lucide-react';
import axios from 'axios';

interface BlockInfo {
    bloqueado: boolean;
    mensaje: string;
    fechaLimite?: string;
}

export function DeadlineOverlay() {
    const [info, setInfo] = useState<BlockInfo | null>(null);
    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkDeadline = async () => {
            // Verificar si el usuario ya vio este mensaje en esta navegación
            const hasSeen = sessionStorage.getItem('deadline_notice_seen');
            if (hasSeen) {
                setLoading(false);
                return;
            }

            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("/api/configuracion/fecha-limite/verificar-bloqueo", {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (res.data.bloqueado) {
                    setInfo(res.data);
                    // Solo activar si realmente está bloqueado
                    setVisible(true);
                }
            } catch (error) {
                console.error("Error checking deadline for dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        checkDeadline();
    }, []);

    const handleClose = () => {
        setVisible(false);
        sessionStorage.setItem('deadline_notice_seen', 'true');
    };

    if (loading || !visible || !info) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6"
            >
                {/* Backdrop con Blur Ultra-Gordo */}
                <div
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-[20px]"
                    onClick={handleClose}
                />

                {/* Contenedor Principal */}
                <motion.div
                    initial={{ scale: 0.85, y: 30, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0, transition: { duration: 0.2 } }}
                    transition={{ type: "spring", damping: 20, stiffness: 100 }}
                    className="relative w-full max-w-2xl overflow-y-auto max-h-[85dvh] rounded-[1.5rem] md:rounded-[3rem] bg-white shadow-[0_30px_100px_rgba(0,0,0,0.5)] border border-white/20"
                >
                    {/* Header Visual Impactante - Ultra Low on Mobile */}
                    <div className="relative h-24 md:h-64 bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 flex items-center justify-center">
                        {/* Decoración de fondo */}
                        <div className="absolute inset-0 overflow-hidden">
                            <motion.div
                                animate={{
                                    rotate: 360,
                                    scale: [1, 1.2, 1],
                                }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute -top-1/2 -right-1/2 w-full h-full bg-white/10 rounded-full blur-3xl"
                            />
                            <div className="absolute top-10 left-10 w-20 h-20 bg-amber-400/20 rounded-full blur-2xl" />
                        </div>

                        {/* Icono Central Animado - Extra Scaled for Mobile */}
                        <div className="relative">
                            <motion.div
                                initial={{ rotate: -15, scale: 0.5 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: "spring", delay: 0.2 }}
                                className="bg-white/20 backdrop-blur-xl p-4 md:p-8 rounded-xl md:rounded-[2.5rem] border border-white/30 shadow-2xl shadow-orange-900/40"
                            >
                                <Lock className="h-8 w-8 md:h-24 md:w-24 text-white drop-shadow-[0_10px_15px_rgba(0,0,0,0.2)]" />
                            </motion.div>

                            <motion.div
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 3, repeat: Infinity }}
                                className="absolute -top-2 -right-2 bg-white p-1.5 rounded-lg shadow-xl border md:border-4 border-orange-500"
                            >
                                <Clock className="h-3 w-3 md:h-6 md:w-6 text-orange-600 animate-pulse" />
                            </motion.div>
                        </div>
                    </div>

                    {/* Contenido de Texto - Minimal Padding on Mobile */}
                    <div className="p-5 md:p-14 text-center space-y-3 md:space-y-6">
                        <div className="space-y-0.5 md:space-y-2">
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="flex items-center justify-center gap-2 text-orange-500 font-black uppercase tracking-[0.3em] text-[7px] md:text-[10px]"
                            >
                                <Sparkles className="h-2.5 w-2.5 md:h-4 md:w-4" />
                                Periodo Finalizado
                                <Sparkles className="h-2.5 w-2.5 md:h-4 md:w-4" />
                            </motion.div>

                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-xl md:text-5xl font-black text-slate-800 italic uppercase leading-tight"
                            >
                                ¡Tiempo <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-600 underline decoration-orange-100 decoration-2 md:decoration-8 underline-offset-1 md:underline-offset-4">Concluido!</span>
                            </motion.h2>
                        </div>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-slate-500 font-medium text-xs md:text-lg leading-relaxed max-w-[200px] md:max-w-sm mx-auto"
                        >
                            {info.mensaje || "El periodo de asignación ha finalizado."}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.6 }}
                            className="pt-1 md:pt-6"
                        >
                            <button
                                onClick={handleClose}
                                className="group relative w-full overflow-hidden rounded-xl md:rounded-[2rem] bg-slate-900 py-3 md:py-6 px-4 md:px-10 shadow-2xl transition-all hover:scale-105 active:scale-95"
                            >
                                {/* Brillo hover */}
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className="relative flex items-center justify-center gap-2 md:gap-4">
                                    <span className="text-[10px] md:text-sm font-black uppercase tracking-[0.2em] text-white">
                                        Continuar
                                    </span>
                                    <div className="h-5 w-5 md:h-8 md:w-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                        <ChevronRight className="h-3 w-3 md:h-5 md:w-5 text-white" />
                                    </div>
                                </div>
                            </button>

                            <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest italic animate-pulse">
                                Clic fuera para omitir
                            </p>
                        </motion.div>
                    </div>

                    {/* Botón de cierre discreto */}
                    <button
                        onClick={handleClose}
                        className="absolute top-6 right-6 p-3 bg-black/10 hover:bg-black/20 rounded-full transition-colors text-white"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

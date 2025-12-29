"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Sparkles, BookOpen, X, Rocket, CheckCircle } from "lucide-react";

interface TourWelcomeProps {
    onStartTour: () => void;
}

// Clave única para saber si el usuario ya vio el modal de bienvenida
const TOUR_WELCOME_KEY = "tour_welcome_dismissed";

export function TourWelcome({ onStartTour }: TourWelcomeProps) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        // Solo mostrar si no ha sido visto antes
        if (typeof window !== "undefined") {
            const dismissed = localStorage.getItem(TOUR_WELCOME_KEY);
            if (!dismissed) {
                // Pequeño delay para que la interfaz cargue primero
                const timer = setTimeout(() => setIsOpen(true), 800);
                return () => clearTimeout(timer);
            }
        }
    }, []);

    const handleStartTour = () => {
        setIsOpen(false);
        onStartTour();
    };

    const handleDismiss = () => {
        localStorage.setItem(TOUR_WELCOME_KEY, "true");
        setIsOpen(false);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
                    onClick={handleDismiss}
                />

                {/* Modal - Responsive */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md overflow-hidden"
                >
                    {/* Close button */}
                    <button
                        onClick={handleDismiss}
                        className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-1.5 sm:p-2 bg-white/20 hover:bg-white/40 rounded-xl transition-colors"
                    >
                        <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </button>

                    {/* Header con gradiente */}
                    <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-5 sm:p-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl" />

                        <div className="relative z-10 flex flex-col items-center">
                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                                className="inline-flex p-3 sm:p-4 bg-white/20 rounded-2xl sm:rounded-3xl mb-3 sm:mb-4 backdrop-blur-md shadow-lg border border-white/30"
                            >
                                <Rocket className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
                            </motion.div>
                            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                                ¡Bienvenido al Sistema!
                            </h2>
                            <p className="text-emerald-100 text-xs sm:text-sm mt-1 sm:mt-2 font-medium px-2 leading-relaxed">
                                ¿Es tu primera vez aquí? Te podemos guiar.
                            </p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-6">
                        <div className="bg-slate-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6">
                            <div className="flex items-start gap-2 sm:gap-3">
                                <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg sm:rounded-xl shrink-0">
                                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm sm:text-base">Guía Interactiva</h3>
                                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5 sm:mt-1 leading-relaxed">
                                        Te mostraremos paso a paso las funciones principales del sistema en menos de 1 minuto.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Features - Compactas en móvil */}
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6 justify-center">
                            {["Dashboard", "Mis Listas", "Asignación", "Reportes"].map((feature) => (
                                <span
                                    key={feature}
                                    className="inline-flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[10px] sm:text-xs font-bold"
                                >
                                    <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                    {feature}
                                </span>
                            ))}
                        </div>

                        {/* Buttons - Stack en móvil muy pequeño, row en otros */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <button
                                onClick={handleDismiss}
                                className="flex-1 py-2.5 sm:py-3 px-4 border-2 border-slate-200 text-slate-600 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm hover:bg-slate-50 transition-all order-2 sm:order-1"
                            >
                                No, gracias
                            </button>
                            <button
                                onClick={handleStartTour}
                                className="flex-1 py-2.5 sm:py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 order-1 sm:order-2"
                            >
                                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                Ver Guía Rápida
                            </button>
                        </div>

                        <p className="text-center text-[9px] sm:text-[10px] text-slate-400 mt-3 sm:mt-4 font-medium">
                            Puedes ver la guía más tarde desde Configuración
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

// Función para resetear el estado (útil desde configuración)
export function resetTourWelcome() {
    if (typeof window !== "undefined") {
        localStorage.removeItem(TOUR_WELCOME_KEY);
    }
}

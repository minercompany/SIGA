"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Star, X, User, ArrowRight, Sparkles, Crown, Shield, Users } from "lucide-react";
import axios from "axios";

interface Candidato {
    id: number;
    socio: {
        nombreCompleto: string;
    };
    organo: string;
    tipo: string;
    foto?: string;
    biografia?: string;
}

const ORGANO_INFO: Record<string, { label: string, icon: React.ComponentType<{ className?: string }>, gradient: string, shadow: string }> = {
    "CONSEJO_ADMINISTRACION": {
        label: "Consejo de Administración",
        icon: Crown,
        gradient: "from-emerald-500 to-teal-600",
        shadow: "shadow-emerald-500/30"
    },
    "JUNTA_VIGILANCIA": {
        label: "Junta de Vigilancia",
        icon: Shield,
        gradient: "from-blue-500 to-indigo-600",
        shadow: "shadow-blue-500/30"
    },
    "JUNTA_ELECTORAL": {
        label: "Junta Electoral",
        icon: Users,
        gradient: "from-amber-500 to-orange-600",
        shadow: "shadow-amber-500/30"
    }
};

export function CandidateSpotlight() {
    const [candidato, setCandidato] = useState<Candidato | null>(null);
    const [isVisible, setIsVisible] = useState<boolean>(false);
    const [allCandidatos, setAllCandidatos] = useState<Candidato[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [spotlightEnabled, setSpotlightEnabled] = useState(true);

    useEffect(() => {
        const preference = localStorage.getItem("spotlight_enabled");
        if (preference === "false") {
            setSpotlightEnabled(false);
        } else {
            // Check global configuration
            const checkGlobalConfig = async () => {
                try {
                    const token = localStorage.getItem("token");
                    if (!token) return;

                    const res = await axios.get("/api/configuracion", {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (res.data && res.data["CANDIDATE_SPOTLIGHT_ENABLED"] === "false") {
                        setSpotlightEnabled(false);
                    }
                } catch (err) {
                    console.error("Error fetching configuration:", err);
                }
            };
            checkGlobalConfig();
        }
    }, []);

    useEffect(() => {
        if (!spotlightEnabled) return;

        const cargar = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) return;
                const res = await axios.get("/api/candidatos", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data && res.data.length > 0) {
                    setAllCandidatos(res.data);
                } else {
                    setAllCandidatos([]);
                    setIsVisible(false);
                    setCandidato(null);
                }
            } catch (err) {
                console.error("Error spotlight:", err);
            }
        };
        cargar();

        const refreshInterval = setInterval(cargar, 30000);
        return () => clearInterval(refreshInterval);
    }, [spotlightEnabled]);

    useEffect(() => {
        if (!spotlightEnabled) {
            setIsVisible(false);
            setCandidato(null);
            return;
        }

        if (allCandidatos.length === 0) {
            setIsVisible(false);
            setCandidato(null);
            return;
        }

        const showNext = () => {
            // Show on mobile too now since it's responsive
            if (allCandidatos.length === 0) return;
            if (window.location.pathname.includes('/candidatos')) return;

            const safeIndex = currentIndex % allCandidatos.length;
            setCandidato(allCandidatos[safeIndex]);
            setIsVisible(true);

            setTimeout(() => {
                setIsVisible(false);
            }, 12000);

            setCurrentIndex((prev: number) => (prev + 1) % allCandidatos.length);
        };

        const initialDelay = setTimeout(showNext, 5000);
        const interval = setInterval(showNext, 60000);

        return () => {
            clearTimeout(initialDelay);
            clearInterval(interval);
        };
    }, [allCandidatos, currentIndex, spotlightEnabled]);

    if (!candidato) return null;

    const info = ORGANO_INFO[candidato.organo] || ORGANO_INFO["CONSEJO_ADMINISTRACION"];
    const IconComponent = info.icon;

    const handleDisableNotifications = () => {
        localStorage.setItem("spotlight_enabled", "false");
        setSpotlightEnabled(false);
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 30 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden"
                    >
                        {/* Animated background decoration */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <motion.div
                                animate={{
                                    x: [0, 30, 0],
                                    y: [0, -20, 0],
                                    scale: [1, 1.2, 1]
                                }}
                                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                                className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${info.gradient} opacity-20 rounded-full blur-2xl`}
                            />
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={() => setIsVisible(false)}
                            className="absolute top-4 right-4 z-20 h-8 w-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition-all"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="relative p-6 md:p-8 flex flex-col items-center text-center">
                            {/* Header Badge */}
                            <motion.div
                                initial={{ y: -10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.1 }}
                                className="flex items-center gap-2 mb-5"
                            >
                                <motion.div
                                    animate={{ rotate: [0, 360] }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                >
                                    <Sparkles className="h-4 w-4 text-emerald-500" />
                                </motion.div>
                                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                                    ¡Conoce a tu candidato!
                                </span>
                            </motion.div>

                            {/* Organ Badge */}
                            <motion.div
                                initial={{ y: -10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.15 }}
                                className={`inline-flex items-center gap-2 bg-gradient-to-r ${info.gradient} px-4 py-2 rounded-full mb-5 shadow-lg ${info.shadow}`}
                            >
                                <IconComponent className="h-4 w-4 text-white" />
                                <span className="text-white text-xs font-semibold">{info.label}</span>
                            </motion.div>

                            {/* Photo Section */}
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.2, type: "spring" }}
                                className="relative mb-5"
                            >
                                <motion.div
                                    className={`absolute inset-0 bg-gradient-to-br ${info.gradient} blur-xl opacity-30 scale-110`}
                                    animate={{ opacity: [0.2, 0.4, 0.2] }}
                                    transition={{ duration: 3, repeat: Infinity }}
                                />
                                <div className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-[1.5rem] overflow-hidden ring-4 ring-white shadow-2xl">
                                    {candidato.foto ? (
                                        <img src={candidato.foto} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                            <User className="h-12 w-12 text-slate-400" />
                                        </div>
                                    )}
                                </div>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.4, type: "spring" }}
                                    className={`absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gradient-to-r ${info.gradient} rounded-full px-4 py-1 shadow-lg`}
                                >
                                    <span className="text-white text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                                        {candidato.tipo}
                                    </span>
                                </motion.div>
                            </motion.div>

                            {/* Name */}
                            <motion.h3
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-xl sm:text-2xl font-bold text-slate-800 mb-6 leading-tight"
                            >
                                {candidato.socio?.nombreCompleto}
                            </motion.h3>

                            {/* Action Button */}
                            <motion.button
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => window.location.href = '/candidatos'}
                                className={`w-full bg-gradient-to-r ${info.gradient} text-white py-4 rounded-2xl font-semibold text-sm uppercase tracking-wider shadow-xl ${info.shadow} flex items-center justify-center gap-2`}
                            >
                                Conocer Más
                                <ArrowRight className="h-4 w-4" />
                            </motion.button>

                            {/* Bottom Controls */}
                            <motion.div
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="mt-5 pt-5 border-t border-slate-100 w-full"
                            >
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsVisible(false)}
                                        className="flex-1 text-slate-500 hover:text-slate-700 text-xs font-semibold uppercase tracking-wide py-2 px-3 rounded-xl hover:bg-slate-50 transition-all"
                                    >
                                        Más tarde
                                    </button>
                                    <button
                                        onClick={handleDisableNotifications}
                                        className="flex-1 text-red-400 hover:text-red-500 text-xs font-semibold uppercase tracking-wide py-2 px-3 rounded-xl hover:bg-red-50 transition-all"
                                    >
                                        Desactivar
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
